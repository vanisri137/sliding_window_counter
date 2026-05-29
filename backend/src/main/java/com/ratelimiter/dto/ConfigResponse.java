package com.ratelimiter.dto;

public record ConfigResponse(
        int  limit,
        long windowSeconds,
        long subWindowSeconds
) {}
