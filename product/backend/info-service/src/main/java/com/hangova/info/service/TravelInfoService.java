package com.hangova.info.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.hangova.info.model.ActivityLog;
import com.hangova.info.model.Expense;
import com.hangova.info.repo.ActivityLogRepository;
import com.hangova.info.repo.ExpenseRepository;
import com.hangova.info.web.InfoDtos.CreateExpenseRequest;
import com.hangova.info.web.InfoDtos.UpdateExpenseRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Module 4 - Travel Information.
 * <p>
 * Owns the traveller's expense records, the rolled-up expense summary, the
 * unified trip view (itinerary plus bookings plus spend) and the administrator
 * activity log.
 */
@Service
public class TravelInfoService {

    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(TravelInfoService.class);

    private final ExpenseRepository expenses;
    private final ActivityLogRepository activityLog;
    private final RemoteServices remote;

    public TravelInfoService(ExpenseRepository expenses,
                             ActivityLogRepository activityLog,
                             RemoteServices remote) {
        this.expenses = expenses;
        this.activityLog = activityLog;
        this.remote = remote;
    }

    /* ---------------- expenses ---------------- */

    public Expense addExpense(String userId, String userName, CreateExpenseRequest req) {
        if (req.amount() == null || req.amount() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }
        Expense e = new Expense();
        e.setUserId(userId);
        e.setUserName(userName);
        e.setTripId(req.tripId());
        e.setCategory(normaliseCategory(req.category()));
        e.setDescription(req.description());
        e.setAmount(req.amount());
        e.setDate(req.date() == null ? LocalDate.now() : req.date());
        e.setPaymentMode(req.paymentMode());
        e.setBookingId(req.bookingId());
        e.setNotes(req.notes());

        Expense saved = expenses.save(e);
        record(userId, userName, "USER", ActivityLog.EXPENSE, "ADDED",
                saved.getId(), e.getDescription(), "Rs " + e.getAmount() + " on " + e.getCategory(), e.getAmount());
        return saved;
    }

    public Expense updateExpense(String userId, UpdateExpenseRequest req, String id) {
        Expense e = require(userId, id);
        if (req.category() != null) {
            e.setCategory(normaliseCategory(req.category()));
        }
        if (req.description() != null) {
            e.setDescription(req.description());
        }
        if (req.amount() != null) {
            if (req.amount() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
            }
            e.setAmount(req.amount());
        }
        if (req.date() != null) {
            e.setDate(req.date());
        }
        if (req.paymentMode() != null) {
            e.setPaymentMode(req.paymentMode());
        }
        if (req.tripId() != null) {
            e.setTripId(req.tripId());
        }
        if (req.notes() != null) {
            e.setNotes(req.notes());
        }
        e.setUpdatedAt(Instant.now());
        return expenses.save(e);
    }

    public void deleteExpense(String userId, String id) {
        Expense e = require(userId, id);
        expenses.delete(e);
        record(userId, e.getUserName(), "USER", ActivityLog.EXPENSE, "DELETED",
                id, e.getDescription(), "Rs " + e.getAmount() + " removed", 0);
    }

    public List<Expense> myExpenses(String userId, String tripId) {
        if (tripId == null || tripId.isBlank()) {
            return expenses.findByUserIdOrderByDateDesc(userId);
        }
        return expenses.findByUserIdAndTripIdOrderByDateDesc(userId, tripId);
    }

