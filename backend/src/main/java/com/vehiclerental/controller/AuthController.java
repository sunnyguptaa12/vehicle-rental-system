package com.vehiclerental.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vehiclerental.exception.AuthenticationException;
import com.vehiclerental.model.Admin;
import com.vehiclerental.model.Customer;
import com.vehiclerental.service.AuthService;
import com.vehiclerental.util.AdminEventBus;
import com.vehiclerental.util.AuthSessionManager;
import com.vehiclerental.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class AuthController implements HttpHandler {
    private final AuthService authService = new AuthService();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        if ("POST".equalsIgnoreCase(method) && path.endsWith("/register")) {
            handleRegister(exchange);
            return;
        }
        if ("POST".equalsIgnoreCase(method) && path.endsWith("/login")) {
            handleLogin(exchange);
            return;
        }
        if ("POST".equalsIgnoreCase(method) && path.endsWith("/admin-login")) {
            handleAdminLogin(exchange);
            return;
        }
        if ("POST".equalsIgnoreCase(method) && path.endsWith("/logout")) {
            AuthSessionManager.revoke(exchange);
            sendJson(exchange, 200, Map.of("success", true, "message", "Logged out successfully"));
            return;
        }

        sendJson(exchange, 404, Map.of("success", false, "message", "Endpoint not found"));
    }

    private void handleRegister(HttpExchange exchange) throws IOException {
        try {
            Map<String, Object> payload = readBody(exchange);
            Customer customer = objectMapper.convertValue(payload, Customer.class);
            Customer saved = authService.registerCustomer(customer);
            AdminEventBus.publishDashboardUpdate();
            sendJson(exchange, 201, Map.of("success", true, "message", "Customer registered successfully", "data", customerResponse(saved)));
        } catch (Exception e) {
            sendJson(exchange, 400, Map.of("success", false, "message", e.getMessage()));
        }
    }

    private void handleLogin(HttpExchange exchange) throws IOException {
        try {
            Map<String, Object> payload = readBody(exchange);
            String email = String.valueOf(payload.getOrDefault("email", ""));
            String password = String.valueOf(payload.getOrDefault("password", ""));
            Customer customer = authService.loginCustomer(email, password);
            Map<String, Object> response = customerResponse(customer);
            response.put("token", AuthSessionManager.createSession(customer.getCustomerId(), "customer"));
            sendJson(exchange, 200, Map.of("success", true, "message", "Login successful", "data", response));
        } catch (AuthenticationException e) {
            sendJson(exchange, 401, Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            sendJson(exchange, 400, Map.of("success", false, "message", e.getMessage()));
        }
    }

    private void handleAdminLogin(HttpExchange exchange) throws IOException {
        try {
            Map<String, Object> payload = readBody(exchange);
            String username = String.valueOf(payload.getOrDefault("username", ""));
            String password = String.valueOf(payload.getOrDefault("password", ""));
            Admin admin = authService.adminLogin(username, password);
            Map<String, Object> response = new java.util.HashMap<>(Map.of(
                    "adminId", admin.getAdminId(),
                    "username", admin.getUsername(),
                    "createdAt", admin.getCreatedAt()
            ));
            response.put("token", AuthSessionManager.createSession(admin.getAdminId(), "admin"));
            sendJson(exchange, 200, Map.of("success", true, "message", "Admin login successful", "data", response));
        } catch (AuthenticationException e) {
            sendJson(exchange, 401, Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            sendJson(exchange, 400, Map.of("success", false, "message", e.getMessage()));
        }
    }

    private Map<String, Object> readBody(HttpExchange exchange) throws IOException {
        InputStream inputStream = exchange.getRequestBody();
        String body = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        if (body == null || body.isBlank()) {
            return Map.of();
        }
        return objectMapper.readValue(body, Map.class);
    }

    private Map<String, Object> customerResponse(Customer customer) {
        return new java.util.HashMap<>(Map.of(
                "customerId", customer.getCustomerId(),
                "name", customer.getName(),
                "email", customer.getEmail(),
                "phone", customer.getPhone(),
                "createdAt", customer.getCreatedAt() == null ? "" : customer.getCreatedAt()
        ));
    }

    private void sendJson(HttpExchange exchange, int status, Map<String, Object> payload) throws IOException {
        byte[] response = JsonUtil.toJson(payload).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, response.length);
        exchange.getResponseBody().write(response);
        exchange.getResponseBody().close();
    }
}
