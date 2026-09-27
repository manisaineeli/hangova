package com.hangova.trip.service;

import java.util.ArrayList;
import java.util.List;

import tools.jackson.databind.JsonNode;
import com.hangova.trip.model.Destination;
import com.hangova.trip.model.Trip;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Google Gemini integration for the AI Trip Planning module.
 * <p>
 * When an API key is configured the model writes the day-wise plan, the
 * recommendations and the budget advice. Any failure - missing key, network
 * error, malformed or truncated JSON - is caught and the caller falls back to
 * {@link OfflinePlanner}, so the feature never blocks a trip request.
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final String MODEL = "gemini-2.0-flash";
    private static final String ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/";

    private final RestClient http;
    private final String apiKey;
    private final String model;

    public GeminiService(RestClient.Builder builder,
                         @Value("${hangova.gemini.api-key:}") String apiKey,
                         @Value("${hangova.gemini.model:" + MODEL + "}") String model) {
        this.http = builder.build();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
    }

    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    public String describeConfiguration() {
        return isConfigured()
                ? "Google Gemini (" + model + ") is configured and will write the itinerary."
                : "No Google Gemini API key is set, so the built-in planner engine is used instead. "
                + "Add hangova.gemini.api-key to application.yml to enable AI generation.";
    }

    /** The subset of the plan Gemini is asked to produce. */
    public record AiPlan(
            boolean success,
            List<Trip.DayPlan> days,
            List<String> recommendations,
            List<String> budgetTips,
            String note) {
    }

    public AiPlan generate(String destinationName,
                           String state,
                           int days,
                           int travellers,
                           int budget,
                           List<String> interests,
                           String travelStyle,
                           List<Destination.Highlight> mustInclude,
                           WeatherService.Forecast forecast) {

        if (!isConfigured()) {
            return new AiPlan(false, List.of(), List.of(), List.of(),
                    "No Gemini API key configured, using the built-in planner.");
        }

        try {
            String prompt = buildPrompt(destinationName, state, days, travellers, budget,
                    interests, travelStyle, mustInclude, forecast);

            JsonNode body = http.post()
                    .uri(ENDPOINT + model + ":generateContent?key=" + apiKey)
                    .body(java.util.Map.of(
                            "contents", List.of(java.util.Map.of("parts", List.of(java.util.Map.of("text", prompt)))),
                            "generationConfig", java.util.Map.of(
                                    "temperature", 0.4,
                                    "responseMimeType", "application/json")))
                    .retrieve()
                    .body(JsonNode.class);

            String text = extractText(body);
            AiPlan parsed = parsePlan(text, days, destinationName);
            if (parsed == null) {
                return new AiPlan(false, List.of(), List.of(), List.of(),
                        "Gemini returned an unusable response, using the built-in planner.");
            }
            log.info("Gemini produced a {}-day plan for {}", days, destinationName);
            return parsed;
        } catch (Exception e) {
            log.warn("Gemini call failed ({}), falling back to the built-in planner", e.getMessage());
            return new AiPlan(false, List.of(), List.of(), List.of(),
                    "Gemini could not be reached (" + e.getClass().getSimpleName()
                    + "), using the built-in planner.");
        }
    }

    private String extractText(JsonNode body) {
        if (body == null || !body.has("candidates")) {
            throw new IllegalStateException("no candidates in response");
        }
        JsonNode parts = body.at("/candidates/0/content/parts");
        if (!parts.isArray()) {
            throw new IllegalStateException("no parts in response");
        }
        StringBuilder sb = new StringBuilder();
        for (JsonNode p : parts) {
            if (p.has("text")) {
                sb.append(p.get("text").asText());
            }
        }
        return sb.toString();
    }

    private String buildPrompt(String destination, String state, int days, int travellers, int budget,
                               List<String> interests, String travelStyle,
                               List<Destination.Highlight> mustInclude, WeatherService.Forecast forecast) {
        StringBuilder places = new StringBuilder();
        for (Destination.Highlight h : mustInclude) {
            places.append("- ").append(h.name()).append(" (").append(h.category())
                    .append(", ").append(h.area()).append(", entry about Rs ")
                    .append(h.approxEntryCost()).append(", ").append(h.suggestedHours()).append("h, best ")
                    .append(h.bestTime()).append("): ").append(h.description()).append('\n');
        }
        StringBuilder wx = new StringBuilder();
        for (WeatherService.DayWeather d : forecast.days()) {
            wx.append("- ").append(d.date()).append(": ").append(d.description())
                    .append(", ").append(Math.round(d.tempMin())).append(" to ")
                    .append(Math.round(d.tempMax())).append("C\n");
        }

        return """
                You are an expert Indian travel planner. Create a realistic, well-paced day-by-day \
                itinerary for a real trip.

                TRIP
                Destination: %s%s
                Duration: %d days
                Travellers: %d
                Total budget: Rs %d (all inclusive, for the whole group)
                Interests: %s
                Travel style: %s

                KNOWN PLACES AT THIS DESTINATION (use these, and feel free to add two or three more nearby ones)
                %s
                FORECAST
                %s
                Respond with ONLY valid JSON, no markdown fences, in exactly this shape:
                {
                  "days": [
                    {
                      "day": 1,
                      "theme": "short theme for the day",
                      "summary": "one or two sentences about the day",
                      "activities": [
                        {
                          "time": "09:00",
                          "title": "activity name",
                          "description": "what happens, in one or two sentences",
                          "category": "Nature|Adventure|Heritage|Beaches|Wildlife|Food|Nightlife|Culture|Shopping|Relaxation",
                          "place": "area or landmark",
                          "cost": 0,
                          "durationMinutes": 120
                        }
                      ]
                    }
                ],
                  "recommendations": ["short practical tip", "..."],
                  "budgetTips": ["money saving advice", "..."]
                }

                Rules:
                - exactly %d entries in "days", numbered 1 to %d
                - 2 to 4 activities per day, with sensible times that do not overlap
                - "cost" is in rupees for the WHOLE group, and must stay realistic
                - keep the whole trip close to Rs %d
                - do not invent places that contradict the known list
                """.formatted(
                destination,
                state == null || state.isBlank() ? "" : ", " + state,
                days, travellers, budget,
                interests == null || interests.isEmpty() ? "general sightseeing" : String.join(", ", interests),
                travelStyle == null || travelStyle.isBlank() ? "BALANCED" : travelStyle,
                places.isEmpty() ? "- (no curated list available)" : places,
                wx.isEmpty() ? "- (no forecast available)" : wx,
                days, days, budget);
    }

    private AiPlan parsePlan(String text, int expectedDays, String destination) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String cleaned = text.trim();
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return null;
        }
        cleaned = cleaned.substring(start, end + 1);

        try {
            JsonNode root = tools.jackson.databind.json.JsonMapper.builder().build().readTree(cleaned);
            if (!root.has("days") || !root.get("days").isArray() || root.get("days").isEmpty()) {
                return null;
            }

            List<Trip.DayPlan> dayPlans = new ArrayList<>();
            int i = 0;
            for (JsonNode d : root.get("days")) {
                i++;
                List<Trip.Activity> acts = new ArrayList<>();
                int dayCost = 0;
                if (d.has("activities") && d.get("activities").isArray()) {
                    for (JsonNode a : d.get("activities")) {
                        int cost = a.path("cost").asInt(0);
                        dayCost += cost;
                        acts.add(new Trip.Activity(
                                a.path("time").asText("09:00"),
                                a.path("title").asText("Activity"),
                                a.path("description").asText(""),
                                a.path("category").asText("Sightseeing"),
                                a.path("place").asText(""),
                                cost,
                                a.path("durationMinutes").asInt(120)));
                    }
                }
                dayPlans.add(new Trip.DayPlan(
                        d.path("day").asInt(i),
                        null,
                        d.path("theme").asText("Day " + i),
                        d.path("summary").asText(""),
                        acts,
                        dayCost,
                        null, null, null));
            }
            if (dayPlans.size() != expectedDays) {
                log.warn("Gemini returned {} days, expected {}", dayPlans.size(), expectedDays);
                return null;
            }

            return new AiPlan(true, dayPlans,
                    strings(root.get("recommendations")),
                    strings(root.get("budgetTips")),
                    "Itinerary written by Google Gemini.");
        } catch (Exception e) {
            log.warn("Could not parse Gemini JSON: {}", e.getMessage());
            return null;
        }
    }

    private List<String> strings(JsonNode arr) {
        List<String> out = new ArrayList<>();
        if (arr != null && arr.isArray()) {
            for (JsonNode n : arr) {
                String s = n.asText("").trim();
                if (!s.isEmpty()) {
                    out.add(s);
                }
            }
        }
        return out;
    }
}
