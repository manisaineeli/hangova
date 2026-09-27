package com.hangova.info.web;

import java.util.List;
import java.util.Map;

import com.hangova.info.model.Expense;
import com.hangova.info.security.Caller;
import com.hangova.info.service.RemoteServices;
import com.hangova.info.service.TravelInfoService;
import com.hangova.info.web.InfoDtos.CreateExpenseRequest;
import com.hangova.info.web.InfoDtos.UpdateExpenseRequest;
import com.hangova.info.web.InfoDtos.UpdateTripRequest;
import jakarta.validation.Valid;
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

/**
 * Module 4 endpoints: the traveller's complete trip in one place - itineraries,
 * expenses, booking history and summaries.
 */
@RestController
@RequestMapping("/api/info")
public class TravelInfoController {

    private final TravelInfoService info;
    private final RemoteServices remote;
    private final Caller caller;

    public TravelInfoController(TravelInfoService info, RemoteServices remote, Caller caller) {
        this.info = info;
        this.remote = remote;
        this.caller = caller;
    }

    /* ---- trips: view and modify ---- */

    @GetMapping("/trips")
    public List<Map<String, Object>> trips() {
        return info.allTripsWithSpend(caller.id());
    }

    @GetMapping("/trips/{id}")
    public Map<String, Object> trip(@PathVariable String id) {
        return info.tripOverview(caller.id(), id);
    }

    /** Save and update itineraries. */
    @PutMapping("/trips/{id}")
    public ResponseEntity<Map<String, String>> updateTrip(@PathVariable String id,
                                                           @RequestBody UpdateTripRequest req) {
        if (req.title() == null || req.title().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "A title is required"));
        }
        boolean ok = remote.renameTrip(caller.id(), id, req.title());
        if (!ok) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "The trip service could not be reached"));
        }
        info.record(caller.id(), caller.name(), caller.role(), "TRIP", "UPDATED",
                id, req.title(), "Itinerary title updated", 0);
        return ResponseEntity.ok(Map.of("message", "Trip updated"));
    }

    @DeleteMapping("/trips/{id}")
    public ResponseEntity<Map<String, String>> deleteTrip(@PathVariable String id) {
        boolean ok = remote.deleteTrip(caller.id(), id);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "The trip service could not be reached"));
        }
        info.record(caller.id(), caller.name(), caller.role(), "TRIP", "DELETED",
                id, id, "Trip removed", 0);
        return ResponseEntity.ok(Map.of("message", "Trip deleted"));
    }

    /* ---- booking history (proxied from the Booking Service) ---- */

    @GetMapping("/bookings")
    public List<RemoteServices.RemoteBooking> bookings() {
        return remote.bookings(caller.id());
    }

    /* ---- expenses ---- */

    @GetMapping("/expenses")
    public List<Expense> expenses(@RequestParam(required = false) String tripId) {
        return info.myExpenses(caller.id(), tripId);
    }

    @PostMapping("/expenses")
    public ResponseEntity<Expense> addExpense(@Valid @RequestBody CreateExpenseRequest req) {
        Expense e = info.addExpense(caller.id(), caller.name(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(e);
    }

    @PutMapping("/expenses/{id}")
    public Expense updateExpense(@PathVariable String id, @RequestBody UpdateExpenseRequest req) {
        return info.updateExpense(caller.id(), req, id);
    }

    @DeleteMapping("/expenses/{id}")
    public ResponseEntity<Map<String, String>> deleteExpense(@PathVariable String id) {
        info.deleteExpense(caller.id(), id);
        return ResponseEntity.ok(Map.of("message", "Expense deleted"));
    }

    /** Category-wise expense summary with the budget comparison. */
    @GetMapping("/expenses/summary")
    public Map<String, Object> summary(@RequestParam(required = false) String tripId) {
        return info.expenseSummary(caller.id(), tripId);
    }
}
