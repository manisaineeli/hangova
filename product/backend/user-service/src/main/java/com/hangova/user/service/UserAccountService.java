package com.hangova.user.service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import com.hangova.user.dto.AuthDtos.AdminUserUpdateRequest;
import com.hangova.user.dto.AuthDtos.ChangePasswordRequest;
import com.hangova.user.dto.AuthDtos.LoginRequest;
import com.hangova.user.dto.AuthDtos.ProfileUpdateRequest;
import com.hangova.user.dto.AuthDtos.RegisterRequest;
import com.hangova.user.dto.AuthDtos.UserResponse;
import com.hangova.user.model.User;
import com.hangova.user.repo.UserRepository;
import com.hangova.user.security.JwtTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Business logic for Module 1: registration, login, profiles, preferences. */
@Service
public class UserAccountService {

    private static final Set<String> ROLES = Set.of("USER", "ADMIN");
    private static final List<String> KNOWN_INTERESTS =
            List.of("Heritage", "Beaches", "Mountains", "Food", "Wildlife", "Nightlife", "Adventure", "Culture", "Pilgrimage");

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtTokenService tokens;

    public UserAccountService(UserRepository users, PasswordEncoder encoder, JwtTokenService tokens) {
        this.users = users;
        this.encoder = encoder;
        this.tokens = tokens;
    }

    /* ---------------- auth ---------------- */

    public UserResponse register(RegisterRequest req) {
        String email = normalise(req.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        User u = new User();
        u.setEmail(email);
        u.setFullName(req.fullName().trim());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setPhone(req.phone());
        u.setRole("USER");
        u.setEnabled(true);
        applyInterests(u, req.interests());
        u.setHomeCity(req.homeCity());
        u.setDefaultTravellers(req.defaultTravellers() == null ? 2 : req.defaultTravellers());
        u.setDefaultBudget(req.defaultBudget() == null ? 60000 : req.defaultBudget());
        u.setDefaultDays(req.defaultDays() == null ? 4 : req.defaultDays());

        return UserResponse.of(users.save(u));
    }

    public LoginResult login(LoginRequest req) {
        String email = normalise(req.email());
        User u = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!encoder.matches(req.password(), u.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        if (!u.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account has been disabled by the administrator");
        }

        u.setLastLoginAt(Instant.now());
        u.setUpdatedAt(Instant.now());
        users.save(u);
        return new LoginResult(tokens.issue(u), UserResponse.of(u));
    }

    /** Token plus the freshly persisted user, so callers need a single lookup. */
    public record LoginResult(String token, UserResponse user) {
    }

    public long tokenTtlSeconds() {
        return tokens.ttlSeconds();
    }

    /* ---------------- profile ---------------- */

    public UserResponse profile(String userId) {
        return UserResponse.of(require(userId));
    }

    public UserResponse updateProfile(String userId, ProfileUpdateRequest req) {
        User u = require(userId);
        if (req.fullName() != null && !req.fullName().isBlank()) {
            u.setFullName(req.fullName().trim());
        }
        if (req.phone() != null) {
            u.setPhone(req.phone().isBlank() ? null : req.phone().trim());
        }
        if (req.interests() != null) {
            applyInterests(u, req.interests());
        }
        if (req.homeCity() != null) {
            u.setHomeCity(req.homeCity().isBlank() ? null : req.homeCity().trim());
        }
        if (req.defaultTravellers() != null) {
            u.setDefaultTravellers(req.defaultTravellers());
        }
        if (req.defaultBudget() != null) {
            u.setDefaultBudget(req.defaultBudget());
        }
        if (req.defaultDays() != null) {
            u.setDefaultDays(req.defaultDays());
        }
        u.setUpdatedAt(Instant.now());
        return UserResponse.of(users.save(u));
    }

    public void changePassword(String userId, ChangePasswordRequest req) {
        User u = require(userId);
        if (!encoder.matches(req.currentPassword(), u.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        u.setPasswordHash(encoder.encode(req.newPassword()));
        u.setUpdatedAt(Instant.now());
        users.save(u);
    }

    /* ---------------- admin ---------------- */

    public List<UserResponse> listAll() {
        return users.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(UserResponse::of)
                .toList();
    }

    public UserResponse adminUpdate(String userId, AdminUserUpdateRequest req) {
        User u = require(userId);
        if (req.role() != null) {
            String role = req.role().toUpperCase(Locale.ROOT);
            if (!ROLES.contains(role)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be USER or ADMIN");
            }
            u.setRole(role);
        }
        if (req.enabled() != null) {
            u.setEnabled(req.enabled());
        }
        if (req.loanEligible() != null) {
            u.setLoanEligible(req.loanEligible());
        }
        if (req.fullName() != null && !req.fullName().isBlank()) {
            u.setFullName(req.fullName().trim());
        }
        if (req.phone() != null) {
            u.setPhone(req.phone().isBlank() ? null : req.phone().trim());
        }
        u.setUpdatedAt(Instant.now());
        return UserResponse.of(users.save(u));
    }

    public void deleteUser(String userId) {
        require(userId);
        users.deleteById(userId);
    }

    public long countByRole(String role) {
        return users.findByRole(role).size();
    }

    /* ---------------- helpers ---------------- */

    public User require(String userId) {
        return users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void applyInterests(User u, List<String> interests) {
        if (interests == null) {
            return;
        }
        u.setInterests(interests.stream()
                .filter(i -> i != null && !i.isBlank())
                .map(i -> {
                    String trimmed = i.trim();
                    return KNOWN_INTERESTS.stream()
                            .filter(k -> k.equalsIgnoreCase(trimmed))
                            .findFirst()
                            .orElse(trimmed);
                })
                .distinct()
                .toList());
    }

    private static String normalise(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
