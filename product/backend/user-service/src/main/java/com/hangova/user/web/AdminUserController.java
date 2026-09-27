package com.hangova.user.web;

import java.util.List;
import java.util.Map;

import com.hangova.user.dto.AuthDtos.AdminUserUpdateRequest;
import com.hangova.user.dto.AuthDtos.UserResponse;
import com.hangova.user.security.Caller;
import com.hangova.user.service.UserAccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Module 1 + Module 4: the administrator side of user management
 * (manage users, monitor accounts, control borrowing eligibility).
 */
@RestController
@RequestMapping("/api/users/admin")
public class AdminUserController {

    private final UserAccountService accounts;
    private final Caller caller;

    public AdminUserController(UserAccountService accounts, Caller caller) {
        this.accounts = accounts;
        this.caller = caller;
    }

    @GetMapping
    public List<UserResponse> list() {
        caller.requireAdmin();
        return accounts.listAll();
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        caller.requireAdmin();
        return Map.of(
                "totalUsers", accounts.countByRole("USER"),
                "totalAdmins", accounts.countByRole("ADMIN"));
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable String id, @RequestBody AdminUserUpdateRequest req) {
        caller.requireAdmin();
        return accounts.adminUpdate(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String id) {
        caller.requireAdmin();
        if (id.equals(caller.id())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "You cannot delete your own account");
        }
        accounts.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User removed"));
    }
}
