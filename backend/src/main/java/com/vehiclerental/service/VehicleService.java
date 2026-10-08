package com.vehiclerental.service;

import com.vehiclerental.dao.VehicleDAO;
import com.vehiclerental.exception.InvalidDateException;
import com.vehiclerental.exception.VehicleNotAvailableException;
import com.vehiclerental.exception.VehicleNotFoundException;
import com.vehiclerental.model.Vehicle;
import com.vehiclerental.util.ValidationUtil;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

public class VehicleService {
    private final VehicleDAO vehicleDAO = new VehicleDAO();

    public Vehicle addVehicle(Vehicle vehicle) {
        if (vehicle == null) {
            throw new IllegalArgumentException("Vehicle data is required");
        }
        if (!ValidationUtil.isPositivePrice(vehicle.getPricePerDay())) {
            throw new InvalidDateException("Price per day must be positive");
        }
        if (vehicle.getStatus() == null || vehicle.getStatus().isBlank()) {
            vehicle.setStatus("AVAILABLE");
        }
        try {
            int id = vehicleDAO.addVehicle(vehicle);
            vehicle.setVehicleId(id);
            return vehicle;
        } catch (SQLException e) {
            throw new RuntimeException("Unable to add vehicle: " + e.getMessage());
        }
    }

    public List<Vehicle> getAllVehicles() {
        try {
            return vehicleDAO.getAllVehicles();
        } catch (SQLException e) {
            throw new RuntimeException("Unable to fetch vehicles: " + e.getMessage());
        }
    }

    public List<Vehicle> getAvailableVehicles() {
        try {
            return vehicleDAO.getAvailableVehicles();
        } catch (SQLException e) {
            throw new RuntimeException("Unable to fetch available vehicles: " + e.getMessage());
        }
    }

    public Vehicle getVehicleById(int vehicleId) {
        try {
            Vehicle vehicle = vehicleDAO.getVehicleById(vehicleId);
            if (vehicle == null) {
                throw new VehicleNotFoundException("Vehicle not found with id: " + vehicleId);
            }
            return vehicle;
        } catch (SQLException e) {
            throw new RuntimeException("Unable to fetch vehicle: " + e.getMessage());
        }
    }

    public List<Vehicle> searchVehicles(String keyword) {
        try {
            return vehicleDAO.searchVehicles(keyword);
        } catch (SQLException e) {
            throw new RuntimeException("Unable to search vehicles: " + e.getMessage());
        }
    }

    public List<Vehicle> filterVehicles(String type, String status) {
        try {
            return vehicleDAO.filterVehicles(type, status);
        } catch (SQLException e) {
            throw new RuntimeException("Unable to filter vehicles: " + e.getMessage());
        }
    }

    public boolean updateVehicle(Vehicle vehicle) {
        try {
            return vehicleDAO.updateVehicle(vehicle);
        } catch (SQLException e) {
            throw new RuntimeException("Unable to update vehicle: " + e.getMessage());
        }
    }

    public boolean deleteVehicle(int vehicleId) {
        try {
            return vehicleDAO.deleteVehicle(vehicleId);
        } catch (SQLException e) {
            throw new RuntimeException("Unable to delete vehicle: " + e.getMessage());
        }
    }

    public void validateAvailability(int vehicleId, LocalDate startDate, LocalDate endDate) {
        Vehicle vehicle = getVehicleById(vehicleId);
        if (!"AVAILABLE".equalsIgnoreCase(vehicle.getStatus())) {
            throw new VehicleNotAvailableException("Vehicle is not available for the selected dates");
        }
        if (startDate == null || endDate == null || endDate.isBefore(startDate)) {
            throw new InvalidDateException("Start date and end date are invalid");
        }
        if (startDate.isBefore(LocalDate.now())) {
            throw new InvalidDateException("Start date cannot be in the past");
        }
    }
}
