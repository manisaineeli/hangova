package com.hangova.trip.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import com.hangova.trip.model.Destination;
import com.hangova.trip.model.Trip;
import com.hangova.trip.repo.DestinationRepository;
import com.hangova.trip.repo.TripRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Module 2 - AI Trip Planning.
 * <p>
 * Takes destination, budget, duration, traveller count and interests, and
 * produces a personalised day-wise itinerary with place recommendations,
 * activity suggestions, budget estimation and live weather.
 */
@Service
public class TripPlannerService {

    private static final Logger log = LoggerFactory.getLogger(TripPlannerService.class);

    private final TripRepository trips;
    private final DestinationRepository destinations;
    private final PlaceSearchService places;
    private final WeatherService weather;
    private final OfflinePlanner offline;
    private final GeminiService gemini;

    public TripPlannerService(TripRepository trips,
                              DestinationRepository destinations,
                              PlaceSearchService places,
                              WeatherService weather,
                              OfflinePlanner offline,
                              GeminiService gemini) {
        this.trips = trips;
        this.destinations = destinations;
        this.places = places;
        this.weather = weather;
        this.offline = offline;
        this.gemini = gemini;
    }

    public record PlanRequest(
            String destination,
            Integer days,
            Integer travellers,
            Integer budget,
            List<String> interests,
            LocalDate startDate,
            String travelStyle,
            Boolean save) {
    }

    /** Builds a plan and, unless {@code save} is false, stores it against the user. */
    public Trip plan(String userId, String ownerName, PlanRequest req) {
        String destinationName = req.destination() == null ? "" : req.destination().trim();
        if (destinationName.isBlank()) {
            throw new IllegalArgumentException("Please choose a destination");
        }
        int days = clamp(req.days(), 1, 30, 4);
        int travellers = clamp(req.travellers(), 1, 20, 2);
        int budget = Math.max(0, req.budget() == null ? 60000 : req.budget());
        List<String> interests = clean(req.interests());
        LocalDate start = req.startDate() == null ? LocalDate.now().plusDays(14) : req.startDate();
        String style = req.travelStyle();

        // 1. resolve the destination (catalogue first, then live geocoding)
        PlaceSearchService.PlaceHit hit = places.resolve(destinationName)
                .orElseThrow(() -> new IllegalArgumentException(
                        "We could not find '" + destinationName + "'. Try a city or state name."));

        Optional<Destination> catalogue = hit.inCatalogue()
                ? destinations.findBySlugIgnoreCase(hit.slug())
                : destinations.findByNameIgnoreCase(hit.name());
        Destination destination = catalogue.orElseGet(() -> synthesise(hit));

        // 2. weather for the travel dates
        double fallbackTemp = catalogue.map(Destination::getAvgDailyCostPerPerson)
                .map(c -> 12 + (c % 22))
                .orElse(24);
        WeatherService.Forecast forecast = weather.forecast(
                destination.getLatitude(), destination.getLongitude(), start, days, fallbackTemp);

        // 3. structural plan from the curated data
        OfflinePlanner.PlanInput input = new OfflinePlanner.PlanInput(
                destination.getName(), destination.getState(), days, travellers, budget,
                interests, start, style);
        OfflinePlanner.PlanOutput structure = offline.build(input, destination);

        // 4. ask Gemini to write the narrative plan; fall back if it cannot
        GeminiService.AiPlan ai = gemini.generate(
                destination.getName(), destination.getState(), days, travellers, budget,
                interests, style, structure.orderedHighlights(), forecast);

        Trip trip = new Trip();
        trip.setUserId(userId);
        trip.setOwnerName(ownerName);
        trip.setDestination(destination.getName());
        trip.setDestinationState(destination.getState());
        trip.setLatitude(destination.getLatitude());
        trip.setLongitude(destination.getLongitude());
        trip.setDays(days);
        trip.setTravellers(travellers);
        trip.setBudget(budget);
        trip.setInterests(interests);
        trip.setStartDate(start);
        trip.setTravelStyle(style == null || style.isBlank() ? "BALANCED" : style);
        trip.setTitle(titleFor(destination, days, style));

        // if the traveller typed a state, remember which city we planned instead
        String stateNote = null;
        if (hit.source().equals("catalogue-by-state")
                && !destinationName.equalsIgnoreCase(destination.getName())) {
            stateNote = "You searched for '" + destinationName + "'. We planned "
                    + destination.getName() + ", the most popular base in that region.";
        }

        if (ai.success()) {
            trip.setItinerary(withWeatherAndDates(ai.days(), start, forecast));
            trip.setRecommendations(ai.recommendations());
            trip.setBudgetTips(ai.budgetTips());
            trip.setGeneratedBy("gemini");
            trip.setAiNote(ai.note());
        } else {
            trip.setItinerary(withWeatherAndDates(
                    toActivities(structure.perDay(), start, forecast, travellers, structure.dailyBasePerPerson()),
                    start, forecast));
            trip.setRecommendations(recommendationsFor(destination, interests, forecast));
            trip.setBudgetTips(budgetTipsFor(destination, budget, days, travellers, structure));
            trip.setGeneratedBy("offline");
            trip.setAiNote(ai.note() + " " + gemini.describeConfiguration());
        }

        trip.setPlaces(placeSuggestions(destination, interests, structure));
        trip.setActivities(activitySuggestions(destination, interests, structure));
        trip.setBudgetBreakdown(estimate(trip, structure));
        trip.setWeatherSummary(forecast.summary());
        trip.setLiveWeather(forecast.live());

        // added last so it is not overwritten by the recommendation set above
        if (stateNote != null) {
            List<String> recs = new ArrayList<>(trip.getRecommendations());
            recs.add(0, stateNote);
            trip.setRecommendations(recs);
        }

        trip.setStatus("SAVED");

        if (Boolean.FALSE.equals(req.save())) {
            trip.setStatus("PREVIEW");
            return trip;
        }
        return trips.save(trip);
    }

