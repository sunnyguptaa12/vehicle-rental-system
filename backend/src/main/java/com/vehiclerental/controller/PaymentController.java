package com.vehiclerental.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vehiclerental.exception.AuthorizationException;
import com.vehiclerental.model.Booking;
import com.vehiclerental.model.Payment;
import com.vehiclerental.service.BookingService;
import com.vehiclerental.service.PaymentService;
import com.vehiclerental.util.AdminEventBus;
import com.vehiclerental.util.AuthSessionManager;
import com.vehiclerental.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class PaymentController implements HttpHandler {
    private final PaymentService paymentService = new PaymentService();
    private final BookingService bookingService = new BookingService();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        try {
            if ("POST".equalsIgnoreCase(method) && path.equals("/api/payments")) {
                AuthSessionManager.Principal principal = AuthSessionManager.requireCustomer(exchange);
                Map<String, Object> payload = readBody(exchange);
                Payment payment = objectMapper.convertValue(payload, Payment.class);
                Booking booking = bookingService.getBookingById(payment.getBookingId());
                if (booking.getCustomerId() != principal.userId()) {
                    throw new AuthorizationException(403, "You can only pay for your own booking");
                }
                int paymentId = paymentService.createPayment(payment);
                Payment savedPayment = paymentService.getPaymentByBookingId(payment.getBookingId());
                AdminEventBus.publishDashboardUpdate();
                sendJson(exchange, 201, Map.of("success", true, "message", "Payment successful", "data", Map.of(
                        "paymentId", paymentId,
                        "amount", savedPayment.getAmount(),
                        "paymentStatus", savedPayment.getPaymentStatus()
                )));
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.matches("/api/payments/[0-9]+")) {
                AuthSessionManager.Principal principal = AuthSessionManager.requireAuthenticated(exchange);
                int bookingId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                Booking booking = bookingService.getBookingById(bookingId);
                if (!"admin".equals(principal.role()) && booking.getCustomerId() != principal.userId()) {
                    throw new AuthorizationException(403, "You do not have access to this payment");
                }
                sendJson(exchange, 200, Map.of("success", true, "message", "Payment found", "data", paymentResponse(paymentService.getPaymentByBookingId(bookingId))));
                return;
            }
            if ("GET".equalsIgnoreCase(method) && path.equals("/api/payments")) {
                AuthSessionManager.requireAdmin(exchange);
                sendJson(exchange, 200, Map.of("success", true, "message", "All payments retrieved", "data", paymentService.getAllPayments().stream().map(this::paymentResponse).toList()));
                return;
            }
            sendJson(exchange, 404, Map.of("success", false, "message", "Payment endpoint not found"));
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

    private Map<String, Object> paymentResponse(Payment payment) {
        return Map.of(
                "paymentId", payment.getPaymentId(),
                "bookingId", payment.getBookingId(),
                "amount", payment.getAmount(),
                "paymentMethod", payment.getPaymentMethod(),
                "paymentStatus", payment.getPaymentStatus(),
                "paymentDate", payment.getPaymentDate() == null ? "" : payment.getPaymentDate().toString()
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
