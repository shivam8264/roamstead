CREATE DATABASE IF NOT EXISTS roamstead CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'roamstead_app'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON roamstead.* TO 'roamstead_app'@'localhost';
FLUSH PRIVILEGES;
