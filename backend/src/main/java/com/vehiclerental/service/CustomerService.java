package com.vehiclerental.service;

import com.vehiclerental.dao.CustomerDAO;
import com.vehiclerental.exception.CustomerNotFoundException;
import com.vehiclerental.model.Customer;
import com.vehiclerental.util.ValidationUtil;

import java.sql.SQLException;
import java.util.List;

public class CustomerService {
    private final CustomerDAO customerDAO = new CustomerDAO();

    public Customer getCustomerById(int customerId) {
        try {
            Customer customer = customerDAO.getCustomerById(customerId);
            if (customer == null) {
                throw new CustomerNotFoundException("Customer not found with id: " + customerId);
            }
            return customer;
        } catch (SQLException e) {
            throw new RuntimeException("Unable to fetch customer: " + e.getMessage());
        }
    }

    public List<Customer> getAllCustomers() {
        try {
            return customerDAO.getAllCustomers();
        } catch (SQLException e) {
            throw new RuntimeException("Unable to fetch customers: " + e.getMessage());
        }
    }

    public boolean updateCustomer(Customer customer) {
        if (customer == null || customer.getCustomerId() <= 0) {
            throw new IllegalArgumentException("Valid customer details are required");
        }
        if (customer.getName() == null || customer.getName().isBlank() || customer.getName().trim().length() > 100) {
            throw new IllegalArgumentException("Name is required and must be no longer than 100 characters");
        }
        if (!ValidationUtil.isValidEmail(customer.getEmail()) || customer.getEmail().trim().length() > 100) {
            throw new IllegalArgumentException("A valid email address is required");
        }
        if (!ValidationUtil.isValidPhone(customer.getPhone())) {
            throw new IllegalArgumentException("Phone number must contain exactly 10 digits");
        }
        customer.setName(customer.getName().trim());
        customer.setEmail(customer.getEmail().trim());
        customer.setPhone(customer.getPhone().trim());
        try {
            if (!customerDAO.updateCustomer(customer)) {
                throw new CustomerNotFoundException("Customer not found with id: " + customer.getCustomerId());
            }
            return true;
        } catch (SQLException e) {
            throw new RuntimeException("Unable to update customer: " + e.getMessage());
        }
    }
}
