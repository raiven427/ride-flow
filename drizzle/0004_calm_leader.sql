CREATE TABLE `rideflow_activity_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`eventType` varchar(96) NOT NULL,
	`summary` varchar(255) NOT NULL,
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rideflow_activity_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rideflow_presence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('online','away','offline') NOT NULL DEFAULT 'online',
	`currentView` varchar(96),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rideflow_presence_id` PRIMARY KEY(`id`),
	CONSTRAINT `rideflow_presence_userId_unique` UNIQUE(`userId`)
);
