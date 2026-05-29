package com.ratelimiter;

import com.redis.testcontainers.RedisContainer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import redis.clients.jedis.Jedis;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RateLimiterIntegrationTest {

    static final RedisContainer redis =
            new RedisContainer("redis:latest").withExposedPorts(6379).withReuse(true);

    static {
        redis.start();
    }

    @DynamicPropertySource
    static void redisProps(DynamicPropertyRegistry registry) {
        registry.add("redis.host", redis::getHost);
        registry.add("redis.port", () -> redis.getFirstMappedPort().toString());
    }

    @Autowired MockMvc mockMvc;
    @Autowired Jedis   jedis;

    @BeforeEach
    void clean() {
        jedis.flushAll();
        // Reset config to defaults before each test
    }

    // ── Health ────────────────────────────────────────────────────────────────

    @Test
    void health_returnsUp() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    // ── POST /api/request ─────────────────────────────────────────────────────

    @Test
    void firstRequest_isAllowed() throws Exception {
        mockMvc.perform(post("/api/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"clientId":"test-user"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowed").value(true))
                .andExpect(jsonPath("$.remainingRequests").isNumber());
    }

    @Test
    void requestsBeyondLimit_areRateLimited() throws Exception {
        // Reconfigure to a tiny limit for this test
        mockMvc.perform(put("/api/config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"limit":2,"windowSeconds":60,"subWindowSeconds":10}
                                """))
                .andExpect(status().isOk());

        // First two requests should succeed
        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post("/api/request")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"clientId":"limited-user"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.allowed").value(true));
        }

        // Third request should be rate-limited
        mockMvc.perform(post("/api/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"clientId":"limited-user"}
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.allowed").value(false))
                .andExpect(jsonPath("$.message").value("Rate limit exceeded"));
    }

    // ── GET /api/stats/{clientId} ─────────────────────────────────────────────

    @Test
    void stats_returnsCorrectCount() throws Exception {
        String body = """
                {"clientId":"stats-user"}
                """;
        mockMvc.perform(post("/api/request").contentType(MediaType.APPLICATION_JSON).content(body));
        mockMvc.perform(post("/api/request").contentType(MediaType.APPLICATION_JSON).content(body));

        mockMvc.perform(get("/api/stats/stats-user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentRequests").value(2))
                .andExpect(jsonPath("$.clientId").value("stats-user"));
    }

    // ── DELETE /api/reset/{clientId} ──────────────────────────────────────────

    @Test
    void reset_clearsClientState() throws Exception {
        String body = """
                {"clientId":"reset-user"}
                """;
        mockMvc.perform(post("/api/request").contentType(MediaType.APPLICATION_JSON).content(body));

        mockMvc.perform(delete("/api/reset/reset-user"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/stats/reset-user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentRequests").value(0));
    }

    // ── PUT /api/config ───────────────────────────────────────────────────────

    @Test
    void config_canBeUpdatedAtRuntime() throws Exception {
        mockMvc.perform(put("/api/config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"limit":20,"windowSeconds":120,"subWindowSeconds":15}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.limit").value(20))
                .andExpect(jsonPath("$.windowSeconds").value(120))
                .andExpect(jsonPath("$.subWindowSeconds").value(15));
    }

    // ── Multiple clients are independent ─────────────────────────────────────

    @Test
    void multipleClients_areIndependent() throws Exception {
        mockMvc.perform(put("/api/config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"limit":1,"windowSeconds":60,"subWindowSeconds":10}
                                """));

        // Exhaust user-A
        mockMvc.perform(post("/api/request")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"clientId":"user-A"}
                        """));

        // user-B should still be allowed
        mockMvc.perform(post("/api/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"clientId":"user-B"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowed").value(true));
    }
}
