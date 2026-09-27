package com.hangova.trip.web;

import java.time.LocalDate;
import java.util.List;

import com.hangova.trip.service.TripPlannerService.PlanRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request / response payloads for Module 2 and the shared discovery endpoints. */
public final class PlanDtos {

    private PlanDtos() {
    }

    public record PlanTripRequest(
            @NotBlank(message = "Destination is required")
            @Size(max = 120)
            String destination,

            @Min(value = 1, message = "Trip must be at least 1 day")
            @Max(value = 30, message = "Trip cannot exceed 30 days")
            Integer days,

            @Min(value = 1, message = "At least 1 traveller is required")
            @Max(value = 20)
            Integer travellers,

            @Min(value = 0, message = "Budget cannot be negative")
            Integer budget,

            List<String> interests,
            LocalDate startDate,
            String travelStyle,

            /** false returns a preview without saving the trip */
            Boolean save) {

        public PlanRequest toPlanRequest() {
            return new PlanRequest(destination, days, travellers, budget,
                    interests, startDate, travelStyle, save);
        }
    }

    public record RenameTripRequest(
            @NotBlank @Size(max = 140) String title) {
    }

    public record StatusRequest(
            @NotBlank String status) {
    }

    /* ---------- discovery ---------- */

    public record WeatherResponse(
            boolean live,
            String summary,
            String note,
            List<WeatherDay> days) {
    }

    public record WeatherDay(
            String date,
            String description,
            Double tempMin,
            Double tempMax,
            Double rainChance,
            Double windSpeed) {
    }

    public record DestinationResponse(
            String id,
            String name,
            String state,
            String summary,
            List<String> tags,
            double latitude,
            double longitude,
            int avgDailyCostPerPerson,
            int idealDays,
            List<String> bestMonths,
            String climate,
            String bestTimeToVisit,
            String howToReach,
            boolean inCatalogue,
            String source) {
    }
}
