-- ============================================================
-- Casmart E-Commerce Database
-- Import file ini ke Laragon via phpMyAdmin:
--   1. Buka http://localhost/phpmyadmin
--   2. Klik "Import" → pilih file ini → klik "Go"
-- ============================================================

CREATE DATABASE IF NOT EXISTS `casmart_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `casmart_db`;

-- ─── Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100)    NOT NULL,
  `email`         VARCHAR(150)    NOT NULL UNIQUE,
  `password_hash` VARCHAR(255)    NOT NULL,
  `created_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Orders ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `orders` (
  `id`                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `user_id`           INT UNSIGNED    NOT NULL,
  `midtrans_order_id` VARCHAR(100)    NOT NULL UNIQUE,
  `gross_amount_idr`  BIGINT UNSIGNED NOT NULL COMMENT 'Amount in IDR sent to Midtrans',
  `currency_display`  ENUM('IDR','USD','GBP') NOT NULL DEFAULT 'IDR',
  `status`            ENUM('pending','success','failure','expire','cancel') NOT NULL DEFAULT 'pending',
  `snap_token`        VARCHAR(255)    NULL,
  `created_at`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id`    (`user_id`),
  INDEX `idx_order_id`   (`midtrans_order_id`),
  CONSTRAINT `fk_orders_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Order Items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `order_items` (
  `id`           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `order_id`     INT UNSIGNED    NOT NULL,
  `product_id`   INT UNSIGNED    NOT NULL,
  `product_name` VARCHAR(200)    NOT NULL,
  `price_idr`    BIGINT UNSIGNED NOT NULL,
  `quantity`     SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_order_id` (`order_id`),
  CONSTRAINT `fk_items_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Demo user (password: demo1234) ─────────────────────────
-- bcrypt hash of "demo1234" with 10 rounds
INSERT IGNORE INTO `users` (`name`, `email`, `password_hash`) VALUES
  ('Demo User', 'demo@casmart.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHui');
