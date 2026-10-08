package com.vehiclerental.util;

import com.sun.net.httpserver.HttpExchange;
import com.vehiclerental.exception.AuthorizationException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class AuthSessionManager {
    private static final long SESSION_LIFETIME_SECONDS = 12 * 60 * 60;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Map<String, Session> SESSIONS = new ConcurrentHashMap<>();

    private AuthSessionManager() {}

    public static String createSession(int userId, String role) {
        Instant now = Instant.now();
        SESSIONS.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
        byte[] tokenBytes = new byte[32];
        SECURE_RANDOM.nextBytes(tokenBytes);
        String token = HexFormat.of().formatHex(tokenBytes);
        SESSIONS.put(token, new Session(userId, role, now.plusSeconds(SESSION_LIFETIME_SECONDS)));
        return token;
    }

    public static Principal authenticate(HttpExchange exchange) {
        String authorization = exchange.getRequestHeaders().getFirst("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        String token = authorization.substring("Bearer ".length()).trim();
        Session session = SESSIONS.get(token);
        if (session == null) {
            return null;
        }
        if (!session.expiresAt().isAfter(Instant.now())) {
            SESSIONS.remove(token, session);
            return null;
        }
        return new Principal(session.userId(), session.role());
    }

    public static void revoke(HttpExchange exchange) {
        String authorization = exchange.getRequestHeaders().getFirst("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")) {
            SESSIONS.remove(authorization.substring("Bearer ".length()).trim());
        }
    }

    public static Principal requireCustomer(HttpExchange exchange) {
        Principal principal = requireAuthenticated(exchange);
        if (!"customer".equals(principal.role())) {
            throw new AuthorizationException(403, "Customer access required");
        }
        return principal;
    }

    public static Principal requireAdmin(HttpExchange exchange) {
        Principal principal = requireAuthenticated(exchange);
        if (!"admin".equals(principal.role())) {
            throw new AuthorizationException(403, "Admin access required");
        }
        return principal;
    }

    public static Principal requireCustomerOrAdmin(HttpExchange exchange, int customerId) {
        Principal principal = requireAuthenticated(exchange);
        if (!"admin".equals(principal.role())
                && (!"customer".equals(principal.role()) || principal.userId() != customerId)) {
            throw new AuthorizationException(403, "You do not have access to this customer's data");
        }
        return principal;
    }

    public static Principal requireAuthenticated(HttpExchange exchange) {
        Principal principal = authenticate(exchange);
        if (principal == null) {
            throw new AuthorizationException(401, "A valid login session is required");
        }
        return principal;
    }

    private record Session(int userId, String role, Instant expiresAt) {}

    public record Principal(int userId, String role) {}
}
