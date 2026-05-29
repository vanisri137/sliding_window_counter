package com.ratelimiter.controller;

import com.ratelimiter.dto.*;
import com.ratelimiter.service.RateLimiterService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller exposing the Sliding Window Counter Rate Limiter
 * through four core APIs plus a dynamic-config endpoint.
 */
@RestController
@RequestMapping("/api")
public class RateLimiterController {

    private final RateLimiterService service;

    public RateLimiterController(RateLimiterService service) {
        this.service = service;
    }

    // ── API 1: Send Request ───────────────────────────────────────────────────

    /**
     * POST /api/request
     * Body: { "clientId": "user1" }
     *
     * Returns 200 if allowed, 429 if rate-limited.
     */
    @PostMapping("/request")
    public ResponseEntity<RateLimitResponse> sendRequest(@RequestBody RateLimitRequest request) {
        RateLimitResponse response = service.handleRequest(request.clientId());
        HttpStatus status = response.allowed() ? HttpStatus.OK : HttpStatus.TOO_MANY_REQUESTS;
        return ResponseEntity.status(status).body(response);
    }

    // ── API 2: Statistics ─────────────────────────────────────────────────────

    /**
     * GET /api/stats/{clientId}
     */
    @GetMapping("/stats/{clientId}")
    public ResponseEntity<StatsResponse> getStats(@PathVariable String clientId) {
        return ResponseEntity.ok(service.getStats(clientId));
    }

    // ── API 3: Reset Client ───────────────────────────────────────────────────

    /**
     * DELETE /api/reset/{clientId}
     */
    @DeleteMapping("/reset/{clientId}")
    public ResponseEntity<Void> reset(@PathVariable String clientId) {
        service.reset(clientId);
        return ResponseEntity.noContent().build();
    }

    // ── API 4: Health Check ───────────────────────────────────────────────────

    /**
     * GET /api/health
     */
    @GetMapping("/health")
    public ResponseEntity<HealthResponse> health() {
        return ResponseEntity.ok(new HealthResponse("UP"));
    }

    // ── API 5: Dynamic Configuration ─────────────────────────────────────────

    /**
     * GET /api/config  — read current configuration
     */
    @GetMapping("/config")
    public ResponseEntity<ConfigResponse> getConfig() {
        return ResponseEntity.ok(service.getCurrentConfig());
    }

    /**
     * PUT /api/config  — update limit / window / sub-window at runtime
     * Body: { "limit": 10, "windowSeconds": 60, "subWindowSeconds": 10 }
     */
    @PutMapping("/config")
    public ResponseEntity<ConfigResponse> updateConfig(@RequestBody ConfigUpdateRequest request) {
        ConfigResponse updated = service.reconfigure(
                request.limit(),
                request.windowSeconds(),
                request.subWindowSeconds());
        return ResponseEntity.ok(updated);
    }
}
