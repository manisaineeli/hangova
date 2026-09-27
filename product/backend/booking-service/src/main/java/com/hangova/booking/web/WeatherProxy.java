package com.hangova.booking.web;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Weather lookup for the booking screens, delegated to the Trip Service which
 * owns the Open-Meteo integration.
 * <p>
 * This is a deliberate service-to-service call: the booking flow needs the
 * forecast for the travel date, but the provider credentials and the fallback
 * logic live in one place rather than being duplicated.
 */
@Service
public class WeatherProxy {

    private static final Logger log = LoggerFactory.getLogger(WeatherProxy.class);

    private final RestClient http;
    private final String tripServiceUrl;

    public WeatherProxy(RestClient.Builder builder,
                        @Value("${hangova.services.trip:http://localhost:8082}") String tripServiceUrl) {
        this.http = builder.build();
        this.tripServiceUrl = withScheme(tripServiceUrl);
    }

    /**
     * Render supplies internal addresses as "host:port" with no scheme, which
     * RestClient will not accept, so the scheme is filled in here.
     */
    private static String withScheme(String url) {
        if (url == null || url.isBlank()) {
            return url;
        }
        String v = url.trim();
        return (v.startsWith("http://") || v.startsWith("https://")) ? v : "http://" + v;
    }

    /**
     * @return the trip service response, or a small object explaining that the
     * forecast could not be reached so the caller can still render.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> forDestination(String destination, int days) {
        try {
            Object body = http.get()
                    .uri(tripServiceUrl + "/api/weather?destination={d}&days={n}", destination, Math.min(days, 16))
                    .retrieve()
                    .body(Object.class);
            if (body instanceof Map<?, ?> map) {
                return (Map<String, Object>) map;
            }
        } catch (Exception e) {
            log.warn("Trip service weather lookup failed: {}", e.getMessage());
        }
        return Map.of(
                "live", false,
                "summary", "Weather unavailable right now",
                "note", "The trip service could not be reached for the forecast",
                "days", java.util.List.of());
    }
}
