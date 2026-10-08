package com.vehiclerental.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vehiclerental.service.AdminService;
import com.vehiclerental.service.BookingService;
import com.vehiclerental.service.CustomerService;
import com.vehiclerental.exception.AuthorizationException;
import com.vehiclerental.model.Booking;
import com.vehiclerental.model.Customer;
import com.vehiclerental.util.AdminEventBus;
import com.vehiclerental.util.AuthSessionManager;
import com.vehiclerental.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class AdminController implements HttpHandler {
    private final AdminService adminService = new AdminService();
    private final CustomerService customerService = new CustomerService();
    private final BookingService bookingService = new BookingService();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Pattern CUSTOMER_UPDATE_PATH = Pattern.compile("/api/admin/customers/([0-9]+)");
    private static final Pattern BOOKING_ACTION_PATH = Pattern.compile("/api/admin/bookings/([0-9]+)/(cancel|return)");

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        try {
            AuthSessionManager.requireAdmin(exchange);
            if ("GET".equalsIgnoreCase(method) && path.equals("/api/admin/events")) {
                handleDashboardEvents(exchange);
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.equals("/api/admin/dashboard")) {
                sendJson(exchange, 200, Map.of("success", true, "message", "Dashboard fetched", "data", adminService.getDashboard()));
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.equals("/api/admin/customers")) {
                sendJson(exchange, 200, Map.of("success", true, "message", "Customers fetched", "data", adminService.getAllCustomers().stream().map(this::customerResponse).toList()));
                return;
            }
            Matcher customerUpdate = CUSTOMER_UPDATE_PATH.matcher(path);
            if ("PUT".equalsIgnoreCase(method) && customerUpdate.matches()) {
                int customerId = Integer.parseInt(customerUpdate.group(1));
                Customer customer = objectMapper.convertValue(readBody(exchange), Customer.class);
                customer.setCustomerId(customerId);
                customerService.updateCustomer(customer);
                AdminEventBus.publishDashboardUpdate();
                sendJson(exchange, 200, Map.of("success", true, "message", "Customer updated successfully", "data", customerResponse(customerService.getCustomerById(customerId))));
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.equals("/api/admin/bookings")) {
                sendJson(exchange, 200, Map.of("success", true, "message", "Bookings fetched", "data", adminService.getAllBookings().stream().map(this::bookingResponse).toList()));
                return;
            }
            Matcher bookingAction = BOOKING_ACTION_PATH.matcher(path);
            if ("PUT".equalsIgnoreCase(method) && bookingAction.matches()) {
                int bookingId = Integer.parseInt(bookingAction.group(1));
                if ("cancel".equals(bookingAction.group(2))) {
                    bookingService.adminCancelBooking(bookingId);
                    AdminEventBus.publishDashboardUpdate();
                    sendJson(exchange, 200, Map.of("success", true, "message", "Booking cancelled successfully"));
                } else {
                    bookingService.adminReturnVehicle(bookingId);
                    AdminEventBus.publishDashboardUpdate();
                    sendJson(exchange, 200, Map.of("success", true, "message", "Vehicle marked as returned"));
                }
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.equals("/api/admin/revenue")) {
                sendJson(exchange, 200, Map.of("success", true, "message", "Revenue fetched", "data", Map.of("totalRevenue", adminService.getRevenue())));
                return;
            }
            sendJson(exchange, 404, Map.of("success", false, "message", "Admin endpoint not found"));
        } catch (AuthorizationException e) {
            sendJson(exchange, e.getStatusCode(), Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            sendJson(exchange, 400, Map.of("success", false, "message", e.getMessage() == null ? "Request failed" : e.getMessage()));
        }
    }

    private Map<String, Object> readBody(HttpExchange exchange) throws IOException {
        try (InputStream inputStream = exchange.getRequestBody()) {
            byte[] body = inputStream.readAllBytes();
            if (body.length == 0) {
                return Map.of();
            }
            return objectMapper.readValue(body, Map.class);
        }
    }

    private void handleDashboardEvents(HttpExchange exchange) throws IOException {
        BlockingQueue<String> events = AdminEventBus.subscribe();
        exchange.getResponseHeaders().set("Content-Type", "text/event-stream; charset=UTF-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-cache, no-transform");
        exchange.getResponseHeaders().set("X-Accel-Buffering", "no");
        exchange.sendResponseHeaders(200, 0);
        try (OutputStream output = exchange.getResponseBody()) {
            while (!Thread.currentThread().isInterrupted()) {
                String event;
                try {
                    event = events.poll(15, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
                if (AuthSessionManager.authenticate(exchange) == null) {
                    break;
                }
                String message = event == null
                        ? ": keep-alive\n\n"
                        : "event: dashboard-update\ndata: " + event + "\n\n";
                output.write(message.getBytes(StandardCharsets.UTF_8));
                output.flush();
            }
        } catch (IOException disconnected) {
            // The browser disconnected; remove its queue in the finally block.
        } finally {
            AdminEventBus.unsubscribe(events);
            exchange.close();
        }
    }

    private Map<String, Object> customerResponse(Customer customer) {
        Map<String, Object> response = new HashMap<>();
        response.put("customerId", customer.getCustomerId());
        response.put("name", customer.getName());
        response.put("email", customer.getEmail());
        response.put("phone", customer.getPhone());
        response.put("createdAt", customer.getCreatedAt() == null ? "" : customer.getCreatedAt());
        return response;
    }

    private Map<String, Object> bookingResponse(Booking booking) {
        Map<String, Object> response = new HashMap<>();
        response.put("bookingId", booking.getBookingId());
        response.put("customerId", booking.getCustomerId());
        response.put("vehicleId", booking.getVehicleId());
        response.put("startDate", booking.getStartDate().toString());
        response.put("endDate", booking.getEndDate().toString());
        response.put("numberOfDays", booking.getNumberOfDays());
        response.put("pricePerDay", booking.getPricePerDay());
        response.put("totalAmount", booking.getTotalAmount());
        response.put("bookingStatus", booking.getBookingStatus());
        response.put("createdAt", booking.getCreatedAt());
        return response;
    }

    private void sendJson(HttpExchange exchange, int status, Map<String, Object> payload) throws IOException {
        byte[] response = JsonUtil.toJson(payload).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, response.length);
        exchange.getResponseBody().write(response);
        exchange.getResponseBody().close();
    }
}
