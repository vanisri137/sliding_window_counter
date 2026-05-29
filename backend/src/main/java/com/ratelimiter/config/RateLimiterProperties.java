package com.ratelimiter.config;

import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Mutable rate-limiter parameters.
 *
 * These values start from application.properties defaults and can be updated
 * at runtime via PUT /api/config without restarting the server.
 *
 * Note: changing limit/window/subWindow recreates the SlidingWindowCounterRateLimiter
 * bean inside RateLimiterService — see RateLimiterService#reconfigure().
 */
@Component
public class RateLimiterProperties {

    private final AtomicInteger limit          = new AtomicInteger(10);
    private final AtomicLong   windowSeconds   = new AtomicLong(60);
    private final AtomicLong   subWindowSeconds = new AtomicLong(10);

    public int  getLimit()            { return limit.get(); }
    public long getWindowSeconds()    { return windowSeconds.get(); }
    public long getSubWindowSeconds() { return subWindowSeconds.get(); }

    public void setLimit(int v)             { limit.set(v); }
    public void setWindowSeconds(long v)    { windowSeconds.set(v); }
    public void setSubWindowSeconds(long v) { subWindowSeconds.set(v); }
}
