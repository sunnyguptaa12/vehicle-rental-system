package com.vehiclerental.service;

import com.vehiclerental.dao.BookingDAO;
import com.vehiclerental.dao.CustomerDAO;
import com.vehiclerental.dao.PaymentDAO;
import com.vehiclerental.dao.VehicleDAO;
import com.vehiclerental.model.Booking;
import com.vehiclerental.model.Customer;
import com.vehiclerental.model.Payment;
import com.vehiclerental.model.Vehicle;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AdminService {
    private final VehicleDAO vehicleDAO = new VehicleDAO();
    private final CustomerDAO customerDAO = new CustomerDAO();
    private final BookingDAO bookingDAO = new BookingDAO();
    private final PaymentDAO paymentDAO = new PaymentDAO();

    public Map<String, Object> getDashboard() {
        try {
            List<Vehicle> vehicles = vehicleDAO.getAllVehicles();
            List<Customer> customers = customerDAO.getAllCustomers();
            List<Booking> bookings = bookingDAO.getAllBookings();
            List<Payment> payments = paymentDAO.getAllPayments();

            Map<String, Object> dashboard = new LinkedHashMap<>();
            dashboard.put("totalVehicles", vehicles.size());
            dashboard.put("availableVehicles", vehicles.stream().filter(v -> "AVAILABLE".equalsIgnoreCase(v.getStatus())).count());
            dashboard.put("rentedVehicles", vehicles.stream().filter(v -> "RENTED".equalsIgnoreCase(v.getStatus())).count());
            dashboard.put("maintenanceVehicles", vehicles.stream().filter(v -> "MAINTENANCE".equalsIgnoreCase(v.getStatus())).count());
            dashboard.put("totalCustomers", customers.size());
            dashboard.put("totalBookings", bookings.size());
            dashboard.put("activeRentals", bookings.stream().filter(b -> "ACTIVE".equalsIgnoreCase(b.getBookingStatus()) || "CONFIRMED".equalsIgnoreCase(b.getBookingStatus())).count());
            dashboard.put("completedRentals", bookings.stream().filter(b -> "COMPLETED".equalsIgnoreCase(b.getBookingStatus())).count());
            dashboard.put("totalRevenue", payments.stream()
                    .filter(payment -> "SUCCESS".equalsIgnoreCase(payment.getPaymentStatus()))
                    .mapToDouble(Payment::getAmount)
                    .sum());
            dashboard.put("revenueTrend", buildRevenueTrend(payments));
            dashboard.put("bookingTrend", buildBookingTrend(bookings));
            return dashboard;
        } catch (SQLException e) {
            throw new RuntimeException("Unable to build dashboard: " + e.getMessage());
        }
    }

    private List<Map<String, Object>> buildRevenueTrend(List<Payment> payments) {
        YearMonth firstMonth = YearMonth.now().minusMonths(5);
        Map<YearMonth, Double> monthlyRevenue = new HashMap<>();
        for (int offset = 0; offset < 6; offset++) {
            monthlyRevenue.put(firstMonth.plusMonths(offset), 0.0);
        }
        for (Payment payment : payments) {
            if (!"SUCCESS".equalsIgnoreCase(payment.getPaymentStatus()) || payment.getPaymentDate() == null) {
                continue;
            }
            YearMonth paymentMonth = YearMonth.from(payment.getPaymentDate());
            if (monthlyRevenue.containsKey(paymentMonth)) {
                monthlyRevenue.merge(paymentMonth, payment.getAmount(), Double::sum);
            }
        }
        return monthlyRevenue.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> trendPoint(entry.getKey(), "revenue", entry.getValue()))
                .toList();
    }

    private List<Map<String, Object>> buildBookingTrend(List<Booking> bookings) {
        YearMonth firstMonth = YearMonth.now().minusMonths(5);
        Map<YearMonth, Long> monthlyBookings = new HashMap<>();
        for (int offset = 0; offset < 6; offset++) {
            monthlyBookings.put(firstMonth.plusMonths(offset), 0L);
        }
        for (Booking booking : bookings) {
            if (booking.getCreatedAt() == null || booking.getCreatedAt().length() < 10) {
                continue;
            }
            YearMonth bookingMonth = YearMonth.from(LocalDate.parse(booking.getCreatedAt().substring(0, 10)));
            if (monthlyBookings.containsKey(bookingMonth)) {
                monthlyBookings.merge(bookingMonth, 1L, Long::sum);
            }
        }
        return monthlyBookings.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> trendPoint(entry.getKey(), "bookings", entry.getValue()))
                .toList();
    }

    private Map<String, Object> trendPoint(YearMonth month, String valueKey, Number value) {
        Map<String, Object> point = new LinkedHashMap<>();
        point.put("month", month.format(DateTimeFormatter.ofPattern("MMM")));
        point.put("year", month.getYear());
        point.put(valueKey, value);
        return point;
    }

    public List<Customer> getAllCustomers() {
        try {
            return customerDAO.getAllCustomers();
        } catch (SQLException e) {
            throw new RuntimeException("Unable to fetch customers: " + e.getMessage());
        }
    }

    public List<Booking> getAllBookings() {
        try {
            return bookingDAO.getAllBookings();
        } catch (SQLException e) {
            throw new RuntimeException("Unable to fetch bookings: " + e.getMessage());
        }
    }

    public double getRevenue() {
        try {
            return paymentDAO.getAllPayments().stream()
                    .filter(payment -> "SUCCESS".equalsIgnoreCase(payment.getPaymentStatus()))
                    .mapToDouble(Payment::getAmount)
                    .sum();
        } catch (SQLException e) {
            throw new RuntimeException("Unable to calculate revenue: " + e.getMessage());
        }
    }
}
