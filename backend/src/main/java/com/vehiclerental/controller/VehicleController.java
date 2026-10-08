package com.vehiclerental.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vehiclerental.exception.AuthorizationException;
import com.vehiclerental.model.Bike;
import com.vehiclerental.model.Car;
import com.vehiclerental.model.Scooter;
import com.vehiclerental.model.SUV;
import com.vehiclerental.model.Vehicle;
import com.vehiclerental.service.VehicleService;
import com.vehiclerental.util.AuthSessionManager;
import com.vehiclerental.util.AdminEventBus;
import com.vehiclerental.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

public class VehicleController implements HttpHandler {
    private final VehicleService vehicleService = new VehicleService();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        try {
            if ("GET".equalsIgnoreCase(method) && path.equals("/api/vehicles")) {
                sendJson(exchange, 200, Map.of("success", true, "message", "Vehicles retrieved", "data", vehicleService.getAllVehicles()));
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/vehicles/available")) {
                sendJson(exchange, 200, Map.of("success", true, "message", "Available vehicles retrieved", "data", vehicleService.getAvailableVehicles()));
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/vehicles/search")) {
                String keyword = exchange.getRequestURI().getQuery() == null ? "" : exchange.getRequestURI().getQuery().replace("q=", "");
                sendJson(exchange, 200, Map.of("success", true, "message", "Search results", "data", vehicleService.searchVehicles(keyword)));
                return;
            }
            if ("POST".equalsIgnoreCase(method) && path.equals("/api/vehicles")) {
                AuthSessionManager.requireAdmin(exchange);
                Map<String, Object> payload = readBody(exchange);
                Vehicle vehicle = createVehicleFromPayload(payload);
                Vehicle saved = vehicleService.addVehicle(vehicle);
                AdminEventBus.publishDashboardUpdate();
                sendJson(exchange, 201, Map.of("success", true, "message", "Vehicle added successfully", "data", saved));
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.matches("/api/vehicles/[0-9]+")) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                sendJson(exchange, 200, Map.of("success", true, "message", "Vehicle found", "data", vehicleService.getVehicleById(id)));
                return;
            }
            if ("PUT".equalsIgnoreCase(method) && path.matches("/api/vehicles/[0-9]+")) {
                AuthSessionManager.requireAdmin(exchange);
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                Map<String, Object> payload = readBody(exchange);
                Vehicle vehicle = createVehicleFromPayload(payload);
                vehicle.setVehicleId(id);
                boolean updated = vehicleService.updateVehicle(vehicle);
                if (updated) {
                    AdminEventBus.publishDashboardUpdate();
                }
                sendJson(exchange, 200, Map.of("success", updated, "message", updated ? "Vehicle updated successfully" : "Vehicle update failed", "data", vehicle));
                return;
            }
            if ("DELETE".equalsIgnoreCase(method) && path.matches("/api/vehicles/[0-9]+")) {
                AuthSessionManager.requireAdmin(exchange);
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                boolean deleted = vehicleService.deleteVehicle(id);
                if (deleted) {
                    AdminEventBus.publishDashboardUpdate();
                }
                sendJson(exchange, 200, Map.of("success", deleted, "message", deleted ? "Vehicle deleted successfully" : "Vehicle not found"));
                return;
            }

            sendJson(exchange, 404, Map.of("success", false, "message", "Vehicle endpoint not found"));
        } catch (AuthorizationException e) {
            sendJson(exchange, e.getStatusCode(), Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            sendJson(exchange, 400, Map.of("success", false, "message", e.getMessage() == null ? "Request failed" : e.getMessage()));
        }
    }

    private Vehicle createVehicleFromPayload(Map<String, Object> payload) {
        String vehicleType = String.valueOf(payload.getOrDefault("vehicleType", payload.getOrDefault("vehicle_type", "Car"))).trim();
        Vehicle vehicle;
        if ("Bike".equalsIgnoreCase(vehicleType)) {
            vehicle = new Bike();
        } else if ("Scooter".equalsIgnoreCase(vehicleType)) {
            vehicle = new Scooter();
        } else if ("SUV".equalsIgnoreCase(vehicleType)) {
            vehicle = new SUV();
        } else if ("Car".equalsIgnoreCase(vehicleType)) {
            vehicle = new Car();
        } else {
            throw new IllegalArgumentException("Vehicle type must be Car, SUV, Bike, or Scooter");
        }
        vehicle.setVehicleTypeValue(vehicleType);
        vehicle.setBrand(stringValue(payload, "brand"));
        vehicle.setModel(stringValue(payload, "model"));
        vehicle.setRegistrationNumber(stringValue(payload, "registrationNumber", "registration_number"));
        vehicle.setDescription(stringValue(payload, "description"));
        vehicle.setImageUrl(stringValue(payload, "imageUrl", "image_url"));
        vehicle.setPricePerDay(doubleValue(payload, "pricePerDay", "price_per_day"));
        vehicle.setStatus(stringValue(payload, "status"));
        return vehicle;
    }

    private String stringValue(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value != null) {
                return String.valueOf(value).trim();
            }
        }
        return "";
    }

    private double doubleValue(Map<String, Object> payload, String... keys) {
        String value = stringValue(payload, keys);
        if (value.isBlank()) {
            return 0;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Price per day must be a valid number");
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

    private void sendJson(HttpExchange exchange, int status, Map<String, Object> payload) throws IOException {
        byte[] response = JsonUtil.toJson(payload).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, response.length);
        exchange.getResponseBody().write(response);
        exchange.getResponseBody().close();
    }
}
