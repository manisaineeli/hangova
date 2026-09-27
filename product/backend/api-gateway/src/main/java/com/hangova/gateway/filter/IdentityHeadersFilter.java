package com.hangova.gateway.filter;

import java.util.Collection;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

/**
 * Copies the validated JWT identity into trusted internal headers so the
 * microservices behind the gateway can authorise requests without re-parsing
 * (or trusting) the token themselves.
 * <p>
 * The client-supplied values are always stripped first, so a caller cannot
 * spoof an identity by setting the X-User-* headers directly.
 */
@Component
public class IdentityHeadersFilter implements GlobalFilter, Ordered {

    public static final String USER_ID = "X-User-Id";
    public static final String USER_EMAIL = "X-User-Email";
    public static final String USER_ROLE = "X-User-Role";
    public static final String USER_NAME = "X-User-Name";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Note: the chain is invoked exactly once. We must not use switchIfEmpty
        // here because a GatewayFilterChain returns an empty Mono<Void> on success.
        return exchange.getPrincipal()
                .ofType(JwtAuthenticationToken.class)
                .cast(JwtAuthenticationToken.class)
                .map(auth -> withIdentity(exchange, auth.getToken()))
                .defaultIfEmpty(exchange)
                .flatMap(chain::filter);
    }

    private ServerWebExchange withIdentity(ServerWebExchange exchange, Jwt jwt) {
        var request = exchange.getRequest().mutate().headers(headers -> {
            // never trust anything the client sent for these headers
            headers.remove(USER_ID);
            headers.remove(USER_EMAIL);
            headers.remove(USER_ROLE);
            headers.remove(USER_NAME);

            String uid = jwt.getClaimAsString("uid");
            headers.set(USER_ID, uid != null ? uid : jwt.getSubject());

            String email = jwt.getClaimAsString("email");
            headers.set(USER_EMAIL, email != null ? email : "");

            Object roles = jwt.getClaim("roles");
            if (roles instanceof Collection<?> c && !c.isEmpty()) {
                headers.set(USER_ROLE, String.valueOf(c.iterator().next()));
            } else {
                headers.set(USER_ROLE, "USER");
            }

            String name = jwt.getClaimAsString("name");
            headers.set(USER_NAME, name != null ? name : "");
        }).build();
        return exchange.mutate().request(request).build();
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE - 100;
    }
}
