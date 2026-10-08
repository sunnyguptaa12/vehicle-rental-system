package com.vehiclerental.service;

import com.vehiclerental.dao.BookingDAO;
import com.vehiclerental.dao.VehicleDAO;
import com.vehiclerental.exception.BookingNotFoundException;
import com.vehiclerental.exception.InvalidDateException;
import com.vehiclerental.exception.VehicleNotAvailableException;
import com.vehiclerental.model.Booking;
import com.vehiclerental.model.Vehicle;
import com.vehiclerental.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

public class BookingService {
    private final BookingDAO bookingDAO = new BookingDAO();
    private final VehicleDAO vehicleDAO = new VehicleDAO();

    public int createBooking(int customerId, int vehicleId, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new InvalidDateException("Start date and end date are required");
        }
        if (endDate.isBefore(startDate) || endDate.isEqual(startDate)) {
            throw new InvalidDateException("End date must be after start date");
        }
        if (startDate.isBefore(LocalDate.now())) {
            throw new InvalidDateException("Start date cannot be in the past");
        }

        try {
            Vehicle vehicle = vehicleDAO.getVehicleById(vehicleId);
            if (vehicle == null) {
                throw new IllegalArgumentException("Vehicle not found");
            }
            if ("MAINTENANCE".equalsIgnoreCase(vehicle.getStatus())) {
                throw new VehicleNotAvailableException("Vehicle is not available");
            }
            if (!bookingDAO.checkVehicleAvailability(vehicleId, startDate, endDate)) {
                throw new VehicleNotAvailableException("Vehicle is already booked for the selected dates");
            }

            long days = ChronoUnit.DAYS.between(startDate, endDate);
            if (days < 1) {
                throw new InvalidDateException("Rental duration must be at least one day");
            }
            double baseRent = vehicle.getPricePerDay() * (days + 1);
            double totalAmount = baseRent + Math.round(baseRent * 0.05);

            Booking booking = new Booking();
            booking.setCustomerId(customerId);
            booking.setVehicleId(vehicleId);
            booking.setStartDate(startDate);
            booking.setEndDate(endDate);
            booking.setNumberOfDays((int) (days + 1));
            booking.setPricePerDay(vehicle.getPricePerDay());
            booking.setTotalAmount(totalAmount);
            booking.setBookingStatus("PENDING_PAYMENT");

            try (Connection connection = DBConnection.getConnection()) {
                connection.setAutoCommit(false);
                try {
                    String bookingSql = "INSERT INTO bookings (customer_id, vehicle_id, start_date, end_date, number_of_days, price_per_day, total_amount, booking_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                    try (PreparedStatement bookingStatement = connection.prepareStatement(bookingSql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
                        bookingStatement.setInt(1, customerId);
                        bookingStatement.setInt(2, vehicleId);
                        bookingStatement.setDate(3, java.sql.Date.valueOf(startDate));
                        bookingStatement.setDate(4, java.sql.Date.valueOf(endDate));
                        bookingStatement.setInt(5, booking.getNumberOfDays());
                        bookingStatement.setDouble(6, booking.getPricePerDay());
                        bookingStatement.setDouble(7, booking.getTotalAmount());
                        bookingStatement.setString(8, booking.getBookingStatus());
                        bookingStatement.executeUpdate();

                        try (java.sql.ResultSet generatedKeys = bookingStatement.getGeneratedKeys()) {
                            if (generatedKeys.next()) {
                                int bookingId = generatedKeys.getInt(1);
                                connection.commit();
                                return bookingId;
                            }
                        }
                    }
                    connection.rollback();
                } catch (SQLException ex) {
                    connection.rollback();
                    throw ex;
                }
            }
            throw new IllegalStateException("Booking transaction failed");
        } catch (SQLException e) {
            throw new RuntimeException("Unable to create booking: " + e.getMessage());
        }
    }

    public Booking getBookingById(int bookingId) {
        try {
            Booking booking = bookingDAO.getBookingById(bookingId);
            if (booking == null) {
                throw new BookingNotFoundException("Booking not found with id: " + bookingId);
            }
            return booking;
        } catch (SQLException e) {
            throw new RuntimeException("Unable to fetch booking: " + e.getMessage());
        }
    }

    public List<Booking> getCustomerBookings(int customerId) {
        try {
            return bookingDAO.getCustomerBookings(customerId);
        } catch (SQLException e) {
            throw new RuntimeException("Unable to fetch customer bookings: " + e.getMessage());
        }
    }

    public List<Booking> getAllBookings() {
        try {
            return bookingDAO.getAllBookings();
        } catch (SQLException e) {
            throw new RuntimeException("Unable to fetch bookings: " + e.getMessage());
        }
    }

    public boolean cancelBooking(int bookingId, int customerId) {
        try {
            Booking booking = bookingDAO.getBookingById(bookingId);
            if (booking == null) {
                throw new BookingNotFoundException("Booking not found");
            }
            if (booking.getCustomerId() != customerId) {
                throw new SecurityException("Customer does not own this booking");
            }
            if (!booking.getStartDate().isAfter(LocalDate.now())) {
                throw new IllegalStateException("Only future bookings can be cancelled");
            }
            if (!"PENDING_PAYMENT".equalsIgnoreCase(booking.getBookingStatus())
                    && !"CONFIRMED".equalsIgnoreCase(booking.getBookingStatus())) {
                throw new IllegalStateException("Only pending or confirmed bookings can be cancelled");
            }
            if (!bookingDAO.cancelBooking(bookingId, customerId)) {
                throw new IllegalStateException("Booking could not be cancelled; refresh and try again");
            }
            return true;
        } catch (SQLException e) {
            throw new RuntimeException("Unable to cancel booking: " + e.getMessage());
        }
    }

    public void returnVehicle(int bookingId, int customerId) {
        try {
            Booking booking = bookingDAO.getBookingById(bookingId);
            if (booking == null) {
                throw new BookingNotFoundException("Booking not found");
            }
            if (booking.getCustomerId() != customerId) {
                throw new SecurityException("Customer does not own this booking");
            }
            if (!"ACTIVE".equalsIgnoreCase(booking.getBookingStatus()) && !"CONFIRMED".equalsIgnoreCase(booking.getBookingStatus())) {
                throw new IllegalStateException("Only active or confirmed bookings can be returned");
            }
            if (!bookingDAO.completeBooking(bookingId, customerId)) {
                throw new IllegalStateException("Booking could not be returned; refresh and try again");
            }
        } catch (SQLException e) {
            throw new RuntimeException("Unable to return vehicle: " + e.getMessage());
        }
    }

    public void adminCancelBooking(int bookingId) {
        try {
            Booking booking = bookingDAO.getBookingById(bookingId);
            if (booking == null) {
                throw new BookingNotFoundException("Booking not found");
            }
            if (!booking.getStartDate().isAfter(LocalDate.now())) {
                throw new IllegalStateException("Only future bookings can be cancelled");
            }
            if (!"PENDING_PAYMENT".equalsIgnoreCase(booking.getBookingStatus())
                    && !"CONFIRMED".equalsIgnoreCase(booking.getBookingStatus())) {
                throw new IllegalStateException("Only pending or confirmed bookings can be cancelled");
            }
            if (!bookingDAO.cancelBooking(bookingId, booking.getCustomerId())) {
                throw new IllegalStateException("Booking could not be cancelled; refresh and try again");
            }
        } catch (SQLException e) {
            throw new RuntimeException("Unable to cancel booking: " + e.getMessage());
        }
    }

    public void adminReturnVehicle(int bookingId) {
        try {
            Booking booking = bookingDAO.getBookingById(bookingId);
            if (booking == null) {
                throw new BookingNotFoundException("Booking not found");
            }
            if (!"ACTIVE".equalsIgnoreCase(booking.getBookingStatus())
                    && !"CONFIRMED".equalsIgnoreCase(booking.getBookingStatus())) {
                throw new IllegalStateException("Only active or confirmed bookings can be returned");
            }
            if (!bookingDAO.completeBooking(bookingId, booking.getCustomerId())) {
                throw new IllegalStateException("Vehicle could not be marked as returned; refresh and try again");
            }
        } catch (SQLException e) {
            throw new RuntimeException("Unable to return vehicle: " + e.getMessage());
        }
    }
}
