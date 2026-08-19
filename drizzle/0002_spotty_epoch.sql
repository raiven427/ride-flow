CREATE TABLE `rideflow_fare_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`city` varchar(96) NOT NULL,
	`baseFareKsh` int NOT NULL,
	`distanceRateKshPerKm` int NOT NULL,
	`timeRateKshPerMinute` int NOT NULL,
	`minimumFareKsh` int NOT NULL,
	`safetyFeeKsh` int NOT NULL,
	`platformCommissionBps` int NOT NULL DEFAULT 500,
	`active` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rideflow_fare_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `rideflow_fare_rules_city_unique` UNIQUE(`city`)
);
