CREATE TABLE `userListPins` (
	`userId` text NOT NULL,
	`listId` text NOT NULL,
	`pinnedAt` integer NOT NULL,
	PRIMARY KEY(`userId`, `listId`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`listId`) REFERENCES `bookmarkLists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `userListPins_userId_pinnedAt_idx` ON `userListPins` (`userId`,`pinnedAt`);