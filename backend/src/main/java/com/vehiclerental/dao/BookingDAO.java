package com.vehiclerental.dao;

import com.vehiclerental.model.Booking;
import com.vehiclerental.util.DBConnection;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class BookingDAO {
    public int createBooking(Booking booking) throws SQLException {
        String sql = "INSERT INTO bookings (customer_id, vehicle_id, start_date, end_date, number_of_days, price_per_day, total_amount, booking_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setInt(1, booking.getCustomerId());
            statement.setInt(2, booking.getVehicleId());
            statement.setDate(3, Date.valueOf(booking.getStartDate()));
            statement.setDate(4, Date.valueOf(booking.getEndDate()));
            statement.setInt(5, booking.getNumberOfDays());
            statement.setDouble(6, booking.getPricePerDay());
            statement.setDouble(7, booking.getTotalAmount());
            statement.setString(8, booking.getBookingStatus());
            int affected = statement.executeUpdate();
            if (affected == 0) {
                throw new SQLException("Booking creation failed");
            }
            try (ResultSet keys = statement.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getInt(1);
                }
            }
        }
        return -1;
    }

    public Booking getBookingById(int bookingId) throws SQLException {
        String sql = "SELECT * FROM bookings WHERE booking_id = ?";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, bookingId);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return mapBooking(resultSet);
                }
            }
        }
        return null;
    }

    public List<Booking> getCustomerBookings(int customerId) throws SQLException {
        String sql = "SELECT * FROM bookings WHERE customer_id = ? ORDER BY created_at DESC";
        List<Booking> bookings = new ArrayList<>();
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, customerId);
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    bookings.add(mapBooking(resultSet));
                }
            }
        }
        return bookings;
    }

    public List<Booking> getAllBookings() throws SQLException {
        String sql = "SELECT * FROM bookings ORDER BY created_at DESC";
        List<Booking> bookings = new ArrayList<>();
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql); ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                bookings.add(mapBooking(resultSet));
            }
        }
        return bookings;
    }

    public List<Booking> getActiveBookings() throws SQLException {
        String sql = "SELECT * FROM bookings WHERE booking_status IN ('ACTIVE', 'CONFIRMED') ORDER BY start_date";
        List<Booking> bookings = new ArrayList<>();
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql); ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                bookings.add(mapBooking(resultSet));
            }
        }
        return bookings;
    }

    public boolean updateBookingStatus(int bookingId, String status) throws SQLException {
        String sql = "UPDATE bookings SET booking_status = ? WHERE booking_id = ?";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, status);
            statement.setInt(2, bookingId);
            return statement.executeUpdate() > 0;
        }
    }

    public boolean cancelBooking(int bookingId) throws SQLException {
        return updateBookingStatus(bookingId, "CANCELLED");
    }

    public boolean cancelBooking(int bookingId, int customerId) throws SQLException {
        try (Connection connection = DBConnection.getConnection()) {
            connection.setAutoCommit(false);
            try (PreparedStatement statement = connection.prepareStatement(
                    "UPDATE bookings SET booking_status = 'CANCELLED' " +
                            "WHERE booking_id = ? AND customer_id = ? " +
                            "AND booking_status IN ('PENDING_PAYMENT', 'CONFIRMED') AND start_date > CURRENT_DATE")) {
                statement.setInt(1, bookingId);
                statement.setInt(2, customerId);
                if (statement.executeUpdate() == 0) {
                    connection.rollback();
                    return false;
                }
            }
            try (PreparedStatement statement = connection.prepareStatement(
                    "UPDATE payments SET payment_status = 'REFUNDED' WHERE booking_id = ? AND payment_status = 'SUCCESS'")) {
                statement.setInt(1, bookingId);
                statement.executeUpdate();
            }
            connection.commit();
            return true;
        }
    }

    public boolean completeBooking(int bookingId, int customerId) throws SQLException {
        try (Connection connection = DBConnection.getConnection()) {
            connection.setAutoCommit(false);
            try (PreparedStatement statement = connection.prepareStatement(
                    "UPDATE bookings SET booking_status = 'COMPLETED' " +
                            "WHERE booking_id = ? AND customer_id = ? AND booking_status IN ('ACTIVE', 'CONFIRMED')")) {
                statement.setInt(1, bookingId);
                statement.setInt(2, customerId);
                if (statement.executeUpdate() == 0) {
                    connection.rollback();
                    return false;
                }
            }
            try (PreparedStatement statement = connection.prepareStatement(
                    "UPDATE vehicles SET status = 'AVAILABLE' WHERE vehicle_id = " +
                            "(SELECT vehicle_id FROM bookings WHERE booking_id = ?)")) {
                statement.setInt(1, bookingId);
                statement.executeUpdate();
            }
            connection.commit();
            return true;
        }
    }

    public boolean checkVehicleAvailability(int vehicleId, LocalDate startDate, LocalDate endDate) throws SQLException {
        String sql = "SELECT COUNT(*) FROM bookings WHERE vehicle_id = ? AND booking_status NOT IN ('CANCELLED', 'COMPLETED') AND start_date <= ? AND end_date >= ?";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, vehicleId);
            statement.setDate(2, Date.valueOf(endDate));
            statement.setDate(3, Date.valueOf(startDate));
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return resultSet.getInt(1) == 0;
                }
            }
        }
        return true;
    }

    private Booking mapBooking(ResultSet resultSet) throws SQLException {
        Booking booking = new Booking();
        booking.setBookingId(resultSet.getInt("booking_id"));
        booking.setCustomerId(resultSet.getInt("customer_id"));
        booking.setVehicleId(resultSet.getInt("vehicle_id"));
        booking.setStartDate(resultSet.getDate("start_date").toLocalDate());
        booking.setEndDate(resultSet.getDate("end_date").toLocalDate());
        booking.setNumberOfDays(resultSet.getInt("number_of_days"));
        booking.setPricePerDay(resultSet.getDouble("price_per_day"));
        booking.setTotalAmount(resultSet.getDouble("total_amount"));
        booking.setBookingStatus(resultSet.getString("booking_status"));
        booking.setCreatedAt(resultSet.getString("created_at"));
        return booking;
    }
}