    private Expense require(String userId, String id) {
        Expense e = expenses.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense not found"));
        if (!e.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "That expense belongs to another user");
        }
        return e;
    }

    private String normaliseCategory(String category) {
        if (category == null || category.isBlank()) {
            return "Miscellaneous";
        }
        String c = category.trim();
        for (String known : Expense.categories()) {
            if (known.equalsIgnoreCase(c)) {
                return known;
            }
        }
        return "Miscellaneous";
    }

    /* ---------------- summaries ---------------- */

    /** Category-wise roll-up, overall total, and comparison against each trip's budget. */
    public Map<String, Object> expenseSummary(String userId, String tripId) {
        List<Expense> all = myExpenses(userId, tripId);

        Map<String, Integer> byCategory = new LinkedHashMap<>();
        for (String c : Expense.categories()) {
            byCategory.put(c, 0);
        }
        int total = 0;
        for (Expense e : all) {
            byCategory.merge(e.getCategory(), e.getAmount(), Integer::sum);
            total += e.getAmount();
        }

        List<RemoteServices.RemoteBooking> bookings = remote.bookings(userId);
        int bookedSpend = bookings.stream()
                .filter(b -> tripId == null || tripId.isBlank() || tripId.equals(b.tripId()))
                .filter(b -> "CONFIRMED".equals(b.status()))
                .mapToInt(RemoteServices.RemoteBooking::amount)
                .sum();
        int refunded = bookings.stream().mapToInt(RemoteServices.RemoteBooking::refundAmount).sum();

        Map<String, Object> budgetComparison = new LinkedHashMap<>();
        if (tripId != null && !tripId.isBlank()) {
            RemoteServices.RemoteTrip trip = remote.trip(userId, tripId);
            if (trip != null) {
                budgetComparison.put("tripTitle", trip.title());
                budgetComparison.put("plannedBudget", trip.budget());
                budgetComparison.put("recordedSpend", total);
                budgetComparison.put("variance", trip.budget() - total);
                budgetComparison.put("withinBudget", trip.budget() >= total);
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("count", all.size());
        out.put("total", total);
        out.put("byCategory", byCategory);
        out.put("confirmedBookings", bookedSpend);
        out.put("refunded", refunded);
        out.put("budget", budgetComparison);
        return out;
    }

    /**
     * The unified trip view: the itinerary, everything booked for it, and what
     * has been spent, in a single response.
     */
    public Map<String, Object> tripOverview(String userId, String tripId) {
        RemoteServices.RemoteTrip trip = remote.trip(userId, tripId);
        if (trip == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found");
        }
        List<RemoteServices.RemoteBooking> bookings = remote.bookings(userId).stream()
                .filter(b -> tripId.equals(b.tripId()))
                .toList();
        List<Expense> tripExpenses = expenses.findByTripId(tripId);
        int spent = tripExpenses.stream().mapToInt(Expense::getAmount).sum();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("trip", trip);
        out.put("bookings", bookings);
        out.put("expenses", tripExpenses);
        out.put("summary", Map.of(
                "budget", trip.budget(),
                "expenseTotal", spent,
                "bookingTotal", bookings.stream().mapToInt(RemoteServices.RemoteBooking::amount).sum(),
                "variance", trip.budget() - spent,
                "withinBudget", trip.budget() >= spent));
        return out;
    }

    /** Every trip with its spend and booking totals, for the traveller dashboard. */
    public List<Map<String, Object>> allTripsWithSpend(String userId) {
        List<RemoteServices.RemoteTrip> trips = remote.trips(userId);
        List<RemoteServices.RemoteBooking> bookings = remote.bookings(userId);
        List<Expense> allExpenses = myExpenses(userId, null);

        List<Map<String, Object>> out = new ArrayList<>();
        for (RemoteServices.RemoteTrip t : trips) {
            int tripSpend = allExpenses.stream()
                    .filter(e -> t.id().equals(e.getTripId()))
                    .mapToInt(Expense::getAmount).sum();
            int tripBooked = bookings.stream()
                    .filter(b -> t.id().equals(b.tripId()) && "CONFIRMED".equals(b.status()))
                    .mapToInt(RemoteServices.RemoteBooking::amount).sum();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("trip", t);
            row.put("expenseTotal", tripSpend);
            row.put("bookingTotal", tripBooked);
            row.put("combined", tripSpend + tripBooked);
            row.put("variance", t.budget() - (tripSpend + tripBooked));
            row.put("withinBudget", t.budget() >= (tripSpend + tripBooked));
            out.add(row);
        }
        return out;
    }

    /* ---------------- activity log ---------------- */

    public void record(String actorId, String actorName, String actorRole,
                       String category, String action, String subjectId,
                       String subjectLabel, String detail, int amount) {
        try {
            activityLog.save(ActivityLog.of(category, action, actorId, actorName, actorRole,
                    subjectId, subjectLabel, detail, amount));
        } catch (Exception e) {
            // the audit trail must never break the main request
            log.warn("Could not write activity log: {}", e.getMessage());
        }
    }

    public List<ActivityLog> recentActivity(String category, int limit) {
        int size = Math.min(Math.max(limit, 1), 200);
        if (category == null || category.isBlank()) {
            return activityLog.findByOrderByCreatedAtDesc(PageRequest.of(0, size));
        }
        return activityLog.findByCategoryOrderByCreatedAtDesc(category.toUpperCase(Locale.ROOT), PageRequest.of(0, size));
    }

    /** Aggregated system-wide figures for the administrator overview. */
    public Map<String, Object> systemSummary() {
        List<RemoteServices.RemoteBooking> allBookings = remote.allBookingsForAdmin();
        Map<String, Object> bookingBreakdown = new LinkedHashMap<>();
        bookingBreakdown.put("total", allBookings.size());
        bookingBreakdown.put("confirmed", allBookings.stream().filter(b -> "CONFIRMED".equals(b.status())).count());
        bookingBreakdown.put("cancelled", allBookings.stream().filter(b -> "CANCELLED".equals(b.status())).count());
        bookingBreakdown.put("hotels", allBookings.stream().filter(b -> "HOTEL".equals(b.type())).count());
        bookingBreakdown.put("transport", allBookings.stream().filter(b -> "TRANSPORT".equals(b.type())).count());
        bookingBreakdown.put("confirmedValue", allBookings.stream()
                .filter(b -> "CONFIRMED".equals(b.status()))
                .mapToInt(RemoteServices.RemoteBooking::amount).sum());
        bookingBreakdown.put("refunded", allBookings.stream()
                .mapToInt(RemoteServices.RemoteBooking::refundAmount).sum());

        return Map.of(
                "bookings", bookingBreakdown,
                "expensesRecorded", expenses.count(),
                "activityEntries", activityLog.count(),
                "recentActivity", recentActivity(null, 10));
    }
}
