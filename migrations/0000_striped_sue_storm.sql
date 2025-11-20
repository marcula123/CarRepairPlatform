CREATE TABLE `cars` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reg_nr` text NOT NULL,
	`make` text NOT NULL,
	`model` text NOT NULL,
	`year` integer NOT NULL,
	`color` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cars_reg_nr_unique` ON `cars` (`reg_nr`);--> statement-breakpoint
CREATE TABLE `task_suggestions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`car_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` integer,
	FOREIGN KEY (`car_id`) REFERENCES `cars`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`car_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`suggestion_id` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`car_id`) REFERENCES `cars`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`suggestion_id`) REFERENCES `task_suggestions`(`id`) ON UPDATE no action ON DELETE no action
);
