package com.hangova.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Single entry point of the system: every client request is matched here and
 * forwarded to the microservice that owns it.
 * <p>
 * Routes are declared in code rather than YAML so the mapping is explicit and
 * cannot silently break if the configuration namespace changes.
 */
@Configuration
public class RouteConfig {

    private final String userUrl;
    private final String tripUrl;
    private final String bookingUrl;
    private final String infoUrl;

    public RouteConfig(
            @Value("${hangova.services.user:http://localhost:8081}") String userUrl,
            @Value("${hangova.services.trip:http://localhost:8082}") String tripUrl,
            @Value("${hangova.services.booking:http://localhost:8083}") String bookingUrl,
            @Value("${hangova.services.info:http://localhost:8084}") String infoUrl) {
        this.userUrl = normalise(userUrl);
        this.tripUrl = normalise(tripUrl);
        this.bookingUrl = normalise(bookingUrl);
        this.infoUrl = normalise(infoUrl);
    }

    /**
     * Accepts a bare host or host:port as well as a full URL.
     *
     * Render injects internal addresses in the form "host:port" with no scheme,
     * and Spring Cloud Gateway rejects a URI without one, so the scheme is
     * added here rather than forcing every deployment to embed it.
     */
    private static String normalise(String url) {
        if (url == null || url.isBlank()) {
            return url;
        }
        String v = url.trim();
        if (v.startsWith("http://") || v.startsWith("https://")) {
            return v;
        }
        // a bare host or host:port is a plain HTTP service on the private network
        return "http://" + v;
    }

    @Bean
    public RouteLocator hangovaRoutes(RouteLocatorBuilder builder) {
        return builder.routes()

                /* ---- Module 1: User & Admin ---- */
                .route("user-service", r -> r.path("/api/auth/**", "/api/users/**").uri(userUrl))

                /* ---- Module 2: AI Trip Planning ---- */
                .route("trip-service", r -> r.path("/api/trips/**", "/api/ai/**").uri(tripUrl))
                // destination / weather lookups used by the planner
                .route("trip-lookups", r -> r.path("/api/places/**", "/api/weather/**").uri(tripUrl))

                /* ---- Module 3: Borrow & Booking ---- */
                // Registered before the catch-all /api/admin route so these
                // booking-owned admin paths are not swallowed by the Info module.
                .route("booking-service", r -> r.path("/api/bookings/**", "/api/borrow/**",
                        "/api/admin/borrow", "/api/admin/bookings", "/api/admin/summary")
                        .uri(bookingUrl))
                .route("booking-lookups", r -> r.path("/api/hotels/**", "/api/transport/**",
                        "/api/availability/**").uri(bookingUrl))

                /* ---- Module 4: Travel Information ---- */
                .route("info-service", r -> r.path("/api/info/**", "/api/admin/**").uri(infoUrl))

                .build();
    }
}
