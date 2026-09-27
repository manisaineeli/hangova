package com.hangova.trip.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import com.hangova.trip.model.Destination;
import org.springframework.stereotype.Service;

/**
 * Rule-based itinerary generator.
 * <p>
 * This is the planner's safety net and its baseline: it turns a destination's
 * curated highlights into a day-wise schedule that respects the traveller's
 * interests, trip length and budget. It is used directly when no Gemini key is
 * configured, and as the structural base that the AI output is validated
 * against when Gemini is available.
 */
@Service
public class OfflinePlanner {

    /** Which highlight categories suit which traveller interests. */
    private static final Map<String, List<String>> INTEREST_TO_CATEGORY = Map.ofEntries(
            Map.entry("Mountains", List.of("Nature", "Adventure")),
            Map.entry("Adventure", List.of("Adventure", "Nature")),
            Map.entry("Nature", List.of("Nature", "Wildlife")),
            Map.entry("Beaches", List.of("Beaches")),
            Map.entry("Islands", List.of("Islands", "Beaches")),
            Map.entry("Heritage", List.of("Heritage", "Pilgrimage")),
            Map.entry("Pilgrimage", List.of("Pilgrimage", "Heritage")),
            Map.entry("Culture", List.of("Heritage", "Culture")),
            Map.entry("Wildlife", List.of("Wildlife", "Nature")),
            Map.entry("Food", List.of("Food", "Shopping")),
            Map.entry("Nightlife", List.of("Nightlife")),
            Map.entry("Shopping", List.of("Shopping")),
            Map.entry("Relaxation", List.of("Nature", "Beaches")));

    /** Daily cost model, in rupees per person. */
    private static final int STAY_BUDGET = 1100;
    private static final int STAY_MID = 2200;
    private static final int STAY_PREMIUM = 4200;
    private static final int FOOD_PER_DAY = 900;
    private static final int LOCAL_TRANSPORT_PER_DAY = 450;

    private static final int PREFERRED_ACTIVITY_HOURS = 6;

    public record PlanInput(
            String destination,
            String destinationState,
            int days,
            int travellers,
            int budget,
            List<String> interests,
            java.time.LocalDate startDate,
            String travelStyle) {
    }

    public record PlanOutput(
            List<Destination.Highlight> orderedHighlights,
            List<List<Destination.Highlight>> perDay,
            String stayTier,
            int stayPerNight,
            int dailyBasePerPerson,
            List<String> notes) {
    }

    /**
     * Chooses which highlights to include and how to spread them over the days.
     */
    public PlanOutput build(PlanInput in, Destination destination) {
        int days = Math.max(1, in.days());
        List<String> interests = in.interests() == null ? List.of() : in.interests();

        List<Destination.Highlight> pool = new ArrayList<>(destination.getHighlights());
        pool.sort(Comparator.comparingDouble((Destination.Highlight h) -> -matchScore(h, interests)).reversed());

        // Each place appears at most once. A thin catalogue leaves lighter days
        // rather than sending the traveller to the same temple twice.
        int capacity = Math.max(2, days * 3);
        List<Destination.Highlight> working = new ArrayList<>();
        Set<String> used = new HashSet<>();
        for (Destination.Highlight h : pool) {
            if (working.size() >= capacity) {
                break;
            }
            if (used.add(h.name().toLowerCase(Locale.ROOT))) {
                working.add(h);
            }
        }

        List<List<Destination.Highlight>> perDay = distribute(working, days, interests);
        topUpWithActivities(perDay, destination, days);

        int perPersonPerDay = in.travellers() > 0
                ? Math.max(0, in.budget() / Math.max(1, days) / Math.max(1, in.travellers()))
                : 0;
        String tier = stayTier(perPersonPerDay, in.travelStyle());
        int stay = switch (tier) {
            case "PREMIUM" -> STAY_PREMIUM;
            case "BUDGET" -> STAY_BUDGET;
            default -> STAY_MID;
        };
        int dailyBase = stay + FOOD_PER_DAY + LOCAL_TRANSPORT_PER_DAY;

        List<String> notes = new ArrayList<>();
        notes.add("Stay tier: " + tier + " at about Rs " + stay + " per room per night.");
        if (destination.getBestTimeToVisit() != null && !destination.getBestTimeToVisit().isBlank()) {
            notes.add(destination.getBestTimeToVisit());
        }
        if (destination.getHowToReach() != null) {
            notes.add("Getting there: " + destination.getHowToReach());
        }

        return new PlanOutput(working, perDay, tier, stay, dailyBase, notes);
    }

    /** Spreads highlights across days, keeping every day evenly loaded. */
    private List<List<Destination.Highlight>> distribute(List<Destination.Highlight> items, int days,
                                                        List<String> interests) {
        List<List<Destination.Highlight>> perDay = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            perDay.add(new ArrayList<>());
        }
        int[] hoursUsed = new int[days];

