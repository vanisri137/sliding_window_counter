package com.ratelimiter.service;

import com.ratelimiter.config.RateLimiterProperties;
import com.ratelimiter.dto.ConfigResponse;
import com.ratelimiter.dto.RateLimitResponse;
import com.ratelimiter.dto.StatsResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import redis.clients.jedis.Jedis;

/**
 * Thin service layer that delegates to the existing
 * {@link SlidingWindowCounterRateLimiter} and adds:
 *  - stats / reset helpers
 *  - dynamic reconfiguration (rebuilds the rate-limiter with new params)
 */
@Service
public class RateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterService.class);

    private final Jedis jedis;
    private final RateLimiterProperties props;

    // volatile so reconfigure() is visible across threads
    private volatile SlidingWindowCounterRateLimiter rateLimiter;

    public RateLimiterService(Jedis jedis,
                              RateLimiterProperties props,
                              SlidingWindowCounterRateLimiter rateLimiter) {
        this.jedis       = jedis;
        this.props       = props;
        this.rateLimiter = rateLimiter;
    }

    // ── Core API ─────────────────────────────────────────────────────────────

    public RateLimitResponse handleRequest(String clientId) {
        log.debug("Handling request for client={}", clientId);
        boolean allowed = rateLimiter.isAllowed(clientId);
        int  limit         = rateLimiter.getLimit();
        long windowSeconds = rateLimiter.getWindowSize();

        if (allowed) {
            long current   = rateLimiter.getCurrentCount(clientId);
            long remaining = Math.max(0, limit - current);
            return RateLimitResponse.allowed(remaining, limit, windowSeconds);
        } else {
            return RateLimitResponse.denied(limit, windowSeconds);
        }
    }

    public StatsResponse getStats(String clientId) {
        long current   = rateLimiter.getCurrentCount(clientId);
        int  limit     = rateLimiter.getLimit();
        long remaining = Math.max(0, limit - current);
        return new StatsResponse(
                clientId, current, remaining,
                limit,
                rateLimiter.getWindowSize(),
                rateLimiter.getSubWindowSize());
    }

    public void reset(String clientId) {
        log.info("Resetting rate-limit state for client={}", clientId);
        rateLimiter.reset(clientId);
    }

    // ── Dynamic configuration ─────────────────────────────────────────────────

    /**
     * Update config and rebuild the rate-limiter without restarting the server.
     */
    public synchronized ConfigResponse reconfigure(int limit, long windowSeconds, long subWindowSeconds) {
        props.setLimit(limit);
        props.setWindowSeconds(windowSeconds);
        props.setSubWindowSeconds(subWindowSeconds);

        rateLimiter = new SlidingWindowCounterRateLimiter(jedis, limit, windowSeconds, subWindowSeconds);
        log.info("Rate limiter reconfigured: limit={} window={}s subWindow={}s",
                limit, windowSeconds, subWindowSeconds);

        return new ConfigResponse(limit, windowSeconds, subWindowSeconds);
    }

    public ConfigResponse getCurrentConfig() {
        return new ConfigResponse(
                rateLimiter.getLimit(),
                rateLimiter.getWindowSize(),
                rateLimiter.getSubWindowSize());
    }
}
