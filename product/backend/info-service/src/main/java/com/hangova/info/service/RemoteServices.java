package com.hangova.info.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Read-only client for the other microservices.
 * <p>
 * Module 4 is the module that presents the whole trip in one place, so it pulls
 * the traveller's trips from the Trip Service and their bookings from the
 * Booking Service rather than duplicating that data locally. Expenses and the
 * activity log are owned here because only this module records them.
 */
@Service
public class RemoteServices {

    private static final Logger log = LoggerFactory.getLogger(RemoteServices.class);

    private final RestClient http;
    private final String tripUrl;
    private final String bookingUrl;

    public RemoteServices(RestClient.Builder builder,
                          @Value("${hangova.services.trip:http://localhost:8082}") String tripUrl,
                          @Value("${hangova.services.booking:http://localhost:8083}") String bookingUrl) {
        this.http = builder.build();
        this.tripUrl = tripUrl;
        this.bookingUrl = bookingUrl;
    }

    /** Trip as returned by the Trip Service. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RemoteTrip(String id, String title, String destination, String destinationState,
                             int days, int travellers, int budget, String status,
                             String generatedBy, java.time.Instant createdAt,
                             Map<String, Object> budgetBreakdown) {
    }

    /** Booking as returned by the Booking Service. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RemoteBooking(String id, String reference, String type, String status,
                                String title, String destination, int amount, int refundAmount,
                                String tripId, java.time.Instant createdAt) {
    }

    public List<RemoteTrip> trips(String userId) {
        try {
            RemoteTrip[] body = http.get()
                    .uri(tripUrl + "/api/trips")
                    .header("X-User-Id", userId)
                    .retrieve()
                    .body(RemoteTrip[].class);
            return body == null ? List.of() : List.of(body);
        } catch (Exception e) {
            log.warn("Could not load trips from the trip service: {}", e.getMessage());
            return List.of();
        }
    }

    public RemoteTrip trip(String userId, String tripId) {
        try {
            return http.get()
                    .uri(tripUrl + "/api/trips/{id}", tripId)
                    .header("X-User-Id", userId)
                    .retrieve()
                    .body(RemoteTrip.class);
        } catch (Exception e) {
            log.warn("Could not load trip {}: {}", tripId, e.getMessage());
            return null;
        }
    }

    public List<RemoteBooking> bookings(String userId) {
        try {
            RemoteBooking[] body = http.get()
                    .uri(bookingUrl + "/api/bookings")
                    .header("X-User-Id", userId)
                    .retrieve()
                    .body(RemoteBooking[].class);
            return body == null ? List.of() : List.of(body);
        } catch (Exception e) {
            log.warn("Could not load bookings from the booking service: {}", e.getMessage());
            return List.of();
        }
    }

    /** Re-saves a changed itinerary back into the Trip Service. */
    public boolean renameTrip(String userId, String tripId, String title) {
        try {
            http.put()
                    .uri(tripUrl + "/api/trips/{id}", tripId)
                    .header("X-User-Id", userId)
                    .body(Map.of("title", title))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (Exception e) {
            log.warn("Could not rename trip {}: {}", tripId, e.getMessage());
            return false;
        }
    }

    public boolean deleteTrip(String userId, String tripId) {
        try {
            http.delete()
                    .uri(tripUrl + "/api/trips/{id}", tripId)
                    .header("X-User-Id", userId)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (Exception e) {
            log.warn("Could not delete trip {}: {}", tripId, e.getMessage());
            return false;
        }
    }

    /** Marks a trip as archived so it drops out of the active list. */
    /** Every booking on the platform, for the administrator overview. */
    public List<RemoteBooking> allBookingsForAdmin() {
        try {
            RemoteBooking[] body = http.get()
                    .uri(bookingUrl + "/api/admin/bookings")
                    .header("X-User-Id", "system")
                    .header("X-User-Role", "ADMIN")
                    .retrieve()
                    .body(RemoteBooking[].class);
            return body == null ? List.of() : List.of(body);
        } catch (Exception e) {
            log.warn("Could not load all bookings from the booking service: {}", e.getMessage());
            return List.of();
        }
    }

    public Map<String, Object> dashboardCounts(String userId) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("trips", trips(userId).size());
        out.put("bookings", bookings(userId).size());
        return out;
    }
}
