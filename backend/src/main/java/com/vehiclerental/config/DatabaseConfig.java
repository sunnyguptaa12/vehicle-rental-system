package com.vehiclerental.config;

public class DatabaseConfig {
    public static final String DB_URL = getEnvOrProperty("DB_URL", "jdbc:mysql://localhost:3306/vehicle_rental_db");
    public static final String DB_USERNAME = getEnvOrProperty("DB_USERNAME", "root");
    public static final String DB_PASSWORD = getEnvOrProperty("DB_PASSWORD", "");

    private static String getEnvOrProperty(String key, String defaultValue) {
        String envValue = System.getenv(key);
        if (envValue != null && !envValue.trim().isEmpty()) {
            return envValue;
        }
        String propertyValue = System.getProperty(key);
        if (propertyValue != null && !propertyValue.trim().isEmpty()) {
            return propertyValue;
        }
        return defaultValue;
    }
}
