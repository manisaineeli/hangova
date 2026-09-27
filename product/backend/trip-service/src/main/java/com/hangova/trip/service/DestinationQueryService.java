package com.hangova.trip.service;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.hangova.trip.model.Destination;
import com.hangova.trip.repo.DestinationRepository;
import org.springframework.stereotype.Service;

/** Catalogue lookups used by the recommendation and discovery endpoints. */
@Service
public class DestinationQueryService {

    private final DestinationRepository destinations;

    public DestinationQueryService(DestinationRepository destinations) {
        this.destinations = destinations;
    }

    /**
     * Lists active destinations, optionally narrowed by a free-text interest or
     * place name.
     */
    public List<Destination> list(String filter) {
        List<Destination> all = destinations.findByActiveTrueOrderByNameAsc();
        if (filter == null || filter.isBlank()) {
            return all;
        }
        String f = filter.trim().toLowerCase(Locale.ROOT);
        return all.stream()
                .filter(d -> d.getTags().stream().anyMatch(t -> t.toLowerCase(Locale.ROOT).equals(f))
                        || d.getTags().stream().anyMatch(t -> t.toLowerCase(Locale.ROOT).contains(f))
                        || d.getName().toLowerCase(Locale.ROOT).contains(f)
                        || (d.getState() != null && d.getState().toLowerCase(Locale.ROOT).contains(f)))
                .toList();
    }

    /** Destinations whose tags overlap the traveller's interests, best match first. */
    public List<Destination> byInterests(List<String> interests) {
        List<Destination> all = destinations.findByActiveTrueOrderByNameAsc();
        if (interests == null || interests.isEmpty()) {
            return all;
        }
        return all.stream()
                .map(d -> Map.entry(d, score(d, interests)))
                .filter(e -> e.getValue() > 0)
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .map(Map.Entry::getKey)
                .toList();
    }

    private int score(Destination d, List<String> interests) {
        int score = 0;
        for (String interest : interests) {
            if (interest == null) {
                continue;
            }
            String i = interest.trim().toLowerCase(Locale.ROOT);
            for (String tag : d.getTags()) {
                if (tag.toLowerCase(Locale.ROOT).equals(i)) {
                    score += 3;
                } else if (tag.toLowerCase(Locale.ROOT).contains(i) || i.contains(tag.toLowerCase(Locale.ROOT))) {
                    score += 1;
                }
            }
        }
        return score;
    }
}
