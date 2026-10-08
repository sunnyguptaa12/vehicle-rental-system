package com.vehiclerental.dao;

import com.vehiclerental.model.Payment;
import com.vehiclerental.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PaymentDAO {
    public int createPayment(Payment payment) throws SQLException {
        String sql = "INSERT INTO payments (booking_id, amount, payment_method, payment_status) VALUES (?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE payment_id = LAST_INSERT_ID(payment_id)";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, payment.getBookingId());
            statement.setDouble(2, payment.getAmount());
            statement.setString(3, payment.getPaymentMethod());
            statement.setString(4, payment.getPaymentStatus());
            statement.executeUpdate();
            try (PreparedStatement idStatement = connection.prepareStatement("SELECT payment_id FROM payments WHERE booking_id = ?")) {
                idStatement.setInt(1, payment.getBookingId());
                try (ResultSet resultSet = idStatement.executeQuery()) {
                    if (resultSet.next()) {
                        return resultSet.getInt("payment_id");
                    }
                }
            }
        }
        throw new SQLException("Payment creation failed");
    }

    public Payment getPaymentByBookingId(int bookingId) throws SQLException {
        String sql = "SELECT * FROM payments WHERE booking_id = ?";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, bookingId);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return mapPayment(resultSet);
                }
            }
        }
        return null;
    }

    public boolean updatePayment(Payment payment) throws SQLException {
        String sql = "UPDATE payments SET amount = ?, payment_method = ?, payment_status = ? WHERE booking_id = ?";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setDouble(1, payment.getAmount());
            statement.setString(2, payment.getPaymentMethod());
            statement.setString(3, payment.getPaymentStatus());
            statement.setInt(4, payment.getBookingId());
            return statement.executeUpdate() > 0;
        }
    }

    public List<Payment> getAllPayments() throws SQLException {
        String sql = "SELECT * FROM payments ORDER BY payment_date DESC";
        List<Payment> payments = new ArrayList<>();
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql); ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                payments.add(mapPayment(resultSet));
            }
        }
        return payments;
    }

    private Payment mapPayment(ResultSet resultSet) throws SQLException {
        Payment payment = new Payment();
        payment.setPaymentId(resultSet.getInt("payment_id"));
        payment.setBookingId(resultSet.getInt("booking_id"));
        payment.setAmount(resultSet.getDouble("amount"));
        payment.setPaymentMethod(resultSet.getString("payment_method"));
        payment.setPaymentStatus(resultSet.getString("payment_status"));
        Timestamp timestamp = resultSet.getTimestamp("payment_date");
        if (timestamp != null) {
            payment.setPaymentDate(timestamp.toLocalDateTime());
        }
        return payment;
    }
}
