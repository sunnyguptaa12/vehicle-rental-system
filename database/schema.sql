CREATE DATABASE IF NOT EXISTS vehicle_rental_db;
USE vehicle_rental_db;

CREATE TABLE IF NOT EXISTS customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_type VARCHAR(20) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(255),
    price_per_day DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    number_of_days INT NOT NULL,
    price_per_day DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

INSERT INTO vehicles (vehicle_type, brand, model, registration_number, description, image_url, price_per_day, status) VALUES
('Car', 'Hyundai', 'Creta', 'MH12AB1234', 'Compact SUV with spacious cabin and premium comfort.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/2024_Hyundai_Creta_1.5_MPi_SX%28O%29_%28India%29_front_view.png/960px-2024_Hyundai_Creta_1.5_MPi_SX%28O%29_%28India%29_front_view.png', 2600.00, 'AVAILABLE'),
('Car', 'Honda', 'City', 'MH14CD2345', 'Elegant sedan with best-in-class comfort and mileage.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Honda_City_1.5_i-VTEC_V_%28VIII%2C_Facelift%29_%E2%80%93_f_22032025.jpg/960px-Honda_City_1.5_i-VTEC_V_%28VIII%2C_Facelift%29_%E2%80%93_f_22032025.jpg', 2400.00, 'AVAILABLE'),
('Car', 'Toyota', 'Fortuner', 'MH01EF3456', 'Reliable SUV built for long trips and luxury travel.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/2015_Toyota_Fortuner_%28New_Zealand%29.jpg/960px-2015_Toyota_Fortuner_%28New_Zealand%29.jpg', 4200.00, 'AVAILABLE'),
('Car', 'Maruti', 'Brezza', 'MH09GH4567', 'Smart urban SUV with a reliable engine and comfort features.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/2021_Maruti_Suzuki_Vitara_Brezza_VXI.jpg/960px-2021_Maruti_Suzuki_Vitara_Brezza_VXI.jpg', 2200.00, 'AVAILABLE'),
('Bike', 'Royal Enfield', 'Classic 350', 'MH19IJ5678', 'Classic-looking bike for highway cruising and city style.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/Royal_Enfield_Classic_350.jpg/960px-Royal_Enfield_Classic_350.jpg', 1200.00, 'AVAILABLE'),
('Bike', 'Yamaha', 'R15', 'MH27KL6789', 'Sporty motorcycle designed for performance and riding thrill.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/2014_Yamaha_YZF-R15.JPG/960px-2014_Yamaha_YZF-R15.JPG', 1400.00, 'AVAILABLE'),
('Bike', 'KTM', 'Duke 390', 'MH28MN7890', 'Aggressive performance motorcycle with premium handling.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/KTM_390_Duke_2017.jpg/960px-KTM_390_Duke_2017.jpg', 1600.00, 'AVAILABLE'),
('Scooter', 'Honda', 'Activa', 'MH18OP8901', 'Efficient scooter perfect for medium-distance city rides.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Honda_Activa_Rental-_Goa_3.jpg/960px-Honda_Activa_Rental-_Goa_3.jpg', 900.00, 'AVAILABLE'),
('Car', 'Maruti Suzuki', 'Swift', 'MH12PQ1122', 'Popular Indian hatchback with excellent city mileage and easy handling.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d2/Maruti_Suzuki_Swift_2092.JPG/960px-Maruti_Suzuki_Swift_2092.JPG', 1500.00, 'AVAILABLE'),
('Car', 'Tata', 'Tiago', 'MH12RT3344', 'Compact Indian hatchback with a comfortable cabin and strong safety features.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/2019_Tata_Tiago_XZ_%28front_three-quarter_view%29_%28pre-facelift%29.jpg/960px-2019_Tata_Tiago_XZ_%28front_three-quarter_view%29_%28pre-facelift%29.jpg', 1400.00, 'AVAILABLE'),
('SUV', 'Tata', 'Punch', 'MH12UV5566', 'Compact Indian SUV suited to city drives and weekend trips.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/2021_Tata_Punch_Creative_%28India%29_front_view_01.png/960px-2021_Tata_Punch_Creative_%28India%29_front_view_01.png', 1800.00, 'AVAILABLE'),
('Scooter', 'TVS', 'Jupiter 125', 'MH12WX7788', 'Comfortable Indian family scooter with practical storage and smooth ride.', 'https://upload.wikimedia.org/wikipedia/commons/9/9c/TVS_Jupiter.jpg', 550.00, 'AVAILABLE'),
('Scooter', 'Honda', 'Activa 6G', 'MH12YZ9900', 'Reliable, fuel-efficient scooter ideal for everyday city travel.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Honda_Activa_6G.jpg/960px-Honda_Activa_6G.jpg', 550.00, 'AVAILABLE'),
('Scooter', 'Hero', 'Xoom 110', 'MH12AB1010', 'Lightweight Indian scooter with nimble handling for city commutes.', 'https://www.heromotocorp.com/en-in/scooters/media_178af83635bc5bcf33f74fccc40f85f953bdb1048.jpg?width=750&format=jpg&optimize=medium', 500.00, 'AVAILABLE'),
('Bike', 'Bajaj', 'Pulsar N160', 'MH12CD2020', 'Indian street bike with confident performance for city and highway rides.', 'https://cdn.bajajauto.com/assets/pulsar-n160/desktop/pulsar-n160-desktop-gallary1.webp', 800.00, 'AVAILABLE'),
('Bike', 'TVS', 'Apache RTR 160 4V', 'MH12EF3030', 'Sporty Indian motorcycle with responsive handling and strong pickup.', 'https://www.tvsmotor.com/tvs-apache/-/media/ApacheRTRSeries/Apache-Series/TVS-Apache-Series-Home-Page_160-4v_Apache-Series-600x480-copy.webp', 800.00, 'AVAILABLE'),
('Bike', 'Hero', 'Xtreme 160R', 'MH12GH4040', 'Lightweight Indian street bike built for agile everyday riding.', 'https://www.heromotocorp.com/content/dam/hero-commerce/in/en/products/performance/content-fragments/xtreme-160r-4v/assets/banner/xtreme-160r-4v-mob.jpg', 750.00, 'AVAILABLE');
