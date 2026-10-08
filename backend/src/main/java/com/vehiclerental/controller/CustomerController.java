package com.vehiclerental.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vehiclerental.exception.AuthorizationException;
import com.vehiclerental.model.Customer;
import com.vehiclerental.service.CustomerService;
import com.vehiclerental.util.AdminEventBus;
import com.vehiclerental.util.AuthSessionManager;
import com.vehiclerental.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class CustomerController implements HttpHandler {
    private final CustomerService customerService = new CustomerService();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        try {
            if ("GET".equalsIgnoreCase(method) && path.equals("/api/customers")) {
                AuthSessionManager.requireAdmin(exchange);
                sendJson(exchange, 200, Map.of("success", true, "message", "Customers retrieved", "data", customerService.getAllCustomers().stream().map(this::customerResponse).toList()));
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.matches("/api/customers/[0-9]+")) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                AuthSessionManager.requireCustomerOrAdmin(exchange, id);
                sendJson(exchange, 200, Map.of("success", true, "message", "Customer retrieved", "data", customerResponse(customerService.getCustomerById(id))));
                return;
            }
            if ("PUT".equalsIgnoreCase(method) && path.matches("/api/customers/[0-9]+")) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                AuthSessionManager.Principal principal = AuthSessionManager.requireCustomer(exchange);
                if (principal.userId() != id) {
                    throw new AuthorizationException(403, "You can only update your own profile");
                }
                Map<String, Object> payload = readBody(exchange);
                Customer customer = objectMapper.convertValue(payload, Customer.class);
                customer.setCustomerId(id);
                customerService.updateCustomer(customer);
                AdminEventBus.publishDashboardUpdate();
                sendJson(exchange, 200, Map.of("success", true, "message", "Profile updated successfully", "data", customerResponse(customerService.getCustomerById(id))));
                return;
            }
            sendJson(exchange, 404, Map.of("success", false, "message", "Customer endpoint not found"));
        } catch (AuthorizationException e) {
            sendJson(exchange, e.getStatusCode(), Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            sendJson(exchange, 400, Map.of("success", false, "message", e.getMessage() == null ? "Request failed" : e.getMessage()));
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
        return Map.of(
                "customerId", customer.getCustomerId(),
                "name", customer.getName(),
                "email", customer.getEmail(),
                "phone", customer.getPhone(),
                "createdAt", customer.getCreatedAt() == null ? "" : customer.getCreatedAt()
        );
    }

    private void sendJson(HttpExchange exchange, int status, Map<String, Object> payload) throws IOException {
        byte[] response = JsonUtil.toJson(payload).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, response.length);
        exchange.getResponseBody().write(response);
        exchange.getResponseBody().close();
    }
}
