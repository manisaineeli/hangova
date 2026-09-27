package com.hangova.user.web;

import java.util.Map;

import com.hangova.user.dto.AuthDtos.ChangePasswordRequest;
import com.hangova.user.dto.AuthDtos.ProfileUpdateRequest;
import com.hangova.user.dto.AuthDtos.UserResponse;
import com.hangova.user.security.Caller;
import com.hangova.user.service.UserAccountService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Profile of the currently signed-in user, plus their travel preferences. */
@RestController
@RequestMapping("/api/users")
public class ProfileController {

    private final UserAccountService accounts;
    private final Caller caller;

    public ProfileController(UserAccountService accounts, Caller caller) {
        this.accounts = accounts;
        this.caller = caller;
    }

    @GetMapping("/me")
    public UserResponse me() {
        return accounts.profile(caller.id());
    }

    @PutMapping("/me")
    public UserResponse updateMe(@Valid @RequestBody ProfileUpdateRequest req) {
        return accounts.updateProfile(caller.id(), req);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        accounts.changePassword(caller.id(), req);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}
