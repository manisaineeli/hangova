package com.hangova.booking.web;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.hangova.booking.model.Booking;
import com.hangova.booking.security.Caller;
import com.hangova.booking.service.AvailabilityService;
import com.hangova.booking.service.BookingService;
import com.hangova.booking.web.BookingDtos.CancelRequest;
import com.hangova.booking.web.BookingDtos.CreateBookingRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Hotel and transport search, plus booking and cancellation.
 * Serves the "Hotel recommendations", "Flight/train/bus information",
 * "Booking and cancellation" and "Booking history" features of Module 3.
 */
@RestController
@RequestMapping("/api")
public class BookingController {

    private final AvailabilityService availability;
    private final BookingService bookings;
    private final Caller caller;

    public BookingController(AvailabilityService availability, BookingService bookings, Caller caller) {
        this.availability = availability;
        this.bookings = bookings;
        this.caller = caller;
    }

    /* ---------------- availability ---------------- */

    @GetMapping("/hotels")
    public List<AvailabilityService.HotelOption> hotels(
            @RequestParam String destination,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(required = false, defaultValue = "2") int travellers,
            @RequestParam(required = false, defaultValue = "1") int rooms) {
        return availability.hotels(destination, checkIn, checkOut, travellers, rooms);
    }

    @GetMapping("/transport")
    public List<AvailabilityService.TransportOption> transport(
            @RequestParam String destination,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false, defaultValue = "2") int travellers,
            @RequestParam(required = false) String mode) {
        return availability.transport(destination, null, date, travellers, mode);
    }

    /* ---------------- bookings ---------------- */

    @PostMapping("/bookings")
    public ResponseEntity<Booking> create(@Valid @RequestBody CreateBookingRequest req) {
        Booking b = bookings.createBooking(caller.id(), caller.name(), caller.email(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(b);
    }

    /** Booking history for the signed-in user. */
    @GetMapping("/bookings")
    public List<Booking> mine(@RequestParam(required = false) String status) {
        List<Booking> all = bookings.myBookings(caller.id());
        if (status == null || status.isBlank()) {
            return all;
        }
        return all.stream().filter(b -> status.equalsIgnoreCase(b.getStatus())).toList();
    }

    @GetMapping("/bookings/{id}")
    public Booking one(@PathVariable String id) {
        return bookings.one(caller.id(), caller.isAdmin(), id);
    }

    @PostMapping("/bookings/{id}/cancel")
    public Booking cancel(@PathVariable String id, @RequestBody(required = false) CancelRequest req) {
        return bookings.cancel(caller.id(), caller.isAdmin(), id, req == null ? null : req.reason());
    }

    /** Grouped summary of the user's bookings, for the travel information module. */
    @GetMapping("/bookings/summary")
    public Map<String, Object> summary() {
        List<Booking> all = bookings.myBookings(caller.id());
        int confirmed = (int) all.stream()
                .filter(b -> Booking.CONFIRMED.equals(b.getStatus()))
                .mapToInt(Booking::getAmount).sum();
        int refunded = (int) all.stream().mapToInt(Booking::getRefundAmount).sum();
        return Map.of(
                "totalBookings", all.size(),
                "confirmed", all.stream().filter(b -> Booking.CONFIRMED.equals(b.getStatus())).count(),
                "cancelled", all.stream().filter(b -> Booking.CANCELLED.equals(b.getStatus())).count(),
                "totalSpent", confirmed,
                "refunded", refunded,
                "hotels", all.stream().filter(b -> "HOTEL".equals(b.getType())).count(),
                "transport", all.stream().filter(b -> "TRANSPORT".equals(b.getType())).count());
    }
}
