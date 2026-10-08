package com.vehiclerental.dao;

import com.vehiclerental.model.Vehicle;
import com.vehiclerental.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class VehicleDAO {
    public int addVehicle(Vehicle vehicle) throws SQLException {
        String sql = "INSERT INTO vehicles (vehicle_type, brand, model, registration_number, description, image_url, price_per_day, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setString(1, vehicle.getVehicleTypeValue());
            statement.setString(2, vehicle.getBrand());
            statement.setString(3, vehicle.getModel());
            statement.setString(4, vehicle.getRegistrationNumber());
            statement.setString(5, vehicle.getDescription());
            statement.setString(6, vehicle.getImageUrl());
            statement.setDouble(7, vehicle.getPricePerDay());
            statement.setString(8, vehicle.getStatus());
            int affected = statement.executeUpdate();
            if (affected == 0) {
                throw new SQLException("Creating vehicle failed");
            }
            try (ResultSet keys = statement.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getInt(1);
                }
            }
            return -1;
        }
    }

    public List<Vehicle> getAllVehicles() throws SQLException {
        String sql = "SELECT * FROM vehicles ORDER BY created_at DESC";
        List<Vehicle> vehicles = new ArrayList<>();
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql); ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                vehicles.add(mapVehicle(resultSet));
            }
        }
        return vehicles;
    }

    public List<Vehicle> getAvailableVehicles() throws SQLException {
        String sql = "SELECT * FROM vehicles WHERE status = 'AVAILABLE' ORDER BY created_at DESC";
        List<Vehicle> vehicles = new ArrayList<>();
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql); ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                vehicles.add(mapVehicle(resultSet));
            }
        }
        return vehicles;
    }

    public Vehicle getVehicleById(int vehicleId) throws SQLException {
        String sql = "SELECT * FROM vehicles WHERE vehicle_id = ?";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, vehicleId);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return mapVehicle(resultSet);
                }
            }
        }
        return null;
    }

    public List<Vehicle> searchVehicles(String keyword) throws SQLException {
        String sql = "SELECT * FROM vehicles WHERE brand LIKE ? OR model LIKE ? OR vehicle_type LIKE ?";
        List<Vehicle> vehicles = new ArrayList<>();
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            String text = "%" + keyword + "%";
            statement.setString(1, text);
            statement.setString(2, text);
            statement.setString(3, text);
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    vehicles.add(mapVehicle(resultSet));
                }
            }
        }
        return vehicles;
    }

    public List<Vehicle> filterVehicles(String type, String status) throws SQLException {
        List<String> clauses = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT * FROM vehicles WHERE 1=1");

        if (type != null && !type.isBlank()) {
            sql.append(" AND vehicle_type = ?");
            values.add(type);
        }
        if (status != null && !status.isBlank()) {
            sql.append(" AND status = ?");
            values.add(status);
        }

        sql.append(" ORDER BY created_at DESC");
        List<Vehicle> vehicles = new ArrayList<>();
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql.toString())) {
            int index = 1;
            for (Object value : values) {
                statement.setObject(index++, value);
            }
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    vehicles.add(mapVehicle(resultSet));
                }
            }
        }
        return vehicles;
    }

    public boolean updateVehicle(Vehicle vehicle) throws SQLException {
        String sql = "UPDATE vehicles SET vehicle_type = ?, brand = ?, model = ?, registration_number = ?, description = ?, image_url = ?, price_per_day = ?, status = ? WHERE vehicle_id = ?";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, vehicle.getVehicleTypeValue());
            statement.setString(2, vehicle.getBrand());
            statement.setString(3, vehicle.getModel());
            statement.setString(4, vehicle.getRegistrationNumber());
            statement.setString(5, vehicle.getDescription());
            statement.setString(6, vehicle.getImageUrl());
            statement.setDouble(7, vehicle.getPricePerDay());
            statement.setString(8, vehicle.getStatus());
            statement.setInt(9, vehicle.getVehicleId());
            return statement.executeUpdate() > 0;
        }
    }

    public boolean deleteVehicle(int vehicleId) throws SQLException {
        String sql = "DELETE FROM vehicles WHERE vehicle_id = ?";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, vehicleId);
            return statement.executeUpdate() > 0;
        }
    }

    public boolean updateVehicleStatus(int vehicleId, String status) throws SQLException {
        String sql = "UPDATE vehicles SET status = ? WHERE vehicle_id = ?";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, status);
            statement.setInt(2, vehicleId);
            return statement.executeUpdate() > 0;
        }
    }

    private Vehicle mapVehicle(ResultSet resultSet) throws SQLException {
        Vehicle vehicle = new Vehicle() {
            @Override
            public String getVehicleType() {
                return getVehicleTypeValue();
            }
        };
        vehicle.setVehicleId(resultSet.getInt("vehicle_id"));
        vehicle.setVehicleTypeValue(resultSet.getString("vehicle_type"));
        vehicle.setBrand(resultSet.getString("brand"));
        vehicle.setModel(resultSet.getString("model"));
        vehicle.setRegistrationNumber(resultSet.getString("registration_number"));
        vehicle.setDescription(resultSet.getString("description"));
        vehicle.setImageUrl(resultSet.getString("image_url"));
        vehicle.setPricePerDay(resultSet.getDouble("price_per_day"));
        vehicle.setStatus(resultSet.getString("status"));
        vehicle.setCreatedAt(resultSet.getString("created_at"));
        return vehicle;
    }
}
