package com.vehiclerental.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vehiclerental.exception.AuthorizationException;
import com.vehiclerental.model.Booking;
import com.vehiclerental.service.BookingService;
import com.vehiclerental.util.AdminEventBus;
import com.vehiclerental.util.AuthSessionManager;
import com.vehiclerental.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Map;

public class BookingController implements HttpHandler {
    private final BookingService bookingService = new BookingService();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        try {
            if ("POST".equalsIgnoreCase(method) && path.equals("/api/bookings")) {
                AuthSessionManager.Principal principal = AuthSessionManager.requireCustomer(exchange);
                Map<String, Object> payload = readBody(exchange);
                int vehicleId = Integer.parseInt(String.valueOf(payload.getOrDefault("vehicleId", 0)));
                LocalDate startDate = LocalDate.parse(String.valueOf(payload.getOrDefault("startDate", "")));
                LocalDate endDate = LocalDate.parse(String.valueOf(payload.getOrDefault("endDate", "")));
                int bookingId = bookingService.createBooking(principal.userId(), vehicleId, startDate, endDate);
                Booking booking = bookingService.getBookingById(bookingId);
                AdminEventBus.publishDashboardUpdate();
                sendJson(exchange, 201, Map.of("success", true, "message", "Booking created successfully", "data", bookingResponse(booking)));
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.matches("/api/bookings/[0-9]+")) {
                AuthSessionManager.Principal principal = AuthSessionManager.requireAuthenticated(exchange);
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                Booking booking = bookingService.getBookingById(id);
                if (!"admin".equals(principal.role()) && booking.getCustomerId() != principal.userId()) {
                    throw new AuthorizationException(403, "You do not have access to this booking");
                }
                sendJson(exchange, 200, Map.of("success", true, "message", "Booking retrieved", "data", bookingResponse(booking)));
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/bookings/customer/")) {
                int customerId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                AuthSessionManager.requireCustomerOrAdmin(exchange, customerId);
                sendJson(exchange, 200, Map.of("success", true, "message", "Customer bookings retrieved", "data", bookingService.getCustomerBookings(customerId).stream().map(this::bookingResponse).toList()));
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.equals("/api/bookings")) {
                AuthSessionManager.requireAdmin(exchange);
                sendJson(exchange, 200, Map.of("success", true, "message", "All bookings retrieved", "data", bookingService.getAllBookings().stream().map(this::bookingResponse).toList()));
                return;
            }
            if ("PUT".equalsIgnoreCase(method) && path.matches("/api/bookings/[0-9]+/cancel")) {
                AuthSessionManager.Principal principal = AuthSessionManager.requireCustomer(exchange);
                String[] segments = path.split("/");
                int bookingId = Integer.parseInt(segments[segments.length - 2]);
                bookingService.cancelBooking(bookingId, principal.userId());
                AdminEventBus.publishDashboardUpdate();
                sendJson(exchange, 200, Map.of("success", true, "message", "Booking cancelled successfully. Any completed demo payment has been marked as refunded."));
                return;
            }
            if ("PUT".equalsIgnoreCase(method) && path.matches("/api/bookings/[0-9]+/return")) {
                AuthSessionManager.Principal principal = AuthSessionManager.requireCustomer(exchange);
                String[] segments = path.split("/");
                int bookingId = Integer.parseInt(segments[segments.length - 2]);
                bookingService.returnVehicle(bookingId, principal.userId());
                AdminEventBus.publishDashboardUpdate();
                sendJson(exchange, 200, Map.of("success", true, "message", "Vehicle returned successfully"));
                return;
            }
            sendJson(exchange, 404, Map.of("success", false, "message", "Booking endpoint not found"));
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

    private Map<String, Object> bookingResponse(Booking booking) {
        return Map.of(
                "bookingId", booking.getBookingId(),
                "customerId", booking.getCustomerId(),
                "vehicleId", booking.getVehicleId(),
                "startDate", booking.getStartDate().toString(),
                "endDate", booking.getEndDate().toString(),
                "numberOfDays", booking.getNumberOfDays(),
                "pricePerDay", booking.getPricePerDay(),
                "totalAmount", booking.getTotalAmount(),
                "bookingStatus", booking.getBookingStatus(),
                "createdAt", booking.getCreatedAt()
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
