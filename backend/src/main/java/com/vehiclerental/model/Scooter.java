package com.vehiclerental.model;

public class Scooter extends Vehicle {
    public Scooter() {}

    public Scooter(int vehicleId, String brand, String model, String registrationNumber, String description,
                   String imageUrl, double pricePerDay, String status, String createdAt) {
        super(vehicleId, "Scooter", brand, model, registrationNumber, description, imageUrl, pricePerDay, status, createdAt);
    }

    @Override
    public String getVehicleType() {
        return "Scooter";
    }
}
