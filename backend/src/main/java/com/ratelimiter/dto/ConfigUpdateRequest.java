package com.ratelimiter.dto;

public record ConfigUpdateRequest(int limit, long windowSeconds, long subWindowSeconds) {}
