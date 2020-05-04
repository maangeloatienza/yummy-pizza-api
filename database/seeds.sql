CREATE DATABASE IF NOT EXISTS yummy_pizza_db;

ALTER DATABASE yummy_pizza_db CHARACTER SET utf32 COLLATE utf32_general_ci;

USE yummy_pizza_db;

CREATE TABLE roles (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `updated` DATETIME DEFAULT NULL,
  `deleted` DATETIME DEFAULT NULL
);

CREATE TABLE users (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `role_id` VARCHAR(64) NULL,
  `first_name` VARCHAR(50)  NOT NULL,
  `last_name` VARCHAR(50)  NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(50)  NOT NULL,
  `password` VARCHAR(64)  NOT NULL,
  `phone_number` VARCHAR(11)  NULL,
  `created` DATETIME  NULL,
  `updated` DATETIME  NULL,
  `deleted` DATETIME  NULL
);


CREATE TABLE tokens (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `token` LONGTEXT NOT NULL,
  `created` DATETIME DEFAULT NULL
);

CREATE TABLE bookings (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `code` VARCHAR(64) NOT NULL,
  `booked_by` VARCHAR(64) NOT NULL,
  `booking_date` DATETIME NOT NULL,
  `created` DATETIME  NULL,
  `updated` DATETIME  NULL,
  `deleted` DATETIME  NULL
);


CREATE TABLE products (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL,
  `price` FLOAT NOT NULL,
  `image` VARCHAR(255) NULL,
  `availability` BOOLEAN NOT NULL DEFAULT true,
  `created` DATETIME  NULL,
  `updated` DATETIME  NULL,
  `deleted` DATETIME  NULL
);

CREATE TABLE bookingItems (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `transaction_id` VARCHAR(64) NULL,
  `user_id` VARCHAR(64) NULL,
  `guest_user` VARCHAR(64) NULL ,
  `product_id` VARCHAR(64) NOT NULL,
  `subtotal` FLOAT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `created` DATETIME  NULL,
  `updated` DATETIME  NULL,
  `deleted` DATETIME  NULL
);

CREATE TABLE transactions (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `code` VARCHAR(10) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `contact_number` VARCHAR(15) NOT NULL,
  `delivery_address` LONGTEXT NOT NULL,
  `delivery_cost` FLOAT NOT NULL,
  `total` FLOAT NOT NULL,
  `total_euro` FLOAT NOT NULL,
  `total_usd` FLOAT NOT NULL,
  `created` DATETIME  NULL,
  `updated` DATETIME  NULL,
  `deleted` DATETIME  NULL
);