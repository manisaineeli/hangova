package com.hangova.gateway.config;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Module 1 - JWT based authentication at the edge.
 * <p>
 * The gateway validates the bearer token issued by user-service and forwards the
 * decoded identity to the downstream microservices as request headers, so every
 * service can authorise without calling user-service again.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Value("${hangova.jwt.secret}")
    private String secret;

    @Value("${hangova.jwt.issuer}")
    private String issuer;

    @Bean
    public SecretKey jwtSecretKey() {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    /** Gateway is reactive (WebFlux), so the decoder must be the reactive one. */
    @Bean
    public ReactiveJwtDecoder jwtDecoder(SecretKey key) {
        return NimbusReactiveJwtDecoder.withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                // the SPA has no cookies/sessions, so CSRF does not apply
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(Customizer.withDefaults())
                .authorizeExchange(ex -> ex
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // public endpoints: login/register + live travel info
                        .pathMatchers("/api/auth/**", "/api/places/**", "/api/weather/**",
                                "/api/hotels/**", "/api/transport/**").permitAll()
                        // everything else must carry a valid JWT
                        .pathMatchers("/api/**").authenticated()
                        .pathMatchers("/actuator/health", "/actuator/info", "/actuator/gateway").permitAll()
                        .anyExchange().permitAll())
                .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
                .build();
    }
}
