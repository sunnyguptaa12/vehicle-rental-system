package com.vehiclerental.dao;

import com.vehiclerental.model.Admin;
import com.vehiclerental.util.DBConnection;
import com.vehiclerental.util.PasswordUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class AdminDAO {
    public void createOrUpdateAdmin(String username, String password) throws SQLException {
        String sql = "INSERT INTO admins (username, password) VALUES (?, ?) " +
                "ON DUPLICATE KEY UPDATE password = VALUES(password)";
        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, username);
            statement.setString(2, PasswordUtil.hashPassword(password));
            statement.executeUpdate();
        }
    }

    public Admin adminLogin(String username, String password) throws SQLException {
        String sql = "SELECT * FROM admins WHERE username = ?";
        try (Connection connection = DBConnection.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, username);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    Admin admin = new Admin();
                    admin.setAdminId(resultSet.getInt("admin_id"));
                    admin.setUsername(resultSet.getString("username"));
                    admin.setPassword(resultSet.getString("password"));
                    admin.setCreatedAt(resultSet.getString("created_at"));
                    if (PasswordUtil.verifyPassword(password, admin.getPassword())) {
                        return admin;
                    }
                }
            }
        }
        return null;
    }
}
