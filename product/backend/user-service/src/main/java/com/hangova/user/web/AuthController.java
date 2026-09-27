package com.hangova.user.web;

import com.hangova.user.dto.AuthDtos.AuthResponse;
import com.hangova.user.dto.AuthDtos.LoginRequest;
import com.hangova.user.dto.AuthDtos.RegisterRequest;
import com.hangova.user.dto.AuthDtos.UserResponse;
import com.hangova.user.service.UserAccountService;
import com.hangova.user.service.UserAccountService.LoginResult;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserAccountService accounts;

    public AuthController(UserAccountService accounts) {
        this.accounts = accounts;
    }

    /** User registration. */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(accounts.register(req));
    }

    /** User / admin login - returns a JWT bearer token. */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        LoginResult r = accounts.login(req);
        return ResponseEntity.ok(new AuthResponse(r.token(), "Bearer", accounts.tokenTtlSeconds(), r.user()));
    }

    @GetMapping("/me")
    public UserResponse me(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return accounts.profile(userId);
    }
}
