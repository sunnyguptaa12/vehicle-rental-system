package com.vehiclerental.model;

public class SUV extends Vehicle {
    public SUV() {}

    public SUV(int vehicleId, String brand, String model, String registrationNumber, String description,
               String imageUrl, double pricePerDay, String status, String createdAt) {
        super(vehicleId, "SUV", brand, model, registrationNumber, description, imageUrl, pricePerDay, status, createdAt);
    }

    @Override
    public String getVehicleType() {
        return "SUV";
    }
}
