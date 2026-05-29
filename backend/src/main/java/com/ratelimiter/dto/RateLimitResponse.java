package com.ratelimiter.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RateLimitResponse(
        boolean allowed,
        long    remainingRequests,
        int     limit,
        long    windowSeconds,
        String  message
) {
    public static RateLimitResponse allowed(long remaining, int limit, long windowSeconds) {
        return new RateLimitResponse(true, remaining, limit, windowSeconds, null);
    }

    public static RateLimitResponse denied(int limit, long windowSeconds) {
        return new RateLimitResponse(false, 0, limit, windowSeconds, "Rate limit exceeded");
    }
}
