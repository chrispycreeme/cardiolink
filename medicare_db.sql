-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 11, 2025 at 12:33 AM
-- Server version: 8.0.36
-- PHP Version: 8.2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `medicare_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` int NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `identification_code` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `full_name`, `identification_code`, `password`, `created_at`) VALUES
(1, 'Dr. Andrei Banlor', 'DR-ANDREI-01', '$2y$10$siirlt67.7qv7f0R2dQV7OjrDVH//QhzT.LalW5g.9QVoaitMMpLS', '2025-06-10 22:17:20');

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `patient_name` varchar(255) NOT NULL,
  `age_category` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Normal',
  `registered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `doctor_id`, `patient_name`, `age_category`, `status`, `registered_at`) VALUES
(1, 1, 'Jeter Kenzi T. Corpus', 'Senior', 'Normal', '2025-06-10 22:17:20'),
(2, 1, 'Lei Serving', 'Adult', 'Normal', '2025-06-10 22:17:20'),
(3, 1, 'Kenzi Tatlonghari', 'Pediatric', 'Normal', '2025-06-10 22:17:20');

-- --------------------------------------------------------

--
-- Table structure for table `vitals`
--

CREATE TABLE `vitals` (
  `id` int NOT NULL,
  `patient_id` int NOT NULL,
  `heart_rate` int DEFAULT NULL,
  `oxygen_level` int DEFAULT NULL,
  `body_temperature` decimal(5,2) DEFAULT NULL,
  `recorded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `vitals`
--

INSERT INTO `vitals` (`id`, `patient_id`, `heart_rate`, `oxygen_level`, `body_temperature`, `recorded_at`) VALUES
(1, 1, 80, 98, 36.50, '2024-05-01 10:00:00'),
(2, 1, 82, 97, 36.70, '2024-05-08 11:00:00'),
(3, 1, 78, 99, 36.20, '2024-05-15 09:30:00'),
(4, 1, 85, 96, 37.00, '2024-05-22 14:00:00'),
(5, 1, 81, 98, 36.80, '2024-05-29 10:00:00'),
(6, 1, 88, 95, 37.50, '2024-06-05 12:00:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `identification_code` (`identification_code`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fkey_doctor` (`doctor_id`);

--
-- Indexes for table `vitals`
--
ALTER TABLE `vitals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vitals`
--
ALTER TABLE `vitals`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `fkey_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vitals`
--
ALTER TABLE `vitals`
  ADD CONSTRAINT `vitals_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
