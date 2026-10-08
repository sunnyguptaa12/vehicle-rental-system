package com.vehiclerental.service;

import com.vehiclerental.dao.PaymentDAO;
import com.vehiclerental.dao.BookingDAO;
import com.vehiclerental.exception.PaymentException;
import com.vehiclerental.model.Booking;
import com.vehiclerental.model.Payment;

import java.sql.SQLException;
import java.util.List;
import java.util.Set;

public class PaymentService {
    private final PaymentDAO paymentDAO = new PaymentDAO();
    private final BookingDAO bookingDAO = new BookingDAO();
    private static final Set<String> PAYMENT_METHODS = Set.of("UPI", "CARD", "CASH");

    public int createPayment(Payment payment) {
        if (payment == null) {
            throw new PaymentException("Payment required");
        }
        if (payment.getBookingId() <= 0) {
            throw new PaymentException("A valid booking is required");
        }
        String method = payment.getPaymentMethod();
        if (method == null || !PAYMENT_METHODS.contains(method.toUpperCase())) {
            throw new PaymentException("A valid payment method is required");
        }
        try {
            Booking booking = bookingDAO.getBookingById(payment.getBookingId());
            if (booking == null) {
                throw new PaymentException("Booking not found");
            }

            Payment existingPayment = paymentDAO.getPaymentByBookingId(payment.getBookingId());
            if (existingPayment != null && "SUCCESS".equalsIgnoreCase(existingPayment.getPaymentStatus())) {
                if ("PENDING_PAYMENT".equalsIgnoreCase(booking.getBookingStatus())) {
                    bookingDAO.updateBookingStatus(booking.getBookingId(), "CONFIRMED");
                }
                return existingPayment.getPaymentId();
            }

            if ("CANCELLED".equalsIgnoreCase(booking.getBookingStatus()) || "COMPLETED".equalsIgnoreCase(booking.getBookingStatus())) {
                throw new PaymentException("This booking cannot be paid");
            }

            payment.setAmount(booking.getTotalAmount());
            payment.setPaymentMethod(method.toUpperCase());
            payment.setPaymentStatus("SUCCESS");
            int paymentId;
            if (existingPayment == null) {
                paymentId = paymentDAO.createPayment(payment);
            } else {
                if (!paymentDAO.updatePayment(payment)) {
                    throw new PaymentException("Unable to complete the existing payment");
                }
                paymentId = existingPayment.getPaymentId();
            }
            if (!"CONFIRMED".equalsIgnoreCase(booking.getBookingStatus())
                    && !bookingDAO.updateBookingStatus(booking.getBookingId(), "CONFIRMED")) {
                throw new PaymentException("Payment succeeded but booking confirmation failed");
            }
            return paymentId;
        } catch (SQLException e) {
            throw new PaymentException("Payment creation failed: " + e.getMessage());
        }
    }

    public Payment getPaymentByBookingId(int bookingId) {
        try {
            Payment payment = paymentDAO.getPaymentByBookingId(bookingId);
            if (payment == null) {
                throw new PaymentException("Payment not found for booking id: " + bookingId);
            }
            return payment;
        } catch (SQLException e) {
            throw new PaymentException("Unable to fetch payment: " + e.getMessage());
        }
    }

    public List<Payment> getAllPayments() {
        try {
            return paymentDAO.getAllPayments();
        } catch (SQLException e) {
            throw new PaymentException("Unable to fetch payments: " + e.getMessage());
        }
    }
}
