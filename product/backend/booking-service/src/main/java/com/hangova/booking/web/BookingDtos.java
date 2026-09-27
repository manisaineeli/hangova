package com.hangova.booking.web;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request payloads for Module 3 (booking, cancellation, borrowing). */
public final class BookingDtos {

    private BookingDtos() {
    }

    public record CreateBookingRequest(
            @NotBlank(message = "Booking type is required")
            String type,

            @NotBlank(message = "Title is required")
            @Size(max = 160)
            String title,

            @Size(max = 200) String subtitle,
            @Size(max = 200) String provider,
            @Size(max = 120) String destination,

            LocalDate checkIn,
            LocalDate checkOut,
            @Min(1) @Max(20) Integer travellers,
            @Min(1) @Max(10) Integer rooms,

            @Size(max = 20) String transportMode,
            @Size(max = 20) String departureTime,
            @Size(max = 20) String arrivalTime,
            @Size(max = 60) String seatOrRoom,

            @NotNull(message = "Amount is required")
            @Min(0) Integer amount,

            Boolean refundable,
            @Size(max = 60) String tripId,
            @Size(max = 60) String borrowRequestId,
            List<String> notes) {

        public int travellerCount() {
            return travellers == null ? 1 : travellers;
        }

        public int roomCount() {
            return rooms == null ? 1 : rooms;
        }

        public int amountInRupees() {
            return amount == null ? 0 : amount;
        }

        public boolean isRefundable() {
            return refundable == null || refundable;
        }
    }

    public record CancelRequest(
            @Size(max = 300) String reason) {
    }

    /** Traveller's application for a travel loan. */
    public record LoanApplication(
            @NotNull(message = "Amount is required")
            @Min(value = 1000, message = "Request at least Rs 1,000")
            @Max(value = 500000, message = "Loans are capped at Rs 5,00,000")
            Integer amount,

            @NotBlank(message = "Purpose is required")
            @Size(max = 300)
            String purpose,

            @Size(max = 120) String destination,
            LocalDate travelDate,
            @Min(3) @Max(60) Integer durationMonths,
            @Size(max = 20) String contactNumber) {

        public int amountInRupees() {
            return amount == null ? 0 : amount;
        }

        public int months() {
            return durationMonths == null ? 12 : durationMonths;
        }
    }

    public record DecisionRequest(
            Boolean approve,
            @Min(0) Integer approvedAmount,
            @Size(max = 400) String note) {
    }
}
