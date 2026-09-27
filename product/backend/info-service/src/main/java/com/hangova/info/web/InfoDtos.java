package com.hangova.info.web;

import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request payloads for Module 4. */
public final class InfoDtos {

    private InfoDtos() {
    }

    public record CreateExpenseRequest(
            @NotBlank(message = "Category is required")
            @Size(max = 40)
            String category,

            @NotBlank(message = "Description is required")
            @Size(max = 200)
            String description,

            @NotNull(message = "Amount is required")
            @Min(value = 1, message = "Amount must be greater than zero")
            Integer amount,

            LocalDate date,
            @Size(max = 40) String paymentMode,
            @Size(max = 60) String tripId,
            @Size(max = 60) String bookingId,
            @Size(max = 300) String notes) {

        public int amountInRupees() {
            return amount == null ? 0 : amount;
        }
    }

    public record UpdateExpenseRequest(
            @Size(max = 40) String category,
            @Size(max = 200) String description,
            @Min(value = 1, message = "Amount must be greater than zero") Integer amount,
            LocalDate date,
            @Size(max = 40) String paymentMode,
            @Size(max = 60) String tripId,
            @Size(max = 300) String notes) {
    }

    public record UpdateTripRequest(
            @Size(max = 140) String title) {
    }
}
