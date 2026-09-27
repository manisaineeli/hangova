package com.hangova.booking.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.hangova.booking.catalog.TravelCatalog;
import org.springframework.stereotype.Service;

/**
 * Hotel and transport availability.
 * <p>
 * Prices and seat counts vary deterministically with the search date and party
 * size, so repeated searches look realistic (peak dates cost more, larger
 * parties reduce availability) and the booking totals always reconcile with
 * what the user was shown.
 */
@Service
public class AvailabilityService {

    public record HotelOption(
            String id,
            String name,
            String area,
            String destination,
            String tier,
            int perNight,
            int rating,
            String amenities,
            String note,
            int roomsAvailable,
            LocalDate checkIn,
            LocalDate checkOut,
            int nights,
            int travellers,
            int totalPrice,
            boolean refundable,
            String cancellationPolicy) {
    }

    public record TransportOption(
            String id,
            String mode,
            String operator,
            String from,
            String to,
            String destination,
            String depart,
            String arrive,
            int durationMinutes,
            int fare,
            int seatsLeft,
            String travelClass,
            LocalDate date,
            int travellers,
            int totalPrice,
            boolean refundable,
            String cancellationPolicy) {
    }

    /** Deterministic 0-99 bucket from a string, so values are stable per search. */
    private int bucket(String key) {
        int h = Math.abs(key.hashCode());
        return h % 100;
    }

    public List<HotelOption> hotels(String destination, LocalDate checkIn, LocalDate checkOut,
                                    int travellers, int rooms) {
        LocalDate in = checkIn == null ? LocalDate.now().plusDays(14) : checkIn;
        LocalDate out = checkOut == null ? in.plusDays(3) : checkOut;
        if (!out.isAfter(in)) {
            out = in.plusDays(1);
        }
        int nights = (int) ChronoUnit.DAYS.between(in, out);
        int party = Math.max(1, travellers);
        int roomCount = Math.max(1, rooms);

        List<HotelOption> out2 = new ArrayList<>();
        int index = 0;
        for (TravelCatalog.HotelSeed seed : TravelCatalog.hotelsFor(destination)) {
            index++;
            // weekend and peak-season uplift
            double seasonFactor = 1.0;
            int month = in.getMonthValue();
            if (month >= 10 && month <= 12 || month <= 2) {
                seasonFactor = 1.25;                 // peak tourist season
            } else if (month >= 6 && month <= 9) {
                seasonFactor = 0.8;                  // monsoon / off season
            }
            boolean weekend = in.getDayOfWeek().getValue() >= 6;
            if (weekend) {
                seasonFactor += 0.1;
            }
            int jitter = bucket(seed.name() + in.toString()) % 12;   // 0-11% variation
            int perNight = (int) Math.round(seed.perNight() * seasonFactor * (1 + jitter / 100.0));

            int available = 1 + bucket(seed.name() + "avail" + in.toString()) % 6;
            if (available < roomCount) {
                available = roomCount;                 // never show fewer than requested
            }

            out2.add(new HotelOption(
                    "HTL-" + TravelCatalog.slug(seed.name()),
                    seed.name(),
                    seed.area(),
                    destination,
                    seed.tier(),
                    perNight,
                    seed.rating(),
                    seed.amenities(),
                    seed.note(),
                    available,
                    in, out, nights,
                    party,
                    perNight * nights * roomCount,
                    !"BUDGET".equals(seed.tier()),
                    "BUDGET".equals(seed.tier())
                            ? "Non-refundable, but free cancellation until 24 hours before check-in."
                            : "Free cancellation until 48 hours before check-in, then one night is charged."));
        }
        return out2;
    }

    public List<TransportOption> transport(String destination, String from, LocalDate date,
                                           int travellers, String mode) {
        LocalDate on = date == null ? LocalDate.now().plusDays(14) : date;
        int party = Math.max(1, travellers);
        String wanted = mode == null ? "" : mode.trim().toUpperCase(Locale.ROOT);

        List<TransportOption> out = new ArrayList<>();
        for (TravelCatalog.RouteSeed seed : TravelCatalog.routesFor(destination)) {
            if (!wanted.isBlank() && !wanted.equals(seed.mode())) {
                continue;
            }
            int weekend = on.getDayOfWeek().getValue() >= 6 ? 1 : 0;
            int jitter = bucket(seed.operator() + seed.from() + on.toString()) % 15;
            int fare = (int) Math.round(seed.fare() * (1 + 0.12 * weekend + jitter / 100.0));

            int seats = Math.max(0, seed.seatsLeft() - bucket(seed.operator() + on.toString() + "seat") % 5);
            String travelClass = switch (seed.mode()) {
                case "FLIGHT" -> fare > 8000 ? "Business" : "Economy";
                case "TRAIN" -> fare > 1500 ? "AC 3 Tier" : "Sleeper";
                default -> "Sealed Coach";
            };

            out.add(new TransportOption(
                    "TRP-" + TravelCatalog.slug(seed.operator() + seed.depart() + seed.from()),
                    seed.mode(),
                    seed.operator(),
                    seed.from(),
                    seed.to(),
                    destination,
                    seed.depart(),
                    seed.arrive(),
                    seed.durationMinutes(),
                    fare,
                    seats,
                    travelClass,
                    on, party,
                    fare * party,
                    true,
                    "Free cancellation up to 24 hours before departure for flights and AC trains; "
                            + "a cancellation fee applies closer to departure."));
        }
        return out;
    }
}