    /* ---------------- itinerary assembly ---------------- */

    private List<Trip.DayPlan> toActivities(List<List<Destination.Highlight>> perDay,
                                            LocalDate start,
                                            WeatherService.Forecast forecast,
                                            int travellers,
                                            int dailyBasePerPerson) {
        List<Trip.DayPlan> out = new ArrayList<>();

        for (int i = 0; i < perDay.size(); i++) {
            List<Destination.Highlight> items = new ArrayList<>(perDay.get(i));
            // order the stops by the time of day each one actually suits
            items.sort(Comparator.comparingInt(h -> slotFor(h.bestTime()).minutes));

            List<Trip.Activity> acts = new ArrayList<>();
            int dayCost = dailyBasePerPerson * travellers;
            for (Destination.Highlight h : items) {
                int entry = h.approxEntryCost() * travellers;
                dayCost += entry;
                acts.add(new Trip.Activity(
                        slotFor(h.bestTime()).label,
                        h.name(),
                        h.description(),
                        h.category(),
                        h.area(),
                        entry,
                        h.suggestedHours() * 60));
            }
            out.add(new Trip.DayPlan(
                    i + 1,
                    start.plusDays(i).toString(),
                    themeFor(items),
                    summaryFor(items),
                    acts,
                    dayCost,
                    null, null, null));
        }
        return out;
    }

    private record Slot(String label, int minutes) {
    }

    /** Turns a highlight's "best time to visit" into a realistic start time. */
    private Slot slotFor(String bestTime) {
        String t = bestTime == null ? "" : bestTime.toLowerCase(Locale.ROOT);
        if (t.contains("sunrise") || t.contains("dawn")) {
            return new Slot("06:00", 360);
        }
        if (t.contains("early")) {
            return new Slot("07:30", 450);
        }
        if (t.contains("evening") || t.contains("sunset") || t.contains("dusk")) {
            return new Slot("17:30", 1050);
        }
        if (t.contains("midday")) {
            return new Slot("12:00", 720);
        }
        if (t.contains("afternoon")) {
            return new Slot("14:30", 870);
        }
        if (t.contains("full day")) {
            return new Slot("09:00", 540);
        }
        return new Slot("09:30", 570);
    }

