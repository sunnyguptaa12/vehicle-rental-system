package com.vehiclerental.service;

import com.vehiclerental.dao.AdminDAO;
import com.vehiclerental.dao.CustomerDAO;
import com.vehiclerental.exception.AuthenticationException;
import com.vehiclerental.model.Admin;
import com.vehiclerental.model.Customer;
import com.vehiclerental.util.ValidationUtil;

import java.sql.SQLException;

public class AuthService {
    private final CustomerDAO customerDAO = new CustomerDAO();
    private final AdminDAO adminDAO = new AdminDAO();

    public Customer registerCustomer(Customer customer) {
        if (customer == null) {
            throw new AuthenticationException("Customer details are required");
        }
        if (!ValidationUtil.isValidEmail(customer.getEmail())) {
            throw new AuthenticationException("Invalid email format");
        }
        if (!ValidationUtil.isValidPhone(customer.getPhone())) {
            throw new AuthenticationException("Phone number must contain exactly 10 digits");
        }
        if (!ValidationUtil.isValidPassword(customer.getPassword())) {
            throw new AuthenticationException("Password must be at least 6 characters");
        }
        try {
            int customerId = customerDAO.registerCustomer(customer);
            customer.setCustomerId(customerId);
            return customer;
        } catch (SQLException e) {
            throw new AuthenticationException("Unable to register customer: " + e.getMessage());
        }
    }

    public Customer loginCustomer(String email, String password) {
        if (email == null || password == null) {
            throw new AuthenticationException("Email and password are required");
        }
        try {
            Customer customer = customerDAO.loginCustomer(email, password);
            if (customer == null) {
                throw new AuthenticationException("Invalid email or password");
            }
            return customer;
        } catch (SQLException e) {
            throw new AuthenticationException("Login failed: " + e.getMessage());
        }
    }

    public Admin adminLogin(String username, String password) {
        if (username == null || password == null) {
            throw new AuthenticationException("Username and password are required");
        }
        try {
            Admin admin = adminDAO.adminLogin(username, password);
            if (admin == null) {
                throw new AuthenticationException("Invalid admin credentials");
            }
            return admin;
        } catch (SQLException e) {
            throw new AuthenticationException("Admin login failed: " + e.getMessage());
        }
    }
}
