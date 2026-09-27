package com.hangova.user.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Reads the authenticated caller identity that the API gateway resolved from the
 * JWT and forwarded as internal HTTP headers.
 * <p>
 * The trust boundary is the gateway: only the gateway is exposed publicly, and
 * its IdentityHeadersFilter removes any client-supplied X-User-* headers before
 * injecting the verified ones.
 */
@Component
public class Caller {

    public static final String ADMIN = "ADMIN";

    /** @return the authenticated user id, or 401 when the gateway did not forward one. */
    public String id() {
        String v = header("X-User-Id");
        if (v == null || v.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Not authenticated - please sign in again");
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

    /**
     * HTTP headers are not servlet request attributes, so they must be read
     * with {@code getHeader} rather than {@code getAttribute}.
     */
    private String header(String name) {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            HttpServletRequest request = sra.getRequest();
            return request.getHeader(name);
        }
        return null;
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
