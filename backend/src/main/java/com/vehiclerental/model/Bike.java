package com.vehiclerental.model;

public class Bike extends Vehicle {
    public Bike() {}

    public Bike(int vehicleId, String brand, String model, String registrationNumber, String description,
                String imageUrl, double pricePerDay, String status, String createdAt) {
        super(vehicleId, "Bike", brand, model, registrationNumber, description, imageUrl, pricePerDay, status, createdAt);
    }

    @Override
    public String getVehicleType() {
        return "Bike";
    }
}
