SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `companies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `comanyname` text NOT NULL,
  `description` text DEFAULT NULL,
  `logopath` text DEFAULT NULL,
  `coverpath` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `companies` (`comanyname`, `description`) VALUES
('Test company', 'This is the initial company to test if the application works well');

CREATE TABLE `positions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `position` text NOT NULL,
  `company_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES companies(`id`) ON DELETE CASCADE,
  UNIQUE KEY `position` (`position`,`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `positions` (`position`, `company_id`) VALUES
('Early app test user', 1),
('Central Branding Director', 1),
('Corporate Security Manager', 1),
('Future Metrics Vice President', 1),
('Future Branding Administrator', 1),
('Dynamic Resonance Manager', 1),
('Lead Markets Developer', 1),
('Human Accounts Technician', 1),
('National Tactics Planner', 1),
('Interactive Applications Architect', 1),
('Customer Applications Architect', 1),
('Legacy Applications Strategist', 1),
('Dynamic Applications Orchestrator', 1),
('Human Applications Developer', 1),
('Internal Applications Coordinator', 1);

CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `surname` text NOT NULL,
  `email` text NOT NULL,
  `profilePicture` text DEFAULT NULL,
  `coverPicture` TEXT DEFAULT NULL,
  `password` text NOT NULL,
  `company_id` int(11) NOT NULL,
  `positionId` int(11) NOT NULL,
  `registration_date` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`positionId`) REFERENCES positions(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES companies(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `done_by` int(11) NOT NULL,
  `registration_date` datetime NOT NULL DEFAULT current_timestamp(),
  `isPirmary` INT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES companies(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES user(`id`) ON DELETE CASCADE,
  UNIQUE KEY `company_id` (`company_id`,`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `superadmins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `done_by` int(11) NOT NULL,
  `registration_date` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`admin_id`) REFERENCES user(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`done_by`) REFERENCES user(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `calls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `callUniqueId` text NOT NULL,
  `initiatorId` int(11) NULL,
  `destinationId` int(11) NOT NULL,
  `destinationType` int(11) NOT NULL,
  `initialtionTime` datetime NOT NULL DEFAULT current_timestamp(),
  `endTime` datetime DEFAULT NULL,
  `callChatId` int(11) DEFAULT NULL,
  `eventId` INT DEFAULT NULL,
  `callTitle` TEXT NULL DEFAULT NULL,
   PRIMARY KEY (`id`),
   FOREIGN KEY (`initiatorId`) REFERENCES user(`id`) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `callparticipants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `callUniqueId` text NOT NULL,
  `callId` int(11) NOT NULL,
  `participantId` int(11) NOT NULL,
  `stillParticipating` int(11) NOT NULL,
  `initiatorId` int(11) NULL,
  `startDate` datetime NOT NULL DEFAULT current_timestamp(),
  `missed` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`participantId`) REFERENCES user(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`callId`) REFERENCES calls(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`initiatorId`) REFERENCES user(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `events` (
  `eventId` int(11) NOT NULL AUTO_INCREMENT,
  `ownerId` int(11) NOT NULL,
  `title` text NOT NULL,
  `eventLocation` text DEFAULT NULL,
  `context` text DEFAULT NULL,
  `activityLink` text DEFAULT NULL,
  `details` text DEFAULT NULL,
  `startTime` text NOT NULL,
  `endTime` text NOT NULL,
  `occurrence` int(11) NOT NULL,
  `recurrenceType` int(11) DEFAULT NULL,
  `startRecurrenceDate` text DEFAULT NULL,
  `endRecurrenceDate` text DEFAULT NULL,
  `type` int(11) NOT NULL,
  `oneTimeDate` text DEFAULT NULL,
  PRIMARY KEY (`eventId`),
  FOREIGN KEY (`ownerId`) REFERENCES user(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `eventparticipants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `eventId` int(11) NOT NULL,
  `participantId` int(11) NOT NULL,
  `attending` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`participantId`) REFERENCES user(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`eventId`) REFERENCES events(`eventId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `room` (
  `chatID` int(11) NOT NULL AUTO_INCREMENT,
  `name` text DEFAULT NULL,
  `type` tinyint(4) NOT NULL,
  `profilePicture` text DEFAULT NULL,
  `creationDate` datetime NOT NULL DEFAULT current_timestamp(),
  `lastActionDate` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`chatID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `participants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `roomID` int(11) NOT NULL,
  `dateGotAccess` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`userID`) REFERENCES user(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`roomID`) REFERENCES room(`chatID`) ON DELETE CASCADE,
  UNIQUE KEY `userID` (`userID`,`roomID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `roomID` int(11) NOT NULL,
  `userID` int(11) NULL,
  `timeStamp` datetime NOT NULL DEFAULT current_timestamp(),
  `action` int(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`roomID`) REFERENCES room(`chatID`) ON DELETE CASCADE,
  FOREIGN KEY (`userID`) REFERENCES user(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `messagetags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `messageId` int(11) NOT NULL,
  `tagMessageId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`messageId`) REFERENCES message(`id`),
  FOREIGN KEY (`tagMessageId`) REFERENCES message(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `reactionoptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `icon` text NOT NULL,
  `name` text NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `reactionoptions` (`icon`, `name`, `description`) VALUES
('👍', 'Like', NULL),
('😂', 'Laugh', NULL),
('😲', 'Wow', NULL),
('😨', 'Afraid', NULL),
('😠', 'Angry', NULL),
('❤️', 'Love', NULL);

CREATE TABLE `reactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `messageID` int(11) NOT NULL,
  `reactionOptionID` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userID` (`userID`,`messageID`),
  FOREIGN KEY (`userID`) REFERENCES user(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`messageID`) REFERENCES message(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reactionOptionID`) REFERENCES reactionoptions(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;