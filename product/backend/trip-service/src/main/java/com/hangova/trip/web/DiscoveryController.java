package com.hangova.trip.web;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.hangova.trip.model.Destination;
import com.hangova.trip.repo.DestinationRepository;
import com.hangova.trip.service.GeminiService;
import com.hangova.trip.service.PlaceSearchService;
import com.hangova.trip.service.WeatherService;
import com.hangova.trip.web.PlanDtos.WeatherDay;
import com.hangova.trip.web.PlanDtos.WeatherResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public discovery endpoints used by the planner UI: destination search and
 * live weather. These back the "Destination Recommendations" and
 * "Weather Information" features.
 */
@RestController
@RequestMapping("/api")
public class DiscoveryController {

    private final PlaceSearchService places;
    private final WeatherService weather;
    private final DestinationRepository destinations;
    private final GeminiService gemini;

    public DiscoveryController(PlaceSearchService places,
                               WeatherService weather,
                               DestinationRepository destinations,
                               GeminiService gemini) {
        this.places = places;
        this.weather = weather;
        this.destinations = destinations;
        this.gemini = gemini;
    }

    /** Type-ahead destination search across the catalogue and live geocoding. */
    @GetMapping("/places/search")
    public Map<String, Object> search(@RequestParam(name = "q", required = false) String q,
                                      @RequestParam(required = false, defaultValue = "8") int limit) {
        List<PlaceSearchService.PlaceHit> hits = places.search(q, Math.min(Math.max(limit, 1), 25));
        return Map.of("query", q == null ? "" : q, "count", hits.size(), "results", hits);
    }

    /** Full detail for a destination, including its highlights and activities. */
    @GetMapping("/places/{name}")
    public Map<String, Object> detail(@RequestParam(name = "name") String name) {
        return places.search(name, 1).stream().findFirst()
                .map(hit -> {
                    Map<String, Object> out = new java.util.LinkedHashMap<>();
                    out.put("name", hit.name());
                    out.put("state", hit.state());
                    out.put("latitude", hit.latitude());
                    out.put("longitude", hit.longitude());
                    out.put("inCatalogue", hit.inCatalogue());
                    out.put("source", hit.source());
                    destinations.findByNameIgnoreCase(hit.name()).ifPresent(d -> {
                        out.put("summary", d.getSummary());
                        out.put("tags", d.getTags());
                        out.put("idealDays", d.getIdealDays());
                        out.put("avgDailyCostPerPerson", d.getAvgDailyCostPerPerson());
                        out.put("bestMonths", d.getBestMonths());
                        out.put("climate", d.getClimate());
                        out.put("bestTimeToVisit", d.getBestTimeToVisit());
                        out.put("howToReach", d.getHowToReach());
                        out.put("highlights", d.getHighlights());
                        out.put("activities", d.getActivities());
                    });
                    return out;
                })
                .orElseGet(() -> Map.of("error", "Destination not found: " + name));
    }

    /**
     * Live weather for a destination. Accepts either a place name or explicit
     * coordinates.
     */
    @GetMapping("/weather")
    public WeatherResponse weather(@RequestParam(required = false) String destination,
                                   @RequestParam(required = false) Double lat,
                                   @RequestParam(required = false) Double lon,
                                   @RequestParam(required = false) Integer days) {
        int dayCount = days == null ? 5 : Math.min(Math.max(days, 1), 16);
        LocalDate start = LocalDate.now();

        double latitude = lat == null ? 0 : lat;
        double longitude = lon == null ? 0 : lon;
        String name = destination;

        if (lat == null || lon == null) {
            if (destination == null || destination.isBlank()) {
                return new WeatherResponse(false, "No destination given", "Provide a destination or lat/lon", List.of());
            }
            PlaceSearchService.PlaceHit hit = places.resolve(destination).orElse(null);
            if (hit != null) {
                latitude = hit.latitude();
                longitude = hit.longitude();
                name = hit.name();
            } else {
                return new WeatherResponse(false, "Destination not found",
                        "Could not resolve '" + destination + "'", List.of());
            }
        }

        double fallback = destinations.findByNameIgnoreCase(name == null ? "" : name)
                .map(Destination::getAvgDailyCostPerPerson)
                .map(c -> 12 + (c % 22))
                .orElse(24);

        WeatherService.Forecast f = weather.forecast(latitude, longitude, start, dayCount, fallback);

        List<WeatherDay> daysOut = new ArrayList<>();
        for (WeatherService.DayWeather d : f.days()) {
            daysOut.add(new WeatherDay(d.date().toString(), d.description(),
                    d.tempMin(), d.tempMax(), d.rainChance(), d.windSpeed()));
        }
        return new WeatherResponse(f.live(), f.summary(), f.note(), daysOut);
    }

    /** Which external providers are live, so the UI can show honest status. */
    @GetMapping("/weather/status")
    public Map<String, Object> status() {
        return Map.of(
                "weather", "Open-Meteo forecast API (no API key required)",
                "geocoding", "Open-Meteo geocoding API (no API key required)",
                "ai", gemini.describeConfiguration(),
                "geminiConfigured", gemini.isConfigured());
    }
}