    private String themeFor(List<Destination.Highlight> items) {
        if (items.isEmpty()) {
            return "Free day";
        }
        // the theme follows whichever category dominates the day, so a mixed day
        // is not mislabelled by whichever stop happened to be scheduled first
        Map<String, Integer> tally = new LinkedHashMap<>();
        for (Destination.Highlight h : items) {
            String c = h.category() == null ? "Other" : h.category();
            tally.merge(c, 1, Integer::sum);
        }
        String dominant = tally.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Other");

        return switch (dominant) {
            case "Nature" -> "Nature and scenery";
            case "Adventure" -> "Adventure and activity";
            case "Heritage" -> "Heritage and history";
            case "Beaches" -> "Beach and relaxation";
            case "Wildlife" -> "Wildlife and outdoors";
            case "Food" -> "Food and local flavours";
            case "Nightlife" -> "Evenings and nightlife";
            case "Shopping" -> "Markets and shopping";
            case "Culture" -> "Culture and local life";
            case "Pilgrimage" -> "Temples and pilgrimage";
            case "Islands" -> "Islands and the coast";
            default -> dominant + " day";
        };
    }

    private String summaryFor(List<Destination.Highlight> items) {
        if (items.isEmpty()) {
            return "A free day to explore at your own pace, revisit favourites or rest.";
        }
        String names = items.stream().map(Destination.Highlight::name).reduce((a, b) -> a + ", " + b).orElse("");
        return "Covers " + names + ".";
    }

    /** Stamps real dates and the matching day's weather onto any day plan. */
    private List<Trip.DayPlan> withWeatherAndDates(List<Trip.DayPlan> days, LocalDate start,
                                                    WeatherService.Forecast forecast) {
        List<Trip.DayPlan> out = new ArrayList<>();
        for (int i = 0; i < days.size(); i++) {
            Trip.DayPlan d = days.get(i);
            LocalDate date = start.plusDays(i);
            WeatherService.DayWeather w = i < forecast.days().size() ? forecast.days().get(i) : null;
            out.add(new Trip.DayPlan(
                    d.day(),
                    date.toString(),
                    d.theme(),
                    d.summary(),
                    d.activities(),
                    d.dayCost(),
                    w == null ? null : w.description(),
                    w == null ? null : w.tempMin(),
                    w == null ? null : w.tempMax()));
        }
        return out;
    }

    /* ---------------- budget ---------------- */

    private Trip.BudgetBreakdown estimate(Trip trip, OfflinePlanner.PlanOutput structure) {
        int travellers = Math.max(1, trip.getTravellers());
        int days = Math.max(1, trip.getDays());

        int activities = trip.getItinerary().stream()
                .mapToInt(d -> d.activities().stream()
                        .filter(a -> !isBaseCost(a))
                        .mapToInt(Trip.Activity::cost)
                        .sum())
                .sum();

        int stay = structure.stayPerNight() * days;
        int food = 900 * days * travellers;
        int transport = (450 * days * travellers) + longHaul(trip.getDestinationState());
        int misc = Math.round(days * travellers * 250f);

        int total = stay + food + transport + activities + misc;
        int perPerson = total / travellers;
        int variance = trip.getBudget() - total;
        boolean within = variance >= 0;

        String verdict = within
                ? "The plan comes in Rs " + variance + " under your budget."
                : "The plan exceeds your budget by Rs " + Math.abs(variance)
                + ". See the budget tips for ways to bring it down.";

        return new Trip.BudgetBreakdown(stay, transport, food, activities, misc,
                total, perPerson, trip.getBudget(), variance, within, verdict);
    }

    /** Meals and local travel are carried in the daily base, not as activities. */
    private boolean isBaseCost(Trip.Activity a) {
        String t = a.title() == null ? "" : a.title().toLowerCase(Locale.ROOT);
        return t.contains("meal") || t.contains("dinner") || t.contains("lunch")
                || t.contains("breakfast") || t.contains("local travel") || t.contains("transfer");
    }

    private int longHaul(String state) {
        if (state == null) {
            return 4000;
        }
        return switch (state) {
            case "Kerala", "Tamil Nadu", "Karnataka", "Goa" -> 2500;
            case "Himachal Pradesh", "Uttarakhand" -> 4500;
            case "Rajasthan" -> 3500;
            case "Andaman and Nicobar Islands" -> 12000;
            default -> 3000;
        };
    }

