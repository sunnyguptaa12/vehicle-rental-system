package com.vehiclerental.util;

import com.sun.net.httpserver.Filter;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public class CorsFilter extends Filter {
    private static final Set<String> ALLOWED_ORIGINS = Arrays.stream(
                    System.getenv().getOrDefault("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .collect(Collectors.toUnmodifiableSet());

    @Override
    public void doFilter(HttpExchange exchange, Chain chain) throws IOException {
        String origin = exchange.getRequestHeaders().getFirst("Origin");
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", origin);
            exchange.getResponseHeaders().set("Vary", "Origin");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Authorization, Content-Type");
            exchange.getResponseHeaders().set("Access-Control-Max-Age", "600");
        }

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            if (origin == null || !ALLOWED_ORIGINS.contains(origin)) {
                exchange.sendResponseHeaders(403, -1);
            } else {
                exchange.sendResponseHeaders(204, -1);
            }
            exchange.close();
            return;
        }
        chain.doFilter(exchange);
    }

    @Override
    public String description() {
        return "Restricts API access to configured browser origins";
    }
}
