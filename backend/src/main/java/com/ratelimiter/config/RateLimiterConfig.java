package com.ratelimiter.config;

import com.ratelimiter.service.SlidingWindowCounterRateLimiter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

/**
 * Wires Redis (JedisPool) and the SlidingWindowCounterRateLimiter.
 *
 * Default values come from application.properties but can be overridden
 * at runtime via the /api/config endpoint (see RateLimiterProperties).
 */
@Configuration
public class RateLimiterConfig {

    @Value("${redis.host:localhost}")
    private String redisHost;

    @Value("${redis.port:6379}")
    private int redisPort;

    @Bean
    public JedisPool jedisPool() {
        JedisPoolConfig poolConfig = new JedisPoolConfig();
        poolConfig.setMaxTotal(20);
        poolConfig.setMaxIdle(10);
        poolConfig.setMinIdle(2);
        poolConfig.setTestOnBorrow(true);
        return new JedisPool(poolConfig, redisHost, redisPort);
    }

    /**
     * Expose a single Jedis instance for the rate-limiter bean.
     * For production, prefer borrowing from the pool inside each request;
     * here we keep it simple to stay close to the original implementation.
     */
    @Bean
    public Jedis jedis(JedisPool jedisPool) {
        return jedisPool.getResource();
    }

    @Bean
    public SlidingWindowCounterRateLimiter slidingWindowCounterRateLimiter(
            Jedis jedis,
            RateLimiterProperties props) {
        return new SlidingWindowCounterRateLimiter(
                jedis,
                props.getLimit(),
                props.getWindowSeconds(),
                props.getSubWindowSeconds());
    }
}