    private List<String> budgetTipsFor(Destination destination, int budget, int days,
                                       int travellers, OfflinePlanner.PlanOutput structure) {
        List<String> tips = new ArrayList<>();
        int perDay = budget / Math.max(1, days);

        if (structure.stayTier().equals("BUDGET")) {
            tips.add("Your budget selects budget guesthouses and homestays. Book direct or stay in "
                    + "town to cut accommodation cost further.");
        } else if (structure.stayTier().equals("PREMIUM")) {
            tips.add("Your budget allows premium stays. Booking early, well before the season, "
                    + "usually saves 20 to 30 percent on the same hotels.");
        } else {
            tips.add("Comfort-level hotels are assumed. Shifting two nights to a homestay "
                    + "frees roughly Rs " + (structure.stayPerNight() * 2) + " for experiences.");
        }

        if (perDay * travellers < 4000) {
            tips.add("This is a tight per-day budget. Travelling by bus or train instead of "
                    + "flights is usually the single biggest saving.");
        }
        tips.add("Many of the best places listed are free to enter, and the budget already "
                + "only charges entry fees for the paid ones.");
        if (destination.getBestMonths() != null && !destination.getBestMonths().isEmpty()) {
            tips.add("Travelling outside the peak season (" + String.join(", ", destination.getBestMonths())
                    + ") lowers both stay and transport prices.");
        }
        tips.add("Carrying a group of " + travellers + " splits transport and entry costs, "
                + "so per-person cost falls as the group grows.");
        return tips;
    }

    /* ---------------- suggestions ---------------- */

    private List<Trip.PlaceSuggestion> placeSuggestions(Destination destination, List<String> interests,
                                                        OfflinePlanner.PlanOutput structure) {
        List<Trip.PlaceSuggestion> out = new ArrayList<>();
        LinkedHashSet<String> seen = new LinkedHashSet<>();
        for (Destination.Highlight h : structure.orderedHighlights()) {
            if (!seen.add(h.name())) {
                continue;
            }
            out.add(new Trip.PlaceSuggestion(
                    h.name(), h.category(), h.area(), h.approxEntryCost(), h.bestTime(),
                    recommendedBecause(h, interests), matchingInterest(h, interests)));
            if (out.size() >= 10) {
                break;
            }
        }
        return out;
    }

    private String recommendedBecause(Destination.Highlight h, List<String> interests) {
        String m = matchingInterest(h, interests);
        if (m != null) {
            return "Matches your interest in " + m + ", and it is one of the best rated stops here.";
        }
        return h.description();
    }

    private String matchingInterest(Destination.Highlight h, List<String> interests) {
        if (interests == null) {
            return null;
        }
        String category = h.category() == null ? "" : h.category().toLowerCase(Locale.ROOT);
        for (String interest : interests) {
            for (String mapped : OfflinePlanner.interestMap()
                    .getOrDefault(interest, List.of())) {
                if (category.contains(mapped.toLowerCase(Locale.ROOT))) {
                    return interest;
                }
            }
        }
        return null;
    }

    private List<Trip.ActivitySuggestion> activitySuggestions(Destination destination, List<String> interests,
                                                             OfflinePlanner.PlanOutput structure) {
        List<Trip.ActivitySuggestion> out = new ArrayList<>();
        List<Destination.Activity> pool = new ArrayList<>(destination.getActivities());
        pool.sort((a, b) -> Integer.compare(
                -scoreActivity(a, interests), -scoreActivity(b, interests)));
        for (Destination.Activity a : pool) {
            out.add(new Trip.ActivitySuggestion(a.name(), a.category(), a.approxCost(),
                    a.duration(), matchingInterestCategory(a.category(), interests), a.description()));
        }
        return out;
    }

    private int scoreActivity(Destination.Activity a, List<String> interests) {
        if (interests == null) {
            return 0;
        }
        int score = 0;
        String cat = a.category() == null ? "" : a.category().toLowerCase(Locale.ROOT);
        for (String interest : interests) {
            for (String mapped : OfflinePlanner.interestMap().getOrDefault(interest, List.of())) {
                if (cat.contains(mapped.toLowerCase(Locale.ROOT))) {
                    score += 3;
                }
            }
        }
        return score;
    }

