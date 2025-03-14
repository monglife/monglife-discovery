package com.monglife.discovery.domain.account.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisKeyValueAdapter;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration("accountRedisConfig")
@EnableRedisRepositories(
        basePackages = "com.monglife.discovery.domain.account.repository",
        redisTemplateRef = "accountRedisTemplate",
        enableKeyspaceEvents = RedisKeyValueAdapter.EnableKeyspaceEvents.ON_STARTUP
)
public class RedisConfig {

    @Value("${spring.data.account.redis.host}")
    private String host;

    @Value("${spring.data.account.redis.port}")
    private int port;

    @Value("${spring.data.account.redis.password}")
    private String password;

    @Value("${spring.data.account.redis.database}")
    private Integer database;

    @Bean(name = "accountRedisConnectionFactory")
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration redisStandaloneConfiguration = new RedisStandaloneConfiguration();
        redisStandaloneConfiguration.setHostName(host);
        redisStandaloneConfiguration.setPort(port);
        redisStandaloneConfiguration.setPassword(password);
        redisStandaloneConfiguration.setDatabase(database);
        return new LettuceConnectionFactory(redisStandaloneConfiguration);
    }

    @Bean(name = "accountRedisTemplate")
    public RedisTemplate<String, ?> redisTemplate(@Qualifier("accountRedisConnectionFactory") RedisConnectionFactory redisConnectionFactory){
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnectionFactory);
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return redisTemplate;
    }
}
