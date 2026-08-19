CREATE TABLE `rideflow_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`purpose` enum('profile_photo','driver_license','insurance','vehicle_document','lost_item') NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`byteSize` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(768) NOT NULL,
	`reviewStatus` enum('not_required','pending','approved','rejected') NOT NULL DEFAULT 'not_required',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rideflow_files_id` PRIMARY KEY(`id`),
	CONSTRAINT `rideflow_files_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
CREATE TABLE `rideflow_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('customer','driver') NOT NULL DEFAULT 'customer',
	`phone` varchar(32),
	`profilePhotoFileId` int,
	`licenseNumber` varchar(96),
	`vehicleInfo` text,
	`insurancePolicy` varchar(128),
	`driverVerificationStatus` enum('not_started','pending','approved','rejected') NOT NULL DEFAULT 'not_started',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rideflow_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `rideflow_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