        for (Destination.Highlight h : items) {
            int preferred = preferredDay(h, days);

            // Among the days that still have room, take the emptiest one; the
            // highlight's preferred time of day breaks ties. This keeps every
            // day similarly loaded instead of front-loading day one.
            int best = -1;
            for (int day = 0; day < days; day++) {
                if (hoursUsed[day] + h.suggestedHours() > PREFERRED_ACTIVITY_HOURS + 1) {
                    continue;
                }
                if (best < 0) {
                    best = day;
                    continue;
                }
                int better = Integer.compare(hoursUsed[day], hoursUsed[best]);
                if (better < 0) {
                    best = day;
                } else if (better == 0
                        && Math.abs(day - preferred) < Math.abs(best - preferred)) {
                    best = day;
                }
            }

            if (best < 0) {
                // every day is full: fall back to the emptiest one
                best = 0;
                for (int day = 1; day < days; day++) {
                    if (hoursUsed[day] < hoursUsed[best]) {
                        best = day;
                    }
                }
            }
            perDay.get(best).add(h);
            hoursUsed[best] += h.suggestedHours();
        }

        // Any day left with fewer than two stops gets one from the busiest day,
        // so a traveller never has a single-hour "day".
        for (int day = 0; day < days; day++) {
            if (perDay.get(day).size() >= 2) {
                continue;
            }
            int donor = 0;
            for (int d = 1; d < days; d++) {
                if (perDay.get(d).size() > perDay.get(donor).size()) {
                    donor = d;
                }
            }
            if (perDay.get(donor).size() > 2) {
                perDay.get(day).add(perDay.get(donor).remove(perDay.get(donor).size() - 1));
            }
        }
        return perDay;
    }
    /**
     * Fills any thin day using the destination's experiences, expressed as
     * highlights so the day plan stays a single shape. This keeps a long trip
     * meaningful without ever repeating a place already on the itinerary.
     */
    private void topUpWithActivities(List<List<Destination.Highlight>> perDay,
                                     Destination destination, int days) {
        Set<String> used = new LinkedHashSet<>();
        for (List<Destination.Highlight> day : perDay) {
            for (Destination.Highlight h : day) {
                used.add(h.name().toLowerCase(Locale.ROOT));
            }
        }

        List<Destination.Activity> spare = new ArrayList<>();
        for (Destination.Activity a : destination.getActivities()) {
            if (used.add(a.name().toLowerCase(Locale.ROOT))) {
                spare.add(a);
            }
        }

        for (int day = 0; day < days; day++) {
            int needed = 2 - perDay.get(day).size();
            for (int i = 0; i < needed && !spare.isEmpty(); i++) {
                Destination.Activity a = spare.remove(0);
                perDay.get(day).add(new Destination.Highlight(
                        a.name(),
                        a.category(),
                        "Flexible",
                        a.approxCost(),
                        "Anytime",
                        2,
                        a.description()));
            }
        }
    }

    /** Maps a highlight's suggested time of day onto a day index. */
    private int preferredDay(Destination.Highlight h, int days) {
        String t = h.bestTime() == null ? "" : h.bestTime().toLowerCase(Locale.ROOT);
        if (t.contains("sunrise") || t.contains("morning") || t.contains("early")) {
            return 0;
        }
        if (t.contains("evening") || t.contains("sunset") || t.contains("dusk")) {
            return Math.max(0, days - 1);
        }
        if (t.contains("midday") || t.contains("afternoon")) {
            return Math.min(days - 1, 1);
        }
        return 0;
    }

    private double matchScore(Destination.Highlight h, List<String> interests) {
        if (interests.isEmpty()) {
            return 1;
        }
        double score = 0;
        String category = h.category() == null ? "" : h.category().toLowerCase(Locale.ROOT);
        for (String interest : interests) {
            for (String mapped : INTEREST_TO_CATEGORY.getOrDefault(interest, List.of())) {
                if (category.contains(mapped.toLowerCase(Locale.ROOT))) {
                    score += 3;
                }
            }
            if (h.name().toLowerCase(Locale.ROOT).contains(interest.toLowerCase(Locale.ROOT))) {
                score += 2;
            }
        }
        // cheap, well-rated places are nudged up so the plan fits a budget
        score += Math.max(0, 2.0 - h.approxEntryCost() / 500.0) * 0.1;
        return score;
    }

    private String stayTier(int perPersonPerDay, String travelStyle) {
        if (travelStyle != null) {
            String s = travelStyle.toUpperCase(Locale.ROOT);
            if (s.equals("LUXURY") || s.equals("PREMIUM")) {
                return "PREMIUM";
            }
            if (s.equals("BACKPACKER") || s.equals("CHEAP")) {
                return "BUDGET";
            }
        }
        if (perPersonPerDay >= 9000) {
            return "PREMIUM";
        }
        if (perPersonPerDay <= 3200) {
            return "BUDGET";
        }
        return "COMFORT";
    }

    /** Interest chips offered to the client, with the categories they map to. */
    public static Map<String, List<String>> interestMap() {
        return INTEREST_TO_CATEGORY;
    }

    public static Optional<String> categoryFor(String interest) {
        return Optional.ofNullable(INTEREST_TO_CATEGORY.get(interest)).map(List::getFirst);
    }
}
