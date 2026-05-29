package com.ratelimiter.dto;

/**
 * Response for GET /api/stats/{clientId}
 */
public record StatsResponse(
        String clientId,
        long   currentRequests,
        long   remainingRequests,
        int    limit,
        long   windowSeconds,
        long   subWindowSeconds
) {}
