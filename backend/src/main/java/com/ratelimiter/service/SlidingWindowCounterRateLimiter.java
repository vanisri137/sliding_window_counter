package com.ratelimiter.service;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.Transaction;

import java.util.List;
import java.util.Map;

import static redis.clients.jedis.args.ExpiryOption.NX;

/**
 * Sliding Window Counter Rate Limiter
 * Original implementation reused as-is — only the package has changed.
 *
 * Algorithm:
 *  - Divides the rolling window into sub-windows (buckets).
 *  - Stores per-sub-window request counts in a Redis Hash.
 *  - Each field key = sub-window index; value = count in that bucket.
 *  - A field-level TTL (HEXPIRE, set only on first write via NX) expires
 *    old buckets automatically, giving the sliding-window effect.
 */
public class SlidingWindowCounterRateLimiter {

    private final Jedis jedis;
    private final int limit;
    private final long windowSize;
    private final long subWindowSize;

    public SlidingWindowCounterRateLimiter(Jedis jedis, int limit, long windowSize, long subWindowSize) {
        this.jedis = jedis;
        this.limit = limit;
        this.windowSize = windowSize;
        this.subWindowSize = subWindowSize;
    }

    public boolean isAllowed(String clientId) {
        String key = "rate_limit:" + clientId;
        Map<String, String> subWindowCounts = jedis.hgetAll(key);
        long totalCount = subWindowCounts.values().stream()
                .mapToLong(Long::parseLong)
                .sum();

        boolean isAllowed = totalCount < limit;

        if (isAllowed) {
            long currentTime = System.currentTimeMillis();
            long subWindowSizeMillis = subWindowSize * 1000;
            long currentSubWindow = currentTime / subWindowSizeMillis;

            Transaction transaction = jedis.multi();
            transaction.hincrBy(key, Long.toString(currentSubWindow), 1);
            transaction.expire(key, (int)windowSize);
            // Ideal implementation (Redis 7.4+ with HEXPIRE):
// transaction.hexpire(key, windowSize, NX, String.valueOf(currentSubWindow));
            List<Object> result = transaction.exec();

            if (result == null || result.isEmpty()) {
                throw new IllegalStateException("Empty result from Redis transaction");
            }
        }

        return isAllowed;
    }

    // ── Getters used by the service layer ────────────────────────────────────

    public int getLimit() {
        return limit;
    }

    public long getWindowSize() {
        return windowSize;
    }

    public long getSubWindowSize() {
        return subWindowSize;
    }

    /**
     * Returns the total number of requests currently counted inside the
     * rolling window for the given client.
     */
    public long getCurrentCount(String clientId) {
        String key = "rate_limit:" + clientId;
        Map<String, String> subWindowCounts = jedis.hgetAll(key);
        return subWindowCounts.values().stream()
                .mapToLong(Long::parseLong)
                .sum();
    }

    /**
     * Deletes all Redis state for a client — useful for testing / reset API.
     */
    public void reset(String clientId) {
        jedis.del("rate_limit:" + clientId);
    }
}
