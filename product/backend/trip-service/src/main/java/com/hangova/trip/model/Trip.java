package com.hangova.trip.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * A generated day-wise itinerary. This is the central artefact of Module 2 and
 * is later edited, costed and summarised by Module 4.
 */
@Document(collection = "trips")
@CompoundIndex(name = "user_created_idx", def = "{'userId': 1, 'createdAt': -1}")
public class Trip {

    @Id
    private String id;

    private String userId;
    private String ownerName;
    private String title;

    /* ---- planning inputs ---- */
    private String destination;
    private String destinationState;
    private Double latitude;
    private Double longitude;
    private int days;
    private int travellers;
    private int budget;
    private List<String> interests = new ArrayList<>();
    private LocalDate startDate;
    private String travelStyle = "BALANCED";

    /* ---- generated output ---- */
    private List<DayPlan> itinerary = new ArrayList<>();
    private BudgetBreakdown budgetBreakdown;
    private List<String> recommendations = new ArrayList<>();
    private List<PlaceSuggestion> places = new ArrayList<>();
    private List<ActivitySuggestion> activities = new ArrayList<>();
    private List<String> budgetTips = new ArrayList<>();
    private String weatherSummary;
    private boolean liveWeather;
    private String generatedBy = "offline";
    private String aiNote;

    /* ---- lifecycle ---- */
    private String status = "SAVED";
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    /* ---------------- nested value types ---------------- */

    public record Activity(
            String time,
            String title,
            String description,
            String category,
            String place,
            int cost,
            int durationMinutes) {
    }

    public record DayPlan(
            int day,
            String date,
            String theme,
            String summary,
            List<Activity> activities,
            int dayCost,
            String weather,
            Double tempMin,
            Double tempMax) {
    }

    public record BudgetBreakdown(
            int stay,
            int transport,
            int food,
            int activities,
            int miscellaneous,
            int total,
            int perPerson,
            int budgetGiven,
            int variance,
            boolean withinBudget,
            String verdict) {
    }

    public record PlaceSuggestion(
            String name,
            String category,
            String area,
            int approxCost,
            String bestTime,
            String whyRecommended,
            String interest) {
    }

    public record ActivitySuggestion(
            String name,
            String category,
            int approxCost,
            String duration,
            String interest,
            String description) {
    }

    /* ---------------- accessors ---------------- */

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getDestinationState() {
        return destinationState;
    }

    public void setDestinationState(String destinationState) {
        this.destinationState = destinationState;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public int getDays() {
        return days;
    }

    public void setDays(int days) {
        this.days = days;
    }

    public int getTravellers() {
        return travellers;
    }

    public void setTravellers(int travellers) {
        this.travellers = travellers;
    }

    public int getBudget() {
        return budget;
    }

    public void setBudget(int budget) {
        this.budget = budget;
    }

    public List<String> getInterests() {
        return interests;
    }

    public void setInterests(List<String> interests) {
        this.interests = interests == null ? new ArrayList<>() : interests;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public String getTravelStyle() {
        return travelStyle;
    }

    public void setTravelStyle(String travelStyle) {
        this.travelStyle = travelStyle;
    }

    public List<DayPlan> getItinerary() {
        return itinerary;
    }

    public void setItinerary(List<DayPlan> itinerary) {
        this.itinerary = itinerary == null ? new ArrayList<>() : itinerary;
    }

    public BudgetBreakdown getBudgetBreakdown() {
        return budgetBreakdown;
    }

    public void setBudgetBreakdown(BudgetBreakdown budgetBreakdown) {
        this.budgetBreakdown = budgetBreakdown;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations == null ? new ArrayList<>() : recommendations;
    }

    public List<PlaceSuggestion> getPlaces() {
        return places;
    }

    public void setPlaces(List<PlaceSuggestion> places) {
        this.places = places == null ? new ArrayList<>() : places;
    }

    public List<ActivitySuggestion> getActivities() {
        return activities;
    }

    public void setActivities(List<ActivitySuggestion> activities) {
        this.activities = activities == null ? new ArrayList<>() : activities;
    }

    public List<String> getBudgetTips() {
        return budgetTips;
    }

    public void setBudgetTips(List<String> budgetTips) {
        this.budgetTips = budgetTips == null ? new ArrayList<>() : budgetTips;
    }

    public String getWeatherSummary() {
        return weatherSummary;
    }

    public void setWeatherSummary(String weatherSummary) {
        this.weatherSummary = weatherSummary;
    }

    public boolean isLiveWeather() {
        return liveWeather;
    }

    public void setLiveWeather(boolean liveWeather) {
        this.liveWeather = liveWeather;
    }

    public String getGeneratedBy() {
        return generatedBy;
    }

    public void setGeneratedBy(String generatedBy) {
        this.generatedBy = generatedBy;
    }

    public String getAiNote() {
        return aiNote;
    }

    public void setAiNote(String aiNote) {
        this.aiNote = aiNote;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
}