    private String matchingInterestCategory(String category, List<String> interests) {
        if (interests == null || category == null) {
            return null;
        }
        String cat = category.toLowerCase(Locale.ROOT);
        for (String interest : interests) {
            for (String mapped : OfflinePlanner.interestMap().getOrDefault(interest, List.of())) {
                if (cat.contains(mapped.toLowerCase(Locale.ROOT))) {
                    return interest;
                }
            }
        }
        return null;
    }

    private List<String> recommendationsFor(Destination destination, List<String> interests,
                                            WeatherService.Forecast forecast) {
        List<String> out = new ArrayList<>();
        out.add(destination.getSummary());
        if (destination.getBestTimeToVisit() != null) {
            out.add(destination.getBestTimeToVisit());
        }
        if (destination.getClimate() != null) {
            out.add(destination.getClimate());
        }
        if (destination.getHowToReach() != null) {
            out.add("Getting there: " + destination.getHowToReach());
        }
        if (forecast.live()) {
            out.add("Weather for your dates: " + forecast.summary());
        }
        if (!interests.isEmpty()) {
            out.add("Your interests (" + String.join(", ", interests)
                    + ") have been used to order the days and pick the stops.");
        }
        return out;
    }

    /* ---------------- helpers ---------------- */

    private Destination synthesise(PlaceSearchService.PlaceHit hit) {
        Destination d = new Destination();
        d.setSlug(hit.slug() != null ? hit.slug() : hit.name().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-"));
        d.setName(hit.name());
        d.setState(hit.state() == null ? "" : hit.state());
        d.setLatitude(hit.latitude());
        d.setLongitude(hit.longitude());
        d.setTags(hit.tags() == null ? List.of() : hit.tags());
        d.setSummary(hit.name() + ", " + (hit.state() == null ? "India" : hit.state())
                + " - a destination you have selected for this trip.");
        d.setAvgDailyCostPerPerson(3000);
        d.setIdealDays(4);
        d.setActive(true);
        d.setHighlights(new ArrayList<>(List.of(
                new Destination.Highlight(hit.name() + " town walk", "Culture", hit.name(), 0, "Morning", 2,
                        "An easy orientation walk through the main streets and market."),
                new Destination.Highlight("Local viewpoint", "Nature", hit.name(), 0, "Sunset", 2,
                        "The best short trip for a view over the surrounding area."),
                new Destination.Highlight("Regional museum", "Heritage", hit.name(), 100, "Afternoon", 2,
                        "A useful overview of the history and culture of the region."),
                new Destination.Highlight("Weekend market", "Shopping", hit.name(), 0, "Evening", 2,
                        "Handicrafts, street food and a good feel for local life."),
                new Destination.Highlight("Nature trail", "Nature", hit.name(), 0, "Morning", 3,
                        "A scenic trail suited to the local terrain."))));
        d.setActivities(new ArrayList<>(List.of(
                new Destination.Activity("Guided heritage walk", "Heritage", 500, "2 hours",
                        "Local guide through the old quarter."),
                new Destination.Activity("Street food tasting", "Food", 400, "1.5 hours",
                        "A sampler of regional dishes."),
                new Destination.Activity("Half-day nature trip", "Nature", 600, "4 hours",
                        "Guided outing into the countryside."))));
        return d;
    }

    private String titleFor(Destination destination, int days, String style) {
        String theme = switch (style == null ? "BALANCED" : style.toUpperCase(Locale.ROOT)) {
            case "LUXURY", "PREMIUM" -> "Premium ";
            case "BACKPACKER", "CHEAP" -> "Budget ";
            default -> "";
        };
        return theme + days + "-day " + destination.getName() + " trip";
    }

    private int clamp(Integer value, int min, int max, int fallback) {
        if (value == null) {
            return fallback;
        }
        return Math.max(min, Math.min(max, value));
    }

    private List<String> clean(List<String> in) {
        if (in == null) {
            return List.of();
        }
        return in.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(s -> s.trim())
                .distinct()
                .toList();
    }
}
