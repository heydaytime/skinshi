CREATE TABLE `bets` (
	`steam_id` text NOT NULL,
	`market_id` text NOT NULL,
	`market_outcome` integer NOT NULL,
	`buy_in` text NOT NULL,
	`payout` text DEFAULT null,
	`payout_cases` integer,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`resolved_at` integer,
	PRIMARY KEY(`steam_id`, `market_id`),
	FOREIGN KEY (`steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`market_id`) REFERENCES `markets`(`slug_and_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`slug_and_id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`outcome` integer,
	`total_pool_yes` integer DEFAULT 0 NOT NULL,
	`total_pool_no` integer DEFAULT 0 NOT NULL,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`steam_id` text PRIMARY KEY NOT NULL,
	`firebase_uid` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_firebase_uid_unique` ON `users` (`firebase_uid`);