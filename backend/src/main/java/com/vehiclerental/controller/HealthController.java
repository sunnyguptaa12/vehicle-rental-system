package com.vehiclerental.controller;

import com.vehiclerental.util.DBConnection;
import com.vehiclerental.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.Map;

public class HealthController implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        int status = 200;
        Map<String, Object> response;
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            status = 405;
            response = Map.of("success", false, "message", "Method not allowed");
        } else {
            try (Connection connection = DBConnection.getConnection();
                 PreparedStatement statement = connection.prepareStatement("SELECT 1")) {
                statement.executeQuery().close();
                response = Map.of("success", true, "message", "Service and database are healthy");
            } catch (Exception e) {
                status = 503;
                response = Map.of("success", false, "message", "Database is unavailable");
            }
        }

        byte[] body = JsonUtil.toJson(response).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, body.length);
        exchange.getResponseBody().write(body);
        exchange.getResponseBody().close();
    }
}
