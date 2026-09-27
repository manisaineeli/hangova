package com.hangova.trip.model;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * A curated destination with the local knowledge the AI planner reasons over:
 * highlights, activities and realistic cost ranges.
 * <p>
 * Seeded from the built-in catalogue and editable by the administrator
 * (Module 4 - "manage users and destinations").
 */
@Document(collection = "destinations")
public class Destination {

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;

    private String name;
    private String state;
    private List<String> tags = new ArrayList<>();
    private double latitude;
    private double longitude;
    private String summary;

    /** Typical cost per person per day, used to sanity-check the user's budget. */
    private int avgDailyCostPerPerson;

    /** Comfortable trip length in days. */
    private int idealDays;

    private List<String> bestMonths = new ArrayList<>();
    private String climate;
    private String bestTimeToVisit;
    private String howToReach;

    private List<Highlight> highlights = new ArrayList<>();
    private List<Activity> activities = new ArrayList<>();
    private boolean active = true;

    public record Highlight(
            String name,
            String category,
            String area,
            int approxEntryCost,
            String bestTime,
            int suggestedHours,
            String description) {
    }

    public record Activity(
            String name,
            String category,
            int approxCost,
            String duration,
            String description) {
    }

    /* ---------------- accessors ---------------- */

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags == null ? new ArrayList<>() : tags;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public int getAvgDailyCostPerPerson() {
        return avgDailyCostPerPerson;
    }

    public void setAvgDailyCostPerPerson(int avgDailyCostPerPerson) {
        this.avgDailyCostPerPerson = avgDailyCostPerPerson;
    }

    public int getIdealDays() {
        return idealDays;
    }

    public void setIdealDays(int idealDays) {
        this.idealDays = idealDays;
    }

    public List<String> getBestMonths() {
        return bestMonths;
    }

    public void setBestMonths(List<String> bestMonths) {
        this.bestMonths = bestMonths == null ? new ArrayList<>() : bestMonths;
    }

    public String getClimate() {
        return climate;
    }

    public void setClimate(String climate) {
        this.climate = climate;
    }

    public String getBestTimeToVisit() {
        return bestTimeToVisit;
    }

    public void setBestTimeToVisit(String bestTimeToVisit) {
        this.bestTimeToVisit = bestTimeToVisit;
    }

    public String getHowToReach() {
        return howToReach;
    }

    public void setHowToReach(String howToReach) {
        this.howToReach = howToReach;
    }

    public List<Highlight> getHighlights() {
        return highlights;
    }

    public void setHighlights(List<Highlight> highlights) {
        this.highlights = highlights == null ? new ArrayList<>() : highlights;
    }

    public List<Activity> getActivities() {
        return activities;
    }

    public void setActivities(List<Activity> activities) {
        this.activities = activities == null ? new ArrayList<>() : activities;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
