package com.vehiclerental.model;

public abstract class Vehicle {
    private int vehicleId;
    private String vehicleType;
    private String brand;
    private String model;
    private String registrationNumber;
    private String description;
    private String imageUrl;
    private double pricePerDay;
    private String status;
    private String createdAt;

    public Vehicle() {}

    public Vehicle(int vehicleId, String vehicleType, String brand, String model, String registrationNumber,
                   String description, String imageUrl, double pricePerDay, String status, String createdAt) {
        this.vehicleId = vehicleId;
        this.vehicleType = vehicleType;
        this.brand = brand;
        this.model = model;
        this.registrationNumber = registrationNumber;
        this.description = description;
        this.imageUrl = imageUrl;
        this.pricePerDay = pricePerDay;
        this.status = status;
        this.createdAt = createdAt;
    }

    public abstract String getVehicleType();

    public int getVehicleId() { return vehicleId; }
    public void setVehicleId(int vehicleId) { this.vehicleId = vehicleId; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public double getPricePerDay() { return pricePerDay; }
    public void setPricePerDay(double pricePerDay) { this.pricePerDay = pricePerDay; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getVehicleTypeValue() { return vehicleType; }
    public void setVehicleTypeValue(String vehicleType) { this.vehicleType = vehicleType; }
}
