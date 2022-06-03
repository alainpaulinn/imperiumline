SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `companies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `comanyname` text NOT NULL,
  `description` text DEFAULT NULL,
  `logopath` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `companies` (`comanyname`, `description`) VALUES
('Test company', 'This is the initial company to test if the application works well')

CREATE TABLE `positions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `position` text NOT NULL,
   PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `positions` (`position`) VALUES
('Early app test user'),
('Central Branding Director'),
('Corporate Security Manager'),
('Future Metrics Vice President'),
('Future Branding Administrator'),
('Dynamic Resonance Manager'),
('Lead Markets Developer'),
('Human Accounts Technician'),
('National Tactics Planner'),
('Interactive Applications Architect'),
('Customer Applications Architect'),
('Legacy Applications Strategist'),
('Dynamic Applications Orchestrator'),
('Human Applications Developer'),
('Internal Applications Coordinator');

CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `surname` text NOT NULL,
  `email` text NOT NULL,
  `profilePicture` text DEFAULT NULL,
  `password` text NOT NULL,
  `company_id` int(11) NOT NULL,
  `positionId` int(11) NOT NULL,
  `registration_date` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`positionId`) REFERENCES positions(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES companies(`id`) ON DELETE CASCADE
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
  `eventLocation` text NOT NULL,
  `context` text NOT NULL,
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
  FOREIGN KEY (`participantId`) REFERENCES user(`id`) ON DELETE CASCADE
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

CREATE TABLE `message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `roomID` int(11) NOT NULL,
  `userID` int(11) NULL,
  `timeStamp` datetime NOT NULL DEFAULT current_timestamp(),
  `action` int(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`roomID`) REFERENCES room(`chatID`) ON DELETE CASCADE,
  FOREIGN KEY (`userID`) REFERENCES user(`id`) ON DELETE SET NULL
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