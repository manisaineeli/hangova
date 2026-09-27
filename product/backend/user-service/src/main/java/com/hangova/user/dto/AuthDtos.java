package com.hangova.user.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request / response payloads for the User &amp; Admin module. */
public final class AuthDtos {

    private AuthDtos() {
    }

    /* ---------- requests ---------- */

    public record RegisterRequest(
            @NotBlank(message = "Full name is required")
            @Size(max = 120, message = "Name is too long")
            String fullName,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 6, message = "Password must be at least 6 characters")
            String password,

            @Size(max = 20)
            String phone,

            List<String> interests,
            String homeCity,
            @Min(1) @Max(30) Integer defaultTravellers,
            @Min(0) Integer defaultBudget,
            @Min(1) @Max(60) Integer defaultDays) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required") String email,
            @NotBlank(message = "Password is required") String password) {
    }

    /** Profile update - every field optional, only what is sent gets changed. */
    public record ProfileUpdateRequest(
            @Size(max = 120) String fullName,
            @Size(max = 20) String phone,
            List<String> interests,
            String homeCity,
            @Min(1) @Max(30) Integer defaultTravellers,
            @Min(0) Integer defaultBudget,
            @Min(1) @Max(60) Integer defaultDays) {
    }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 6, message = "New password must be at least 6 characters") String newPassword) {
    }

    public record AdminUserUpdateRequest(
            String role,
            Boolean enabled,
            Boolean loanEligible,
            String fullName,
            String phone) {
    }

    /* ---------- responses ---------- */

    public record UserResponse(
            String id,
            String email,
            String fullName,
            String phone,
            String role,
            boolean enabled,
            boolean loanEligible,
            List<String> interests,
            String homeCity,
            int defaultTravellers,
            int defaultBudget,
            int defaultDays,
            Instant createdAt,
            Instant lastLoginAt) {

        public static UserResponse of(com.hangova.user.model.User u) {
            return new UserResponse(
                    u.getId(), u.getEmail(), u.getFullName(), u.getPhone(), u.getRole(),
                    u.isEnabled(), u.isLoanEligible(), u.getInterests(), u.getHomeCity(),
                    u.getDefaultTravellers(), u.getDefaultBudget(), u.getDefaultDays(),
                    u.getCreatedAt(), u.getLastLoginAt());
        }
    }

    public record AuthResponse(String token, String tokenType, long expiresIn, UserResponse user) {
    }
}
