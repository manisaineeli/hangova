package com.hangova.booking.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.hangova.booking.model.Booking;
import com.hangova.booking.model.BorrowRequest;
import com.hangova.booking.repo.BookingRepository;
import com.hangova.booking.repo.BorrowRequestRepository;
import com.hangova.booking.web.BookingDtos.CreateBookingRequest;
import com.hangova.booking.web.BookingDtos.LoanApplication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Module 3: booking, cancellation, and the travel borrowing workflow. */
@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    private final BookingRepository bookings;
    private final BorrowRequestRepository borrows;

    public BookingService(BookingRepository bookings, BorrowRequestRepository borrows) {
        this.bookings = bookings;
        this.borrows = borrows;
    }

    /* ---------------- booking ---------------- */

    public Booking createBooking(String userId, String userName, String userEmail,
                                 CreateBookingRequest req) {
        String type = req.type() == null ? "" : req.type().trim().toUpperCase(Locale.ROOT);
        if (!type.equals("HOTEL") && !type.equals("TRANSPORT")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking type must be HOTEL or TRANSPORT");
        }

        Booking b = new Booking();
        b.setUserId(userId);
        b.setUserName(userName);
        b.setUserEmail(userEmail);
        b.setType(type);
        b.setStatus(Booking.CONFIRMED);
        b.setReference("HNG-" + reference(type));
        b.setProvider(req.provider());
        b.setTitle(req.title());
        b.setSubtitle(req.subtitle());
        b.setDestination(req.destination());
        b.setCheckIn(req.checkIn());
        b.setCheckOut(req.checkOut());
        b.setTravellers(req.travellerCount());
        b.setRooms(req.roomCount());
        b.setAmount(req.amountInRupees());
        b.setTripId(req.tripId());
        b.setNotes(req.notes() == null ? List.of() : req.notes());

        if (type.equals("TRANSPORT")) {
            b.setTransportMode(req.transportMode());
            b.setDepartureTime(req.departureTime());
            b.setArrivalTime(req.arrivalTime());
            b.setSeatOrRoom(req.seatOrRoom());
        } else {
            int nights = b.getCheckIn() == null || b.getCheckOut() == null
                    ? 1
                    : (int) java.time.temporal.ChronoUnit.DAYS.between(b.getCheckIn(), b.getCheckOut());
            b.setSeatOrRoom(nights <= 0 ? "1 night" : nights + (nights == 1 ? " night" : " nights")
                    + " x " + b.getRooms() + (b.getRooms() == 1 ? " room" : " rooms"));
        }
        b.setRefundable(req.isRefundable());

        // a booking can be paid for using an approved travel loan
        if (req.borrowRequestId() != null && !req.borrowRequestId().isBlank()) {
            BorrowRequest loan = requireBorrow(req.borrowRequestId());
            if (!loan.getUserId().equals(userId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "That loan request belongs to another user");
            }
            if (!BorrowRequest.APPROVED.equals(loan.getStatus())
                    && !BorrowRequest.DISBURSED.equals(loan.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "The loan for this booking has not been approved yet");
            }
            b.setBorrowRequestId(loan.getId());
            loan.getFundedBookingIds().add("pending");
        }

        Booking saved = bookings.save(b);

        if (b.getBorrowRequestId() != null) {
            BorrowRequest loan = borrows.findById(b.getBorrowRequestId()).orElseThrow();
            if (loan.getFundedBookingIds().contains("pending")) {
                loan.getFundedBookingIds().remove("pending");
                loan.getFundedBookingIds().add(saved.getId());
                loan.setUpdatedAt(Instant.now());
                borrows.save(loan);
            }
        }

        log.info("Booking {} confirmed for user {} - {} {}", saved.getReference(), userId, type, saved.getTitle());
        return saved;
    }

    public List<Booking> myBookings(String userId) {
        return bookings.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Booking one(String userId, boolean admin, String id) {
        Booking b = bookings.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        if (!admin && !b.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "That booking belongs to another user");
        }
        return b;
    }

    /** Cancels a booking and works out the refund from the cancellation policy. */
    public Booking cancel(String userId, boolean admin, String id, String reason) {
        Booking b = one(userId, admin, id);
        if (Booking.CANCELLED.equals(b.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This booking is already cancelled");
        }
        if (Booking.COMPLETED.equals(b.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A completed trip cannot be cancelled");
        }

        b.setStatus(Booking.CANCELLED);
        b.setCancelledAt(Instant.now());
        b.setCancellationReason(reason == null || reason.isBlank() ? "Cancelled by user" : reason);
        b.setRefundAmount(refundFor(b));
        b.setUpdatedAt(Instant.now());
        log.info("Booking {} cancelled, refund Rs {}", b.getReference(), b.getRefundAmount());
        return bookings.save(b);
    }

    /**
     * Refund policy: nothing is refunded inside 24 hours of travel, a 50 percent
     * fee applies inside 72 hours, otherwise the full amount comes back. Non
     * refundable bookings only get a courtesy 10 percent credit.
     */
    private int refundFor(Booking b) {
        if (!b.isRefundable()) {
            return (int) Math.round(b.getAmount() * 0.10);
        }
        LocalDate ref = b.getCheckIn() != null ? b.getCheckIn() : b.getCreatedAt().atZone(
                java.time.ZoneOffset.UTC).toLocalDate();
        long days = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), ref);
        if (days < 0) {
            return 0;
        }
        if (days < 1) {
            return 0;
        }
        if (days <= 3) {
            return (int) Math.round(b.getAmount() * 0.5);
        }
        return b.getAmount();
    }

    public List<Booking> allBookings() {
        return bookings.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
    }

    public Map_counts counts() {
        return new Map_counts(
                bookings.count(),
                bookings.countByStatus(Booking.CONFIRMED),
                bookings.countByStatus(Booking.CANCELLED),
                bookings.countByType("HOTEL"),
                bookings.countByType("TRANSPORT"));
    }

    public record Map_counts(long total, long confirmed, long cancelled, long hotels, long transport) {
    }

    /* ---------------- borrowing ---------------- */

    public BorrowRequest applyLoan(String userId, String userName, String userEmail,
                                   LoanApplication req) {
        if (req.amountInRupees() < 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Please request at least Rs 1,000 for a travel loan");
        }
        if (req.amountInRupees() > 500000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Travel loans are capped at Rs 5,00,000");
        }
        if (req.durationMonths() != null && (req.durationMonths() < 3 || req.durationMonths() > 60)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Repayment period must be between 3 and 60 months");
        }

        BorrowRequest loan = new BorrowRequest();
        loan.setReference("LN-" + reference("LN"));
        loan.setUserId(userId);
        loan.setUserName(userName);
        loan.setUserEmail(userEmail);
        loan.setAmount(req.amountInRupees());
        loan.setPurpose(req.purpose());
        loan.setDestination(req.destination());
        loan.setTravelDate(req.travelDate());
        loan.setDurationMonths(req.months());
        loan.setContactNumber(req.contactNumber());
        loan.setStatus(BorrowRequest.PENDING);

        log.info("Travel loan {} requested by {} for Rs {}", loan.getReference(), userEmail, req.amountInRupees());
        return borrows.save(loan);
    }

    public List<BorrowRequest> myLoans(String userId) {
        return borrows.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<BorrowRequest> allLoans() {
        return borrows.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
    }

    public List<BorrowRequest> pendingLoans() {
        return borrows.findByStatusOrderByCreatedAtAsc(BorrowRequest.PENDING);
    }

    /** The administrator, acting as nominee, approves or rejects a loan request. */
    public BorrowRequest decide(String adminId, String adminName, String id,
                                boolean approve, Integer approvedAmount, String note) {
        BorrowRequest loan = requireBorrow(id);
        if (!BorrowRequest.PENDING.equals(loan.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This request has already been " + loan.getStatus().toLowerCase(Locale.ROOT));
        }
        loan.setNomineeId(adminId);
        loan.setNomineeName(adminName);
        loan.setDecisionNote(note);
        loan.setDecidedAt(Instant.now());
        loan.setUpdatedAt(Instant.now());

        if (approve) {
            int approved = approvedAmount == null ? loan.getAmount() : approvedAmount;
            if (approved <= 0 || approved > loan.getAmount()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "The approved amount must be between Rs 1 and the requested Rs " + loan.getAmount());
            }
            loan.setApprovedAmount(approved);
            loan.setStatus(BorrowRequest.APPROVED);
            log.info("Loan {} approved by {} for Rs {}", loan.getReference(), adminName, approved);
        } else {
            loan.setApprovedAmount(0);
            loan.setStatus(BorrowRequest.REJECTED);
            log.info("Loan {} rejected by {}", loan.getReference(), adminName);
        }
        return borrows.save(loan);
    }

    /** Marks an approved loan as money actually handed over to the traveller. */
    public BorrowRequest disburse(String adminId, String adminName, String id) {
        BorrowRequest loan = requireBorrow(id);
        if (!BorrowRequest.APPROVED.equals(loan.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only approved loans can be disbursed");
        }
        loan.setStatus(BorrowRequest.DISBURSED);
        loan.setDisbursedAt(Instant.now());
        loan.setNomineeId(loan.getNomineeId() == null ? adminId : loan.getNomineeId());
        loan.setNomineeName(adminName);
        loan.setUpdatedAt(Instant.now());
        log.info("Loan {} disbursed to {}", loan.getReference(), loan.getUserEmail());
        return borrows.save(loan);
    }

    public BorrowRequest oneLoan(String userId, boolean admin, String id) {
        BorrowRequest loan = requireBorrow(id);
        if (!admin && !loan.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "That loan request belongs to another user");
        }
        return loan;
    }

    public Map<String, Long> loanCounts() {
        return java.util.Map.of(
                "total", borrows.count(),
                BorrowRequest.PENDING, borrows.countByStatus(BorrowRequest.PENDING),
                BorrowRequest.APPROVED, borrows.countByStatus(BorrowRequest.APPROVED),
                BorrowRequest.REJECTED, borrows.countByStatus(BorrowRequest.REJECTED),
                BorrowRequest.DISBURSED, borrows.countByStatus(BorrowRequest.DISBURSED));
    }

    private BorrowRequest requireBorrow(String id) {
        return borrows.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan request not found"));
    }

    /** Short, human-friendly, unambiguous reference. */
    private String reference(String kind) {
        StringBuilder sb = new StringBuilder(kind.equals("LN") ? "L" : "");
        for (int i = 0; i < 6; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
