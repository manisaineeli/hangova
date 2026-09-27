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
        this.userUrl = userUrl;
        this.tripUrl = tripUrl;
        this.bookingUrl = bookingUrl;
        this.infoUrl = infoUrl;
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
