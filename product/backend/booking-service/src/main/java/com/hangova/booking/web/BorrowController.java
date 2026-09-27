package com.hangova.booking.web;

import java.util.List;
import java.util.Map;

import com.hangova.booking.model.Booking;
import com.hangova.booking.model.BorrowRequest;
import com.hangova.booking.security.Caller;
import com.hangova.booking.service.BookingService;
import com.hangova.booking.web.BookingDtos.DecisionRequest;
import com.hangova.booking.web.BookingDtos.LoanApplication;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The travel borrowing option and the administrator's monitoring views.
 * The administrator acts as the nominee who approves or rejects each request
 * before any money is released.
 */
@RestController
@RequestMapping("/api")
public class BorrowController {

    private final BookingService bookings;
    private final Caller caller;

    public BorrowController(BookingService bookings, Caller caller) {
        this.bookings = bookings;
        this.caller = caller;
    }

    /* ---------------- traveller side ---------------- */

    @PostMapping("/borrow/apply")
    public ResponseEntity<BorrowRequest> apply(@Valid @RequestBody LoanApplication req) {
        BorrowRequest loan = bookings.applyLoan(caller.id(), caller.name(), caller.email(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(loan);
    }

    @GetMapping("/borrow/mine")
    public List<BorrowRequest> mine() {
        return bookings.myLoans(caller.id());
    }

    @GetMapping("/borrow/mine/{id}")
    public BorrowRequest one(@PathVariable String id) {
        return bookings.oneLoan(caller.id(), caller.isAdmin(), id);
    }

    /** Loans the user can use to pay for a booking. */
    @GetMapping("/borrow/usable")
    public List<BorrowRequest> usable() {
        return bookings.myLoans(caller.id()).stream()
                .filter(l -> BorrowRequest.APPROVED.equals(l.getStatus())
                        || BorrowRequest.DISBURSED.equals(l.getStatus()))
                .toList();
    }

    /* ---------------- administrator side ---------------- */

    @GetMapping({"/borrow/all", "/admin/borrow"})
    public List<BorrowRequest> all() {
        caller.requireAdmin();
        return bookings.allLoans();
    }

    @GetMapping("/borrow/pending")
    public List<BorrowRequest> pending() {
        caller.requireAdmin();
        return bookings.pendingLoans();
    }

    @PostMapping("/borrow/{id}/approve")
    public BorrowRequest approve(@PathVariable String id, @RequestBody(required = false) DecisionRequest req) {
        caller.requireAdmin();
        return bookings.decide(caller.id(), caller.name(), id, true,
                req == null ? null : req.approvedAmount(), req == null ? null : req.note());
    }

    @PostMapping("/borrow/{id}/reject")
    public BorrowRequest reject(@PathVariable String id, @RequestBody(required = false) DecisionRequest req) {
        caller.requireAdmin();
        return bookings.decide(caller.id(), caller.name(), id, false,
                null, req == null ? null : req.note());
    }

    @PostMapping("/borrow/{id}/disburse")
    public BorrowRequest disburse(@PathVariable String id) {
        caller.requireAdmin();
        return bookings.disburse(caller.id(), caller.name(), id);
    }

    /* ---------------- monitoring ---------------- */

    @GetMapping("/admin/bookings")
    public List<Booking> allBookings() {
        caller.requireAdmin();
        return bookings.allBookings();
    }

    @GetMapping("/admin/summary")
    public Map<String, Object> summary() {
        caller.requireAdmin();
        return Map.of(
                "bookings", bookings.counts(),
                "loans", bookings.loanCounts());
    }
}
