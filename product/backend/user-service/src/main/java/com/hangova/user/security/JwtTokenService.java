package com.hangova.user.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import com.hangova.user.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Component;

/**
 * Issues the HS256 bearer tokens used across all microservices.
 * <p>
 * The gateway and (defensively) the downstream services verify these with the
 * same shared secret.
 */
@Component
public class JwtTokenService {

    private final JwtEncoder encoder;
    private final String issuer;
    private final long ttlHours;

    public JwtTokenService(@Value("${hangova.jwt.secret}") String secret,
                           @Value("${hangova.jwt.issuer}") String issuer,
                           @Value("${hangova.jwt.ttl-hours:12}") long ttlHours) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        SecretKey key = new SecretKeySpec(bytes, "HmacSHA256");
        this.encoder = NimbusJwtEncoder.withSecretKey(key).algorithm(MacAlgorithm.HS256).build();
        this.issuer = issuer;
        this.ttlHours = ttlHours;
    }

    public String issue(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(now)
                .expiresAt(now.plus(ttlHours, ChronoUnit.HOURS))
                .subject(user.getId())
                .claim("uid", user.getId())
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .claim("role", user.getRole())
                .claim("roles", List.of(user.getRole()))
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long ttlSeconds() {
        return ttlHours * 3600;
    }
}
