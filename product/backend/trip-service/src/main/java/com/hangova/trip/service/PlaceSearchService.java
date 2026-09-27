package com.hangova.trip.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import tools.jackson.databind.JsonNode;
import com.hangova.trip.model.Destination;
import com.hangova.trip.repo.DestinationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Destination lookup and search.
 * <p>
 * The curated catalogue is searched first because it is what the planner can
 * reason over (it carries real costs, highlights and activities). Open-Meteo's
 * free geocoding API is then used to resolve coordinates for destinations that
 * are not in the catalogue, and to enrich catalogue entries.
 */
@Service
public class PlaceSearchService {

    private static final Logger log = LoggerFactory.getLogger(PlaceSearchService.class);

    private final RestClient http;
    private final DestinationRepository destinations;
    private final boolean geoEnabled;

    public PlaceSearchService(RestClient.Builder builder,
                              DestinationRepository destinations,
                              @Value("${hangova.geocoding.enabled:true}") boolean geoEnabled) {
        this.http = builder.build();
        this.destinations = destinations;
        this.geoEnabled = geoEnabled;
    }

    public record PlaceHit(
            String name,
            String state,
            String country,
            double latitude,
            double longitude,
            Integer elevation,
            String source,
            boolean inCatalogue,
            String slug,
            List<String> tags) {
    }

    /** Resolves free-text destination input to coordinates plus catalogue data. */
    public Optional<PlaceHit> resolve(String query) {
        if (query == null || query.isBlank()) {
            return Optional.empty();
        }
        String q = query.trim();
        String lower = q.toLowerCase(Locale.ROOT);

        // 1. exact / partial match in the curated catalogue
        Optional<Destination> inCatalogue = destinations.findByNameIgnoreCase(q);
        if (inCatalogue.isEmpty()) {
            inCatalogue = destinations.findByActiveTrue().stream()
                    .filter(d -> d.getName().toLowerCase(Locale.ROOT).contains(lower)
                            || lower.contains(d.getName().toLowerCase(Locale.ROOT)))
                    .min(Comparator.comparingInt(d -> d.getName().length()));
        }
        if (inCatalogue.isPresent()) {
            Destination d = inCatalogue.get();
            return Optional.of(hit(d, "catalogue"));
        }

        // 2. the query may be a state or region rather than a city
        Optional<Destination> byState = destinations.findByActiveTrue().stream()
                .filter(d -> d.getState() != null)
                .filter(d -> d.getState().equalsIgnoreCase(q)
                        // "Andaman" should find the Andaman and Nicobar Islands,
                        // not a village that happens to share the name
                        || d.getState().toLowerCase(Locale.ROOT).contains(lower)
                        || lower.contains(d.getState().toLowerCase(Locale.ROOT)))
                // prefer the best known city of that region for a first visit
                .max(Comparator.comparingInt(d -> d.getHighlights().size() * 100 + d.getIdealDays()));
        if (byState.isPresent()) {
            return Optional.of(hit(byState.get(), "catalogue-by-state"));
        }

        // 3. fall back to live geocoding
        if (geoEnabled) {
            Optional<PlaceHit> geo = geocode(q).stream().findFirst();
            if (geo.isPresent()) {
                return geo;
            }
        }
        return Optional.empty();
    }

    private PlaceHit hit(Destination d, String source) {
        return new PlaceHit(d.getName(), d.getState(), "India", d.getLatitude(),
                d.getLongitude(), null, source, true, d.getSlug(), d.getTags());
    }

    /** Free-text search across the catalogue and live geocoding. */
    public List<PlaceHit> search(String query, int limit) {
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        List<PlaceHit> out = new ArrayList<>();

        destinations.findByActiveTrueOrderByNameAsc().stream()
                .filter(d -> q.isEmpty()
                        || d.getName().toLowerCase(Locale.ROOT).contains(q)
                        || d.getState().toLowerCase(Locale.ROOT).contains(q)
                        || d.getTags().stream().anyMatch(t -> t.toLowerCase(Locale.ROOT).contains(q)))
                .limit(limit)
                .forEach(d -> out.add(new PlaceHit(d.getName(), d.getState(), "India", d.getLatitude(),
                        d.getLongitude(), null, "catalogue", true, d.getSlug(), d.getTags())));

        if (out.size() < limit && geoEnabled && !q.isEmpty()) {
            for (PlaceHit hit : geocode(query)) {
                boolean duplicate = out.stream().anyMatch(h -> h.name().equalsIgnoreCase(hit.name())
                        && (h.state() == null ? hit.state() == null : h.state().equalsIgnoreCase(hit.state())));
                if (!duplicate && out.size() < limit) {
                    out.add(hit);
                }
            }
        }
        return out;
    }

    private List<PlaceHit> geocode(String query) {
        try {
            String url = "https://geocoding-api.open-meteo.com/v1/search"
                    + "?name=" + java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8)
                    + "&count=8&language=en&format=json";
            JsonNode root = http.get().uri(url).retrieve().body(JsonNode.class);
            if (root == null || !root.has("results")) {
                return List.of();
            }
            List<PlaceHit> hits = new ArrayList<>();
            for (JsonNode r : root.get("results")) {
                String name = r.path("name").asText();
                String state = r.path("admin1").asText(null);
                // India-only results keep the catalogue and the live data consistent
                String country = r.path("country").asText("");
                if (!country.equalsIgnoreCase("India")) {
                    continue;
                }
                // the first catalogue match wins, otherwise prefer a populated place
                boolean known = destinations.findByNameIgnoreCase(name)
                        .map(d -> state == null || state.equalsIgnoreCase(d.getState()))
                        .orElse(false);
                hits.add(new PlaceHit(name, state, country,
                        r.path("latitude").asDouble(), r.path("longitude").asDouble(),
                        r.has("elevation") ? r.get("elevation").asInt() : null,
                        "open-meteo-geocoding", known, null, List.of()));
            }
            hits.sort(Comparator.comparing(h -> h.inCatalogue() ? 0 : 1));
            return hits;
        } catch (Exception e) {
            log.warn("Geocoding lookup failed for '{}': {}", query, e.getMessage());
            return List.of();
        }
    }
}
