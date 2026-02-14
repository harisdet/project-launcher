CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`address` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobNumber` varchar(20) NOT NULL,
	`vehicleId` int NOT NULL,
	`customerId` int NOT NULL,
	`status` enum('open','in-progress','completed','invoiced','cancelled') NOT NULL DEFAULT 'open',
	`description` text,
	`odometerReading` int,
	`estimatedTotal` decimal(10,2) DEFAULT '0.00',
	`totalLabor` decimal(10,2) DEFAULT '0.00',
	`totalParts` decimal(10,2) DEFAULT '0.00',
	`grandTotal` decimal(10,2) DEFAULT '0.00',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `jobCards_id` PRIMARY KEY(`id`),
	CONSTRAINT `jobCards_jobNumber_unique` UNIQUE(`jobNumber`)
);
--> statement-breakpoint
CREATE TABLE `parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobCardId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`partNumber` varchar(100),
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`customerId` int NOT NULL,
	`jobCardId` int,
	`reminderType` varchar(100) NOT NULL,
	`dueDate` bigint NOT NULL,
	`message` text,
	`status` enum('pending','sent','dismissed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobCardId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`laborCharge` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `serviceItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`registrationNumber` varchar(20) NOT NULL,
	`vehicleType` enum('2-wheeler','4-wheeler') NOT NULL,
	`make` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`year` int,
	`color` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
