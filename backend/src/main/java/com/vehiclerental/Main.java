package com.vehiclerental;

import com.sun.net.httpserver.HttpServer;
import com.vehiclerental.controller.AdminController;
import com.vehiclerental.controller.AuthController;
import com.vehiclerental.controller.BookingController;
import com.vehiclerental.controller.CustomerController;
import com.vehiclerental.controller.HealthController;
import com.vehiclerental.controller.PaymentController;
import com.vehiclerental.controller.VehicleController;
import com.vehiclerental.dao.AdminDAO;
import com.vehiclerental.util.CorsFilter;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.sql.SQLException;
import java.util.concurrent.Executors;

public class Main {
    public static void main(String[] args) throws IOException, SQLException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        initializeConfiguredAdmin();
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        addApiContext(server, "/api/health", new HealthController());
        addApiContext(server, "/api/auth", new AuthController());
        addApiContext(server, "/api/vehicles", new VehicleController());
        addApiContext(server, "/api/bookings", new BookingController());
        addApiContext(server, "/api/payments", new PaymentController());
        addApiContext(server, "/api/customers", new CustomerController());
        addApiContext(server, "/api/admin", new AdminController());

        server.setExecutor(Executors.newCachedThreadPool());
        server.start();
        System.out.println("Vehicle Rental Management System backend running on http://localhost:" + port);
    }

    private static void addApiContext(HttpServer server, String path, com.sun.net.httpserver.HttpHandler handler) {
        server.createContext(path, handler).getFilters().add(new CorsFilter());
    }

    private static void initializeConfiguredAdmin() throws SQLException {
        String username = System.getenv().getOrDefault("ADMIN_USERNAME", "").trim();
        String password = System.getenv().getOrDefault("ADMIN_PASSWORD", "");
        if (username.isEmpty() && password.isEmpty()) {
            return;
        }
        if (username.isEmpty() || password.length() < 12) {
            throw new IllegalStateException("Set ADMIN_USERNAME and an ADMIN_PASSWORD of at least 12 characters");
        }
        new AdminDAO().createOrUpdateAdmin(username, password);
        System.out.println("Configured admin account is ready");
    }
}
