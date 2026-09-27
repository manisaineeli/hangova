package com.hangova.trip.web;

import java.util.List;
import java.util.Map;

import com.hangova.trip.model.Destination;
import com.hangova.trip.model.Trip;
import com.hangova.trip.repo.DestinationRepository;
import com.hangova.trip.repo.TripRepository;
import com.hangova.trip.security.Caller;
import com.hangova.trip.service.DestinationQueryService;
import com.hangova.trip.service.TripPlannerService;
import com.hangova.trip.web.PlanDtos.PlanTripRequest;
import com.hangova.trip.web.PlanDtos.RenameTripRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Module 2 endpoints: generate a personalised itinerary and manage saved plans. */
@RestController
@RequestMapping("/api")
public class TripController {

    private final TripPlannerService planner;
    private final TripRepository trips;
    private final DestinationRepository destinationRepo;
    private final DestinationQueryService destinationQuery;
    private final Caller caller;

    public TripController(TripPlannerService planner,
                          TripRepository trips,
                          DestinationRepository destinationRepo,
                          DestinationQueryService destinationQuery,
                          Caller caller) {
        this.planner = planner;
        this.trips = trips;
        this.destinationRepo = destinationRepo;
        this.destinationQuery = destinationQuery;
        this.caller = caller;
    }

    /** Generates a day-wise itinerary from destination, budget, duration and interests. */
    @PostMapping({"/trips/plan", "/ai/plan"})
    public ResponseEntity<Trip> plan(@jakarta.validation.Valid @RequestBody PlanTripRequest req) {
        Trip trip = planner.plan(caller.id(), caller.name(), req.toPlanRequest());
        HttpStatus status = "PREVIEW".equals(trip.getStatus()) ? HttpStatus.OK : HttpStatus.CREATED;
        return ResponseEntity.status(status).body(trip);
    }

    /** All trips belonging to the signed-in user. */
    @GetMapping("/trips")
    public List<Trip> myTrips() {
        return trips.findByUserIdOrderByCreatedAtDesc(caller.id());
    }

    @GetMapping("/trips/{id}")
    public Trip one(@PathVariable String id) {
        return trips.findByIdAndUserId(id, caller.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
    }

    @PutMapping("/trips/{id}")
    public Trip rename(@PathVariable String id, @RequestBody RenameTripRequest req) {
        Trip trip = trips.findByIdAndUserId(id, caller.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
        trip.setTitle(req.title());
        trip.setUpdatedAt(java.time.Instant.now());
        return trips.save(trip);
    }

    @DeleteMapping("/trips/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String id) {
        Trip trip = trips.findByIdAndUserId(id, caller.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
        trips.delete(trip);
        return ResponseEntity.ok(Map.of("message", "Trip deleted"));
    }

    /** Destination recommendations filtered by interest, for the landing screen. */
    @GetMapping("/trips/recommendations")
    public Map<String, Object> recommendations(@RequestParam(required = false) String interest) {
        List<Destination> matches = destinationQuery.list(interest);
        return Map.of(
                "interest", interest == null || interest.isBlank() ? "all" : interest,
                "destinations", matches.stream().map(TripController::describe).toList());
    }

    static Map<String, Object> describe(Destination d) {
        return Map.of(
                "name", d.getName(),
                "state", d.getState() == null ? "" : d.getState(),
                "summary", d.getSummary() == null ? "" : d.getSummary(),
                "tags", d.getTags(),
                "idealDays", d.getIdealDays(),
                "avgDailyCostPerPerson", d.getAvgDailyCostPerPerson(),
                "latitude", d.getLatitude(),
                "longitude", d.getLongitude());
    }

    /** Catalogue management for the administrator (Module 4 - manage destinations). */
    @GetMapping("/trips/destinations")
    public List<Destination> destinations(@RequestParam(required = false) String interest,
                                          @RequestParam(required = false) String q) {
        return destinationQuery.list(q != null && !q.isBlank() ? q : interest);
    }

    @PutMapping("/trips/destinations/{id}")
    public Destination updateDestination(@PathVariable String id, @RequestBody Map<String, Object> patch) {
        caller.requireAdmin();
        Destination d = destinationRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Destination not found"));
        patch.forEach((k, v) -> {
            switch (k) {
                case "summary" -> d.setSummary(String.valueOf(v));
                case "climate" -> d.setClimate(String.valueOf(v));
                case "bestTimeToVisit" -> d.setBestTimeToVisit(String.valueOf(v));
                case "howToReach" -> d.setHowToReach(String.valueOf(v));
                case "avgDailyCostPerPerson" -> d.setAvgDailyCostPerPerson(toInt(v));
                case "idealDays" -> d.setIdealDays(toInt(v));
                case "active" -> d.setActive(Boolean.parseBoolean(String.valueOf(v)));
                case "tags" -> d.setTags(toList(v));
                default -> { /* ignore unknown fields rather than fail the whole patch */ }
            }
        });
        return destinationRepo.save(d);
    }

    private static int toInt(Object v) {
        return v instanceof Number n ? n.intValue() : Integer.parseInt(String.valueOf(v));
    }

    @SuppressWarnings("unchecked")
    private static List<String> toList(Object v) {
        return v instanceof List<?> l ? l.stream().map(String::valueOf).toList() : List.of();
    }

    /** Lightweight stats for the dashboard. */
    @GetMapping("/trips/stats")
    public Map<String, Object> stats() {
        List<Trip> mine = trips.findByUserIdOrderByCreatedAtDesc(caller.id());
        int plannedDays = mine.stream().mapToInt(Trip::getDays).sum();
        int plannedBudget = mine.stream().mapToInt(Trip::getBudget).sum();
        return Map.of(
                "trips", mine.size(),
                "plannedDays", plannedDays,
                "plannedBudget", plannedBudget,
                "savedTrips", mine.stream().filter(t -> "SAVED".equals(t.getStatus())).count());
    }
}
