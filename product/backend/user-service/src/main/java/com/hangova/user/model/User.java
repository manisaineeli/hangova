package com.hangova.user.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * A registered traveller or an administrator.
 * <p>
 * The stored {@code preferences} and {@code travelProfile} are exactly what the
 * AI Trip Planning module (Module 2) reads to personalise itineraries.
 */
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    /** BCrypt hash - the raw password is never stored. */
    private String passwordHash;

    private String fullName;
    private String phone;
    private String role = "USER";

    /* ---- travel preferences, consumed by the AI planner ---- */
    private List<String> interests = new ArrayList<>();
    private String homeCity;
    private int defaultTravellers = 2;
    private int defaultBudget = 60000;
    private int defaultDays = 4;
    private boolean loanEligible;

    /* ---- admin bookkeeping ---- */
    private boolean enabled = true;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
    private Instant lastLoginAt;

    public User() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public List<String> getInterests() {
        return interests;
    }

    public void setInterests(List<String> interests) {
        this.interests = interests == null ? new ArrayList<>() : interests;
    }

    public String getHomeCity() {
        return homeCity;
    }

    public void setHomeCity(String homeCity) {
        this.homeCity = homeCity;
    }

    public int getDefaultTravellers() {
        return defaultTravellers;
    }

    public void setDefaultTravellers(int defaultTravellers) {
        this.defaultTravellers = defaultTravellers;
    }

    public int getDefaultBudget() {
        return defaultBudget;
    }

    public void setDefaultBudget(int defaultBudget) {
        this.defaultBudget = defaultBudget;
    }

    public int getDefaultDays() {
        return defaultDays;
    }

    public void setDefaultDays(int defaultDays) {
        this.defaultDays = defaultDays;
    }

    public boolean isLoanEligible() {
        return loanEligible;
    }

    public void setLoanEligible(boolean loanEligible) {
        this.loanEligible = loanEligible;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(Instant lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }
}
