package com.vehiclerental.model;

public class Car extends Vehicle {
    public Car() {}

    public Car(int vehicleId, String brand, String model, String registrationNumber, String description,
               String imageUrl, double pricePerDay, String status, String createdAt) {
        super(vehicleId, "Car", brand, model, registrationNumber, description, imageUrl, pricePerDay, status, createdAt);
    }

    @Override
    public String getVehicleType() {
        return "Car";
    }
}
