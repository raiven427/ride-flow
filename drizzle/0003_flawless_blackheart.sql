CREATE TABLE `rideflow_admin_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`singletonKey` varchar(32) NOT NULL,
	`ownerEmail` varchar(320) NOT NULL,
	`notificationEmail` varchar(320) NOT NULL,
	`updatedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rideflow_admin_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `rideflow_admin_settings_singletonKey_unique` UNIQUE(`singletonKey`)
);
