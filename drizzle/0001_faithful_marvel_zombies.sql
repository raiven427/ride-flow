CREATE TABLE `rideflow_fare_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riderUserId` int NOT NULL,
	`originLabel` varchar(255) NOT NULL,
	`destinationLabel` varchar(255) NOT NULL,
	`distanceMeters` int NOT NULL,
	`durationSeconds` int NOT NULL,
	`baseFareKsh` int NOT NULL,
	`distanceFareKsh` int NOT NULL,
	`timeFareKsh` int NOT NULL,
	`safetyFeeKsh` int NOT NULL,
	`subtotalKsh` int NOT NULL,
	`platformCommissionKsh` int NOT NULL,
	`riderTotalKsh` int NOT NULL,
	`driverEarningsKsh` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'KES',
	`status` enum('quoted','accepted','completed','cancelled') NOT NULL DEFAULT 'quoted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `rideflow_fare_quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rideflow_ledger_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`userId` int NOT NULL,
	`entryType` enum('rider_charge','driver_earning','platform_commission','refund','tip','payout') NOT NULL,
	`amountKsh` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'KES',
	`description` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rideflow_ledger_entries_id` PRIMARY KEY(`id`)
);
