package com.hangova.trip.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Reads the caller identity forwarded by the API gateway after it validated the
 * JWT. The gateway is the only public port and strips client-supplied X-User-*
 * headers, so these values are trustworthy.
 */
@Component
public class Caller {

    public static final String ADMIN = "ADMIN";

    public String id() {
        String v = header("X-User-Id");
        if (v == null || v.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated - please sign in again");
        }
        return v;
    }

    public String idOrNull() {
        return header("X-User-Id");
    }

    public String email() {
        return nullToEmpty(header("X-User-Email"));
    }

    public String name() {
        return nullToEmpty(header("X-User-Name"));
    }

    public String role() {
        String r = header("X-User-Role");
        return (r == null || r.isBlank()) ? "USER" : r;
    }

    public boolean isAdmin() {
        return ADMIN.equalsIgnoreCase(role());
    }

    public void requireAdmin() {
        if (!isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrator access required");
        }
    }

    private String header(String name) {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            return sra.getRequest().getHeader(name);
        }
        return null;
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
