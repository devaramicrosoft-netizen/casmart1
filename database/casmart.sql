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
  `role`          ENUM('user','admin') NOT NULL DEFAULT 'user',
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
INSERT IGNORE INTO `users` (`name`, `email`, `password_hash`, `role`) VALUES
  ('Demo User', 'demo@casmart.com', '$2b$10$MMMTlSsdi2ZFGt/hp.nKjuw1pPCSPGNNT.TVFQ1YiFGn7tcKNVOLG', 'admin');

-- ─── Products ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `products` (
  `id`             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(200)    NOT NULL,
  `price`          DECIMAL(10, 2)  NOT NULL,
  `original_price` DECIMAL(10, 2)  NULL,
  `image`          VARCHAR(255)    NOT NULL,
  `badge_label`    VARCHAR(50)     NULL,
  `badge_color`    VARCHAR(50)     NULL,
  `categories`     JSON            NOT NULL,
  `tags`           JSON            NOT NULL,
  `created_at`     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `products` (`id`, `name`, `price`, `original_price`, `image`, `badge_label`, `badge_color`, `categories`, `tags`) VALUES
(1, 'Varsi Leather Bag', 48.75, 65.00, '/assets/images/product-1.jpg', '-25%', 'red', '["best-seller", "hot-collection"]', '["bag", "leather"]'),
(2, 'Fit Twill Shirt for Woman', 62.00, NULL, '/assets/images/product-2.jpg', 'New', 'green', '["new-arrival"]', '["shirt", "woman"]'),
(3, 'Grand Atlantic Chukka Boots', 32.00, NULL, '/assets/images/product-3.jpg', NULL, NULL, '["best-seller"]', '["boots", "shoes"]'),
(4, 'Women''s Faux-Trim Shirt', 84.00, NULL, '/assets/images/product-4.jpg', NULL, NULL, '["hot-collection", "trendy"]', '["shirt", "woman"]'),
(5, 'Soft Touch Interlock Polo', 45.00, NULL, '/assets/images/product-5.jpg', NULL, NULL, '["trendy"]', '["polo", "shirt"]'),
(6, 'Casmart Smart Watch', 30.00, 38.00, '/assets/images/product-6.jpg', NULL, NULL, '["best-seller", "trendy"]', '["watch", "accessories"]'),
(7, 'Casmart Smart Glass', 25.00, 39.00, '/assets/images/product-7.jpg', NULL, NULL, '["hot-collection"]', '["glasses", "accessories"]'),
(8, 'Cotton Shirt for Men', 85.00, 99.00, '/assets/images/product-8.jpg', NULL, NULL, '["best-seller"]', '["shirt", "men"]'),
(9, 'Double-breasted Blazer', 32.00, NULL, '/assets/images/product-9.jpg', NULL, NULL, '["trendy", "hot-collection"]', '["blazer", "men"]'),
(10, 'Ribbed Cotton Bodysuits', 71.00, NULL, '/assets/images/product-10.jpg', 'New', 'green', '["new-arrival", "trendy"]', '["bodysuit", "woman"]');
