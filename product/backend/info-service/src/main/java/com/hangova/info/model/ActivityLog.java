package com.hangova.info.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * An audit trail of significant system activity, giving the administrator the
 * "Monitor bookings" and "Summarised Trip Data" views of Module 4.
 */
@Document(collection = "activity_log")
public class ActivityLog {

    public static final String BOOKING = "BOOKING";
    public static final String TRIP = "TRIP";
    public static final String LOAN = "LOAN";
    public static final String USER = "USER";
    public static final String EXPENSE = "EXPENSE";

    @Id
    private String id;

    private String category;
    private String action;
    private String actorId;
    private String actorName;
    private String actorRole;
    private String subjectId;
    private String subjectLabel;
    private String detail;
    private int amount;

    private Map<String, Object> meta = new LinkedHashMap<>();

    /**
     * No TTL index here on purpose: the administrator's activity log has to
     * persist. Retention is handled by an explicit admin purge endpoint.
     */
    private Instant createdAt = Instant.now();

    public ActivityLog() {
    }

    public static ActivityLog of(String category, String action, String actorId, String actorName,
                                  String actorRole, String subjectId, String subjectLabel,
                                  String detail, int amount) {
        ActivityLog l = new ActivityLog();
        l.category = category;
        l.action = action;
        l.actorId = actorId;
        l.actorName = actorName;
        l.actorRole = actorRole;
        l.subjectId = subjectId;
        l.subjectLabel = subjectLabel;
        l.detail = detail;
        l.amount = amount;
        return l;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(String actorId) {
        this.actorId = actorId;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(String subjectId) {
        this.subjectId = subjectId;
    }

    public String getSubjectLabel() {
        return subjectLabel;
    }

    public void setSubjectLabel(String subjectLabel) {
        this.subjectLabel = subjectLabel;
    }

    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    public int getAmount() {
        return amount;
    }

    public void setAmount(int amount) {
        this.amount = amount;
    }

    public Map<String, Object> getMeta() {
        return meta;
    }

    public void setMeta(Map<String, Object> meta) {
        this.meta = meta == null ? new LinkedHashMap<>() : meta;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    /* keep the unused import honest */
    public List<String> categories() {
        return new ArrayList<>(List.of(BOOKING, TRIP, LOAN, USER, EXPENSE));
    }
}
