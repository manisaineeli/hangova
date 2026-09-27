package com.hangova.info.web;

import java.util.List;
import java.util.Map;

import com.hangova.info.model.ActivityLog;
import com.hangova.info.model.Expense;
import com.hangova.info.security.Caller;
import com.hangova.info.service.TravelInfoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * The administrator console for Module 4: monitor bookings, review the
 * summarised system activity, and see which expense categories are being used.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminConsoleController {

    private final TravelInfoService info;
    private final Caller caller;

    public AdminConsoleController(TravelInfoService info, Caller caller) {
        this.info = info;
        this.caller = caller;
    }

    /** Aggregated figures across the whole platform. */
    @GetMapping("/overview")
    public Map<String, Object> overview() {
        caller.requireAdmin();
        return info.systemSummary();
    }

    /** Recent system activity, newest first. */
    @GetMapping("/activity")
    public List<ActivityLog> activity(@RequestParam(required = false) String category,
                                      @RequestParam(required = false, defaultValue = "50") int limit) {
        caller.requireAdmin();
        return info.recentActivity(category, limit);
    }

    @GetMapping("/expense-categories")
    public List<String> categories() {
        caller.requireAdmin();
        return Expense.categories();
    }

    @GetMapping("/health-note")
    public Map<String, String> note() {
        caller.requireAdmin();
        return Map.of("message",
                "Trips and bookings are owned by the Trip and Booking services. "
                + "This console reads them through the API Gateway and adds expenses and the audit trail.");
    }
}
