-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 21, 2022 at 12:46 AM
-- Server version: 10.4.22-MariaDB
-- PHP Version: 8.1.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `multixx`
--

-- --------------------------------------------------------

--
-- Table structure for table `callparticipants`
--

CREATE TABLE `callparticipants` (
  `id` int(11) NOT NULL,
  `callId` int(11) NOT NULL,
  `participantId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `calls`
--

CREATE TABLE `calls` (
  `id` int(11) NOT NULL,
  `callUniqueId` text NOT NULL,
  `initiatorId` int(11) NOT NULL,
  `destinationId` int(11) NOT NULL,
  `destinationType` int(11) NOT NULL,
  `initialtionTime` int(11) NOT NULL DEFAULT current_timestamp(),
  `endTime` int(11) NOT NULL,
  `callChatId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `message`
--

CREATE TABLE `message` (
  `id` int(11) NOT NULL,
  `message` text NOT NULL,
  `roomID` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `timeStamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `message`
--

INSERT INTO `message` (`id`, `message`, `roomID`, `userID`, `timeStamp`) VALUES
(1, 'Hellowww', 1, 1, '2022-01-07 10:34:01'),
(2, 'Protocol ID:	d77491a7-a681-4b6c-8c6a-12f91264f6d1protocol\nError Pattern Title:	LIDL FR: Imprimante Backoffice\nSnapshot version:	15335\nSearch term:	impriamnte bo\n\nAnswered questions:\n	 \n1. Quelle est le type d\'imprimante?	-> HP\n2. Quel est le dysfonctionnement?	-> Matériel, (Hardware)\n\nSolutions:\n	 \n1. Faire une demande d\'intervention sur le site HP	successful', 1, 1, '2022-01-07 12:15:21'),
(3, 'again?', 1, 1, '2022-01-07 12:43:07'),
(4, 'okay', 2, 3, '2022-01-07 14:08:16'),
(5, 'again', 2, 3, '2022-01-07 14:08:33'),
(6, 'encore?', 2, 3, '2022-01-07 14:12:47'),
(7, 'here we go', 2, 1, '2022-01-07 14:14:36'),
(8, 'my message again', 2, 1, '2022-01-07 14:29:03'),
(9, 'ok', 2, 1, '2022-01-07 14:29:26'),
(10, 'and she knows', 2, 1, '2022-01-07 14:54:05'),
(11, 'ohhhh', 2, 3, '2022-01-07 15:00:11'),
(12, 'does she know?', 2, 3, '2022-01-07 15:00:19'),
(13, 'yeahh', 2, 1, '2022-01-07 15:00:27'),
(14, 'she nkows well', 2, 1, '2022-01-07 15:00:33'),
(15, 'ok', 2, 3, '2022-01-07 15:01:21'),
(16, 'once again', 2, 3, '2022-01-07 15:01:44'),
(17, 'o mukwano', 2, 1, '2022-01-07 15:01:58'),
(18, 'weekdndi', 1, 1, '2022-01-07 15:02:14'),
(19, 'wow it is working', 1, 1, '2022-01-07 15:02:36'),
(20, 'ugire umunsi mwiza', 4, 3, '2022-01-07 15:08:49'),
(21, 'ijwi shahh', 4, 3, '2022-01-07 15:09:16'),
(22, 'Salama', 1, 2, '2022-01-08 00:22:39'),
(23, 'ok', 1, 2, '2022-01-08 00:23:11'),
(24, 'yo', 4, 2, '2022-01-08 00:24:38'),
(25, 'okie', 4, 2, '2022-01-08 02:10:41'),
(26, 'oki', 5, 4, '2022-01-08 10:18:56'),
(27, 'Hii', 5, 4, '2022-01-08 11:01:38'),
(28, 'are you okay?', 5, 4, '2022-01-08 11:01:55'),
(29, 'hahahaha', 6, 4, '2022-01-08 11:02:14'),
(30, 'once again', 5, 4, '2022-01-08 11:05:10'),
(31, 'jsfsdf', 6, 4, '2022-01-08 15:31:25'),
(32, 'ksdjfdnjsfkjsnd', 6, 4, '2022-01-08 15:31:49'),
(33, 'HI', 7, 4, '2022-01-08 23:49:14'),
(34, 'hahahah', 7, 4, '2022-01-08 23:49:58'),
(35, 'HeyLoooo', 8, 4, '2022-01-09 00:23:08'),
(36, 'jweccwc', 7, 4, '2022-01-09 00:49:19'),
(37, 'lk', 7, 4, '2022-01-09 00:49:22'),
(38, 'jjnolnk', 7, 1, '2022-01-09 00:49:47'),
(39, 'jere', 7, 4, '2022-01-09 00:51:04'),
(40, 'e e', 7, 1, '2022-01-09 00:51:10'),
(41, 'kstst', 7, 4, '2022-01-09 00:51:24'),
(42, 'ijii', 7, 1, '2022-01-09 00:51:30'),
(43, 'yo', 9, 5, '2022-01-09 00:54:58'),
(44, 'salaama', 9, 5, '2022-01-09 00:55:24'),
(45, 'hi man', 10, 5, '2022-01-09 01:22:21'),
(46, 'salama', 9, 1, '2022-01-10 12:11:23'),
(47, 'umeze fresh se>?', 9, 1, '2022-01-10 12:11:32'),
(48, 'mwana ibintu byarakomeye', 9, 1, '2022-01-10 12:11:40'),
(49, 'igo se?', 9, 5, '2022-01-10 12:11:45'),
(50, 'koko byarakomeye?', 9, 5, '2022-01-10 12:11:56'),
(51, 'igo mwan', 9, 1, '2022-01-10 12:12:04'),
(52, 'okay', 9, 5, '2022-01-10 12:12:56'),
(53, 'test', 11, 5, '2022-01-10 12:53:32'),
(54, 'hi man', 11, 5, '2022-01-10 20:05:23'),
(55, 'good', 11, 5, '2022-01-10 20:05:29'),
(56, 'my first testt', 12, 6, '2022-01-10 20:08:43'),
(57, 'mesage 1 array test', 13, 6, '2022-01-10 20:18:09'),
(58, 'again?', 13, 6, '2022-01-10 20:18:24'),
(59, 'heheee', 14, 6, '2022-01-10 20:37:44'),
(60, 'lets goo', 15, 6, '2022-01-10 20:59:12'),
(61, 'previously wasted', 16, 6, '2022-01-10 21:06:27'),
(62, 'heyyy', 16, 6, '2022-01-10 21:06:35'),
(63, 'hi', 16, 1, '2022-01-10 21:06:40'),
(64, 'how are you?', 16, 1, '2022-01-10 21:06:47'),
(65, 'i am fine my dear', 16, 6, '2022-01-10 21:06:55'),
(66, 'i can see it is finally working', 16, 1, '2022-01-10 21:07:06'),
(67, 'hahahah', 7, 1, '2022-01-10 21:45:53'),
(68, 'bava  kure', 7, 1, '2022-01-10 21:45:57'),
(69, 'hhh', 1, 1, '2022-01-10 21:47:15'),
(70, 'hello', 7, 1, '2022-01-10 23:46:11'),
(71, 'iuyhjko987ytghho909oikj0-98yufghiokjhgft6789ikjhgyt679iokljbgt6790opkljhgyt679oikjh  bn vg7h8injh gvghjni j ghjni jb yghj9ni jb gvyg7jmk b gvyghkmok b gvyg7uikomk  fcfymkbvdrenb vghn j vghjmk  vguik,  ftyuikm cfrt678okm vgyuikjiijhoijbg9olm cfm  bhuo,m  gy9ol,  bhu90pl,  ghyu890-;l,m cdr678olkmnbgt789okjbvftolmftyuiol,  vgyui jn jn ikm jikm km  uiolm cft790olkmnbvfr59oknvcsw4589knbvft678okm m in bhu90plkmnbvcxse49', 1, 1, '2022-01-11 01:18:22'),
(72, 'ok', 16, 1, '2022-01-11 07:20:29'),
(73, 'okkkk', 16, 1, '2022-01-11 07:20:46'),
(74, 'Test', 16, 1, '2022-01-11 07:24:53'),
(75, 'Sallalallalallala', 7, 1, '2022-01-12 10:23:20'),
(76, 'hello', 1, 2, '2022-01-12 16:03:19'),
(77, 'okayyyy', 16, 1, '2022-01-12 20:38:42'),
(78, 'njonogooo', 16, 1, '2022-01-12 20:38:47'),
(79, 'oh  ma head njonogi', 16, 1, '2022-01-12 20:38:57'),
(80, 'ntuziko dutaha kare', 16, 1, '2022-01-12 20:39:18'),
(81, 'Yo man', 4, 3, '2022-01-12 23:57:25'),
(82, 'why don\'t you send messages?', 4, 3, '2022-01-12 23:57:34'),
(83, 'we have missed you!', 4, 3, '2022-01-12 23:57:41'),
(84, 'I am the one who does not send 🤦‍♀️🤦‍♀️🤦‍♀️', 14, 3, '2022-01-12 23:58:06'),
(85, 'roteti', 1, 2, '2022-01-15 20:29:58'),
(86, 'so bebi reset', 1, 2, '2022-01-15 20:30:06'),
(87, 'njahala mind tru riseti', 1, 2, '2022-01-15 20:30:16'),
(88, 'so bebi reseti', 1, 2, '2022-01-22 11:39:56'),
(89, 'itsa wikendi', 1, 1, '2022-01-22 11:40:11'),
(90, 'roteti', 1, 1, '2022-01-22 11:40:15'),
(91, 'hahahhahahahahahaa', 1, 1, '2022-01-22 11:40:19'),
(92, 'guys', 1, 2, '2022-01-22 11:40:22'),
(93, 'see/?', 1, 2, '2022-01-22 11:40:24'),
(94, 'solooooooooooooooooooooooooooooooo', 7, 1, '2022-01-23 13:10:51'),
(95, 'hahaha', 14, 6, '2022-01-23 21:00:24'),
(96, 'you are!!', 14, 6, '2022-01-23 21:00:31'),
(97, 'uri', 16, 6, '2022-01-23 22:41:25'),
(98, 'ndiho', 12, 6, '2022-01-23 23:11:34'),
(99, 'hhhhhhhah', 16, 6, '2022-01-24 00:28:29'),
(100, 'goooo', 16, 6, '2022-01-24 00:28:59'),
(101, 'jooooo', 12, 6, '2022-01-24 00:29:16'),
(102, 'ok', 12, 6, '2022-01-24 00:30:16'),
(103, 'haa', 16, 6, '2022-01-24 00:42:12'),
(104, 'ok', 17, 7, '2022-01-24 09:03:41'),
(105, 'koko', 17, 7, '2022-01-24 09:03:52'),
(106, 'Hiiii', 20, 7, '2022-01-24 12:33:12'),
(107, 'hi', 16, 1, '2022-01-25 22:54:07'),
(108, 'how', 16, 1, '2022-01-25 22:55:42'),
(109, 'hi', 9, 1, '2022-01-25 23:03:04'),
(110, 'are you crazy?', 9, 1, '2022-01-25 23:03:18'),
(111, 'nope', 9, 5, '2022-01-25 23:03:57'),
(112, 'are you?', 9, 5, '2022-01-25 23:04:02'),
(113, 'Yesssss', 9, 1, '2022-01-25 23:04:07'),
(114, 'me i am foolish', 9, 1, '2022-01-25 23:04:12'),
(115, 'really foolish', 9, 1, '2022-01-25 23:04:18'),
(116, 'hahahahhaha', 9, 1, '2022-01-25 23:04:22'),
(117, 'oya', 9, 1, '2022-01-25 23:08:59'),
(118, 'oya', 9, 1, '2022-01-25 23:09:01'),
(119, 'sonatahiraho', 9, 1, '2022-01-25 23:09:04'),
(120, 'Hello wveryone?', 1, 4, '2022-01-25 23:10:49'),
(121, 'hello', 1, 4, '2022-01-25 23:12:52'),
(122, 'how are you doing guys?', 1, 4, '2022-01-25 23:13:03'),
(123, '?', 1, 4, '2022-01-25 23:14:23'),
(124, 'ok', 7, 1, '2022-01-26 01:04:46'),
(125, 'we are fine', 1, 2, '2022-01-26 01:07:42'),
(126, 'How about you?', 1, 2, '2022-01-26 01:07:51'),
(127, 'yeahh', 4, 2, '2022-01-26 01:08:01'),
(128, 'sure', 4, 2, '2022-01-26 01:08:02'),
(129, 'i missed you too', 4, 2, '2022-01-26 01:08:07'),
(130, 'yeahh', 15, 2, '2022-01-26 01:08:14'),
(131, 'let\'s goo', 15, 2, '2022-01-26 01:08:18'),
(132, 'hie', 21, 2, '2022-01-26 01:09:10'),
(133, 'againnn', 22, 2, '2022-01-26 01:09:17'),
(134, 'heylooow', 18, 7, '2022-01-26 15:17:26'),
(135, 'hooooo', 18, 7, '2022-01-26 15:17:59'),
(136, 'heyyy', 44, 7, '2022-01-26 15:38:58'),
(137, 'salaama', 20, 7, '2022-01-26 15:39:25'),
(138, 'should send to test 4', 20, 7, '2022-01-26 15:41:17'),
(139, 'is itokay now?', 20, 7, '2022-01-26 15:47:51'),
(140, 'Yessss', 20, 3, '2022-01-26 15:48:57'),
(141, 'ohh', 4, 3, '2022-01-26 15:50:28'),
(142, 'that', 4, 3, '2022-01-26 15:50:29'),
(143, 'crazyyyyy', 4, 3, '2022-01-26 15:50:36'),
(144, 'Hellow <div class=\"message-sent-text\">why don\'t you send messages?</div>', 4, 3, '2022-01-26 15:59:02'),
(145, 'okieeer', 1, 3, '2022-01-26 20:24:58'),
(146, 'kskskkso', 12, 6, '2022-01-27 15:50:47'),
(147, 'afdjfs', 12, 6, '2022-01-27 15:55:47'),
(148, 'sdfsdf', 12, 6, '2022-01-27 15:55:48'),
(149, 'sdf', 12, 6, '2022-01-27 15:55:48'),
(150, 'g', 12, 6, '2022-01-27 15:55:49'),
(151, 'dfhd', 12, 6, '2022-01-27 15:55:49'),
(152, 'sss', 12, 6, '2022-01-27 15:55:50'),
(153, 'sfgdfgdhdhdh', 12, 6, '2022-01-27 15:55:52'),
(154, 'sdfsdg', 12, 6, '2022-01-27 15:55:54'),
(155, 'Hie man', 21, 1, '2022-01-30 12:18:27'),
(156, 'how are tou?', 21, 1, '2022-01-30 12:18:31'),
(157, 'why does it look so simple?', 1, 1, '2022-01-30 12:49:49'),
(158, 'I duno why', 1, 1, '2022-01-30 12:50:02'),
(159, 'let us keep in touch', 9, 1, '2022-01-30 15:29:05'),
(160, 'okie', 9, 1, '2022-01-30 16:04:46'),
(161, 'ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 16, 6, '2022-01-30 16:22:22'),
(162, 'Hie man', 45, 8, '2022-01-30 18:04:41'),
(163, 'I am new here', 45, 8, '2022-01-30 18:04:45'),
(164, 'Hi', 45, 7, '2022-01-30 18:05:43'),
(165, 'Umeze neza se?', 45, 7, '2022-01-30 18:06:02'),
(166, 'welcome', 45, 7, '2022-01-30 18:06:05'),
(167, 'Hi man', 46, 8, '2022-01-30 18:06:47'),
(168, 'How are tou doing', 46, 8, '2022-01-30 18:06:57'),
(169, 'Hie man', 47, 8, '2022-01-30 18:07:47'),
(170, 'How is it going?', 47, 8, '2022-01-30 18:07:56'),
(171, 'Heylooo', 1, 1, '2022-01-30 18:35:44'),
(172, 'revamped', 1, 3, '2022-01-31 18:48:59'),
(173, 'this is competely going fine', 4, 3, '2022-02-01 00:36:05'),
(174, 'Hiiii', 46, 1, '2022-02-01 00:47:21'),
(175, 'Salaam ', 46, 1, '2022-02-01 00:48:03'),
(176, 'Salaam yewe', 46, 1, '2022-02-01 00:48:31'),
(177, 'Biracamo?', 46, 1, '2022-02-01 00:48:44'),
(178, 'Hiiierrr', 46, 1, '2022-02-01 08:05:03'),
(179, 'YeAhhh rev.', 1, 1, '2022-02-01 08:05:39'),
(180, 'hhhhhhhah\n😨\ngoooo\nhaa\n👍\n😠\n00:42:12\n👍\n😂\n😲\n😨\n😠\n❤️', 16, 1, '2022-02-01 09:47:25'),
(181, 'Hello', 9, 1, '2022-02-01 23:15:27'),
(182, 'h', 9, 1, '2022-02-01 23:30:33'),
(183, 'jvjhgfjhgcj', 16, 1, '2022-02-02 17:03:53'),
(184, 'ygfxcghjmn', 16, 1, '2022-02-02 17:04:12'),
(185, 'hjbk', 16, 1, '2022-02-02 17:04:14'),
(186, 'ok', 24, 1, '2022-02-02 18:02:35'),
(187, 'What do you mean?', 21, 1, '2022-02-02 22:41:50'),
(188, 'jhgzsdkjlkjhsnmdoicskjhnmdciosuhjnd', 9, 1, '2022-02-02 23:09:01'),
(189, 'ytghhjkoyughnkoiujh', 9, 1, '2022-02-02 23:09:07'),
(190, 'uyghjoiuhj', 9, 1, '2022-02-02 23:09:11'),
(191, 'siuyhgjsiodk\nSdfsdfs', 9, 1, '2022-02-02 23:09:17'),
(192, 'ygfvbiuyghkjsd\nSDfsdf\n\nSdfs4', 9, 1, '2022-02-02 23:09:26'),
(193, 'sdfsgeece', 9, 1, '2022-02-02 23:09:34'),
(194, 'Good for you', 45, 7, '2022-02-03 07:08:16'),
(195, 'kjkjkj', 20, 7, '2022-02-03 07:11:09'),
(196, 'okay', 20, 7, '2022-02-03 07:18:37'),
(197, 'hello', 45, 7, '2022-02-03 07:20:41'),
(198, 'egooooooooo', 20, 7, '2022-02-03 07:22:58'),
(199, 'oki', 45, 7, '2022-02-03 07:24:10'),
(200, 'oki again', 45, 7, '2022-02-03 07:28:58'),
(201, 'test', 9, 1, '2022-02-03 07:38:02'),
(202, 'quickckeck', 1, 1, '2022-02-03 07:39:51'),
(203, 'ok', 1, 1, '2022-02-03 07:43:09'),
(204, 'and here', 45, 7, '2022-02-03 07:46:10'),
(205, 'okie', 45, 7, '2022-02-03 09:38:36'),
(206, 'hello', 45, 7, '2022-02-03 09:44:55'),
(207, 'bawww', 45, 7, '2022-02-03 09:45:30'),
(208, 'ok', 45, 7, '2022-02-03 09:46:01'),
(209, 'Hi, How are you?', 45, 7, '2022-02-03 09:50:09'),
(210, 'Hi', 45, 7, '2022-02-03 12:13:52'),
(211, 'Hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii', 44, 7, '2022-02-03 13:09:51'),
(212, 'okau', 20, 7, '2022-02-03 13:15:49'),
(213, 'I am still testing', 20, 7, '2022-02-03 13:35:55'),
(214, 'uytredscvoiuytrdcvbnmjkloiuytrfdcvbmkl;oiuytfdcl;op876ytresxcvbnkl[poiuytrfdcxv\ndsxcvbnkliouytrfdcvbh', 17, 7, '2022-02-03 13:52:16'),
(215, 'jtdhgfdhgfd\nhgfghfxh\ngfxhgfx\ngxhf\nhgfo', 17, 7, '2022-02-03 13:54:52'),
(216, 'okieeeeerrr', 17, 7, '2022-02-03 14:02:51'),
(217, 'Thank youuuuu', 45, 8, '2022-02-03 14:21:59'),
(218, 'howdy', 45, 8, '2022-02-03 16:26:04'),
(219, 'Well respond', 47, 8, '2022-02-03 17:09:53'),
(220, 'Bigggg', 46, 8, '2022-02-03 17:17:16'),
(221, 'loggggg', 46, 8, '2022-02-03 19:11:53'),
(222, 'okayyyyy', 46, 8, '2022-02-03 19:34:46'),
(223, 'checking again', 45, 8, '2022-02-03 19:41:02'),
(224, 'check now?', 45, 8, '2022-02-03 20:45:46'),
(225, 'hallo again', 45, 8, '2022-02-03 20:49:22'),
(226, 'Last hello again check again', 45, 8, '2022-02-03 23:45:23'),
(227, 'this one too?', 45, 8, '2022-02-03 23:53:40'),
(228, 'now', 47, 8, '2022-02-04 00:12:36'),
(229, 'hey', 46, 8, '2022-02-04 00:27:02'),
(230, 'Salaama', 46, 8, '2022-02-04 00:30:32'),
(231, 'then', 47, 8, '2022-02-04 00:34:02'),
(232, 'hoolaaa', 47, 8, '2022-02-04 00:34:36'),
(233, 'saaaaaalam', 46, 8, '2022-02-04 00:34:51'),
(234, 'Helloooow', 45, 8, '2022-02-04 00:40:54'),
(235, 'Fella', 46, 8, '2022-02-04 00:42:19'),
(236, 'Hiee', 46, 8, '2022-02-04 00:42:32'),
(237, 'Hieeeeee', 7, 4, '2022-02-04 00:45:13'),
(238, 'Hellowwwww', 1, 4, '2022-02-04 02:01:33'),
(239, 'Yessss', 1, 4, '2022-02-04 02:17:57'),
(240, 'Hiiiii', 1, 4, '2022-02-04 02:23:18'),
(241, 'I have never talked in this team', 1, 5, '2022-02-04 08:47:09'),
(242, 'Heeyyyynoow', 1, 5, '2022-02-04 08:47:23'),
(243, 'Yplllaaaa', 1, 5, '2022-02-04 08:47:51'),
(244, 'Woooowww\nit is working', 1, 5, '2022-02-04 08:50:08'),
(245, 'lemme try again', 1, 5, '2022-02-04 08:51:07'),
(246, 'okay', 12, 5, '2022-02-04 09:01:39'),
(247, 'Holaa', 10, 5, '2022-02-04 11:33:33'),
(248, 'Holllllllllllllllaaaaa', 10, 5, '2022-02-04 11:33:57'),
(249, 'Holla', 12, 5, '2022-02-04 11:46:58'),
(250, 'Does this work?', 44, 5, '2022-02-04 11:49:11'),
(251, 'salaama', 8, 5, '2022-02-04 11:50:11'),
(252, 'umeze ute se?', 8, 5, '2022-02-04 11:50:15'),
(253, 'really?\n\n\n seriously?', 9, 5, '2022-02-04 11:51:47'),
(254, 'Yes i works. fine', 44, 7, '2022-02-04 15:13:18'),
(255, 'ayee yeeee\n', 24, 1, '2022-02-04 19:42:33'),
(256, 'This is important', 17, 7, '2022-02-04 22:06:20'),
(257, 'Now reka turebe', 17, 7, '2022-02-04 22:06:34'),
(258, 'yeah!!\ni have noticed', 14, 3, '2022-02-04 22:07:42'),
(259, 'egokoooooo', 20, 3, '2022-02-04 22:08:19'),
(260, 'Inyungu hahahahahahahhh', 2, 1, '2022-02-04 23:28:37'),
(261, 'ok', 7, 1, '2022-02-04 23:43:04'),
(262, 'ok', 7, 1, '2022-02-04 23:51:17'),
(263, 'yeeee', 24, 2, '2022-02-05 00:02:33'),
(264, 'its a new Dayyy', 45, 8, '2022-02-06 14:21:20'),
(265, 'I am soo exited\nfor the new Day', 45, 8, '2022-02-06 14:21:44'),
(266, 'Now let\'s see', 45, 8, '2022-02-06 17:21:41'),
(267, 'GIerrrrr', 46, 8, '2022-02-06 17:21:50'),
(268, 'Yeahhh\ntry', 1, 4, '2022-02-08 22:54:09'),
(269, 'hellow', 6, 4, '2022-02-11 11:46:31'),
(270, 'Geez', 6, 4, '2022-02-11 11:46:51'),
(271, 'yess', 13, 4, '2022-02-11 11:48:35'),
(272, 'againnn!!!', 13, 4, '2022-02-11 11:48:47'),
(273, 'Array testtt', 13, 4, '2022-02-11 11:48:58'),
(274, 'yeahhhh', 7, 1, '2022-02-11 13:20:08'),
(275, 'tell', 7, 1, '2022-02-11 13:22:51'),
(276, 'olkooooooo', 6, 4, '2022-02-11 13:57:21'),
(277, 'Salaaamaa', 10, 2, '2022-02-11 14:41:54'),
(278, 'whattttt', 7, 4, '2022-02-11 15:12:35'),
(279, 'Yoo mannnn', 5, 3, '2022-02-11 16:23:58'),
(280, 'kjsdfsd', 5, 3, '2022-02-11 16:24:19'),
(281, 'ghjgjh', 5, 3, '2022-02-11 16:24:35'),
(282, 'hello', 7, 4, '2022-02-12 10:29:26'),
(283, 'Hi', 7, 4, '2022-02-12 10:29:45'),
(284, 'are tou fine?', 7, 4, '2022-02-12 10:29:52'),
(285, 'ok', 7, 4, '2022-02-12 10:30:02'),
(286, 'okay', 6, 4, '2022-02-12 10:33:59'),
(287, 'Hello team', 1, 4, '2022-02-12 10:42:39'),
(288, 'okay', 1, 4, '2022-02-12 10:43:00'),
(289, 'uygyuygyg\nokay', 13, 4, '2022-02-12 10:50:06'),
(290, 'uygyuygyg\nokay', 13, 4, '2022-02-12 10:50:17'),
(291, 'ksft', 5, 4, '2022-02-12 10:51:00'),
(292, 'ksft\nokay', 5, 4, '2022-02-12 10:51:09'),
(293, 'ksft', 5, 4, '2022-02-12 10:51:21'),
(294, 'igo se', 6, 4, '2022-02-12 10:51:54'),
(295, 'let\'s check now', 7, 4, '2022-02-12 10:52:55'),
(296, 'meka', 1, 4, '2022-02-12 10:56:22'),
(297, 'ohh', 1, 4, '2022-02-12 10:56:41'),
(298, 'yahhh', 7, 1, '2022-02-12 11:19:34'),
(299, 'I am checking', 7, 1, '2022-02-12 11:19:51'),
(300, 'hahahhaha', 7, 1, '2022-02-12 11:19:54'),
(301, 'thanks', 7, 1, '2022-02-12 11:19:56'),
(302, 'this is clearly a bug', 7, 1, '2022-02-12 11:20:13'),
(303, 'I told you Hy!', 21, 1, '2022-02-12 13:09:05'),
(304, 'okay\nso now let\'s fight', 21, 1, '2022-02-12 13:09:38'),
(305, 'once again', 21, 1, '2022-02-12 13:32:35'),
(306, 'c\'est bon', 21, 1, '2022-02-12 13:32:44'),
(307, 'Fressshhh', 8, 4, '2022-02-13 12:23:11'),
(308, 'wowe se?', 8, 4, '2022-02-13 12:23:19'),
(309, 'Test teaseeeeeeeer', 11, 3, '2022-02-14 09:43:33'),
(310, 'Download SQL Server Management Studio (SSMS)\nArticle\n12/08/2021\n7 minutes to read\n+35\nIs this page helpful?\n\nApplies to: SQL Server (all supported versions) Azure SQL Database Azure SQL Managed Instance Azure Synapse Analytics\n\nSQL Server Management Studio (SSMS) is an integrated environment for managing any SQL infrastructure, from SQL Server to Azure SQL Database. SSMS provides tools to configure, monitor, and administer instances of SQL Server and databases. Use SSMS to deploy, monitor, and upgrade the data-tier components used by your applications, and build queries and scripts.\n\nUse SSMS to query, design, and manage your databases and data warehouses, wherever they are - on your local computer, or in the cloud.\n\nDownload SSMS', 11, 3, '2022-02-15 02:06:32'),
(311, 'dfgfgd', 2, 3, '2022-02-15 09:30:24'),
(312, 'may i call you?', 7, 1, '2022-02-16 10:56:03'),
(313, 'ok', 8, 4, '2022-02-16 10:56:17'),
(314, 'i am texting youuu', 7, 1, '2022-02-16 10:56:57'),
(315, 'I am responding to tpuu', 7, 4, '2022-02-16 10:57:14'),
(316, 'hellooow', 7, 1, '2022-02-17 18:45:13'),
(317, 'elle est ma confirt zone', 11, 3, '2022-02-18 22:59:38'),
(318, 'nopppe', 5, 3, '2022-02-18 23:00:23'),
(319, 'Hi', 18, 1, '2022-02-20 17:45:20'),
(320, 'how are you???', 18, 1, '2022-02-20 17:45:32');

-- --------------------------------------------------------

--
-- Table structure for table `messagetags`
--

CREATE TABLE `messagetags` (
  `id` int(11) NOT NULL,
  `messageId` int(11) NOT NULL,
  `tagMessageId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `messagetags`
--

INSERT INTO `messagetags` (`id`, `messageId`, `tagMessageId`) VALUES
(1, 0, 204),
(2, 0, 206),
(3, 0, 225),
(4, 0, 223),
(5, 226, 225),
(6, 226, 224),
(7, 227, 226),
(8, 228, 219),
(9, 0, 170),
(10, 0, 219),
(11, 0, 169),
(12, 0, 170),
(13, 0, 174),
(14, 234, 210),
(15, 236, 174),
(16, 237, 38),
(17, 237, 40),
(18, 237, 42),
(19, 237, 68),
(20, 237, 75),
(21, 237, 94),
(22, 238, 123),
(23, 238, 126),
(24, 239, 3),
(25, 240, 238),
(26, 242, 241),
(27, 243, 1),
(28, 244, 71),
(29, 245, 71),
(30, 245, 18),
(31, 245, 2),
(32, 248, 45),
(33, 250, 211),
(34, 251, 35),
(35, 253, 114),
(36, 254, 250),
(37, 255, 186),
(38, 256, 215),
(39, 257, 214),
(40, 258, 96),
(41, 259, 198),
(42, 260, 8),
(43, 260, 17),
(44, 261, 237),
(45, 263, 255),
(46, 265, 264),
(47, 268, 245),
(48, 268, 244),
(49, 268, 241),
(50, 270, 269),
(51, 273, 57),
(52, 277, 248),
(53, 303, 132),
(54, 308, 252),
(55, 309, 53),
(56, 318, 28),
(57, 320, 135);

-- --------------------------------------------------------

--
-- Table structure for table `participants`
--

CREATE TABLE `participants` (
  `id` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `roomID` int(11) NOT NULL,
  `dateGotAccess` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `participants`
--

INSERT INTO `participants` (`id`, `userID`, `roomID`, `dateGotAccess`) VALUES
(1, 2, 1, '2022-01-07 01:23:20'),
(2, 1, 1, '2022-01-07 01:23:20'),
(3, 3, 2, '2022-01-07 15:07:20'),
(4, 1, 2, '2022-01-07 15:07:20'),
(7, 3, 4, '2022-01-07 16:08:29'),
(8, 2, 4, '2022-01-07 16:08:29'),
(9, 4, 5, '2022-01-08 01:21:25'),
(10, 3, 5, '2022-01-08 01:21:25'),
(11, 4, 6, '2022-01-08 11:21:22'),
(12, 2, 6, '2022-01-08 11:21:22'),
(13, 4, 7, '2022-01-08 12:02:58'),
(14, 1, 7, '2022-01-08 12:02:58'),
(15, 4, 8, '2022-01-08 12:38:01'),
(16, 5, 8, '2022-01-08 12:38:01'),
(17, 1, 9, '2022-01-09 01:52:51'),
(18, 5, 9, '2022-01-09 01:52:51'),
(19, 5, 10, '2022-01-09 02:20:30'),
(20, 2, 10, '2022-01-09 02:20:30'),
(21, 5, 11, '2022-01-10 13:52:46'),
(22, 3, 11, '2022-01-10 13:52:46'),
(23, 6, 12, '2022-01-10 21:08:05'),
(24, 5, 12, '2022-01-10 21:08:05'),
(25, 6, 13, '2022-01-10 21:16:39'),
(26, 4, 13, '2022-01-10 21:16:39'),
(27, 6, 14, '2022-01-10 21:36:17'),
(28, 3, 14, '2022-01-10 21:36:17'),
(29, 6, 15, '2022-01-10 21:58:19'),
(30, 2, 15, '2022-01-10 21:58:19'),
(31, 6, 16, '2022-01-10 22:05:57'),
(32, 1, 16, '2022-01-10 22:05:57'),
(33, 7, 17, '2022-01-24 03:32:40'),
(34, 6, 17, '2022-01-24 03:32:40'),
(35, 7, 18, '2022-01-24 13:00:48'),
(36, 1, 18, '2022-01-24 13:00:48'),
(37, 7, 19, '2022-01-24 13:03:05'),
(38, 2, 19, '2022-01-24 13:03:05'),
(39, 7, 20, '2022-01-24 13:08:30'),
(40, 3, 20, '2022-01-24 13:08:30'),
(41, 3, 1, '2022-01-25 01:23:20'),
(42, 3, 1, '2022-01-07 01:23:20'),
(43, 4, 1, '2022-01-07 01:23:20'),
(44, 5, 1, '2022-01-07 01:23:20'),
(45, 1, 21, '2022-01-26 01:52:02'),
(46, 2, 21, '2022-01-26 01:52:02'),
(47, 2, 22, '2022-01-26 02:08:25'),
(48, 1, 22, '2022-01-26 02:08:25'),
(49, 2, 23, '2022-01-26 02:12:47'),
(50, 1, 23, '2022-01-26 02:12:47'),
(51, 2, 24, '2022-01-26 02:22:25'),
(52, 1, 24, '2022-01-26 02:22:25'),
(53, 2, 25, '2022-01-26 02:23:23'),
(54, 1, 25, '2022-01-26 02:23:23'),
(55, 2, 26, '2022-01-26 02:25:16'),
(56, 1, 26, '2022-01-26 02:25:16'),
(57, 2, 27, '2022-01-26 02:25:51'),
(58, 3, 27, '2022-01-26 02:25:51'),
(59, 2, 28, '2022-01-26 10:02:57'),
(60, 3, 28, '2022-01-26 10:02:57'),
(61, 2, 29, '2022-01-26 10:24:16'),
(62, 3, 29, '2022-01-26 10:24:16'),
(63, 2, 30, '2022-01-26 10:26:16'),
(64, 3, 30, '2022-01-26 10:26:16'),
(65, 2, 31, '2022-01-26 10:31:49'),
(66, 3, 31, '2022-01-26 10:31:49'),
(67, 2, 32, '2022-01-26 11:13:05'),
(68, 3, 32, '2022-01-26 11:13:05'),
(69, 2, 33, '2022-01-26 12:23:03'),
(70, 3, 33, '2022-01-26 12:23:03'),
(71, 2, 34, '2022-01-26 12:34:05'),
(72, 3, 34, '2022-01-26 12:34:05'),
(73, 2, 35, '2022-01-26 12:39:22'),
(74, 3, 35, '2022-01-26 12:39:22'),
(75, 2, 36, '2022-01-26 12:46:40'),
(76, 3, 36, '2022-01-26 12:46:40'),
(77, 2, 37, '2022-01-26 12:50:27'),
(78, 3, 37, '2022-01-26 12:50:27'),
(79, 2, 38, '2022-01-26 13:02:14'),
(80, 3, 38, '2022-01-26 13:02:14'),
(81, 2, 39, '2022-01-26 13:10:44'),
(82, 3, 39, '2022-01-26 13:10:44'),
(83, 2, 40, '2022-01-26 13:12:23'),
(84, 3, 40, '2022-01-26 13:12:23'),
(85, 2, 41, '2022-01-26 13:14:36'),
(86, 3, 41, '2022-01-26 13:14:36'),
(87, 2, 42, '2022-01-26 13:17:22'),
(88, 3, 42, '2022-01-26 13:17:22'),
(89, 7, 43, '2022-01-26 15:43:20'),
(90, 4, 43, '2022-01-26 15:43:20'),
(91, 7, 44, '2022-01-26 16:38:48'),
(92, 5, 44, '2022-01-26 16:38:48'),
(93, 8, 45, '2022-01-30 19:04:36'),
(94, 7, 45, '2022-01-30 19:04:36'),
(95, 8, 46, '2022-01-30 19:06:38'),
(96, 1, 46, '2022-01-30 19:06:38'),
(97, 8, 47, '2022-01-30 19:07:26'),
(98, 2, 47, '2022-01-30 19:07:26');

-- --------------------------------------------------------

--
-- Table structure for table `positions`
--

CREATE TABLE `positions` (
  `id` int(11) NOT NULL,
  `position` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `positions`
--

INSERT INTO `positions` (`id`, `position`) VALUES
(1, 'Central Branding Director'),
(2, 'Corporate Security Manager'),
(3, 'Future Metrics Vice President'),
(4, 'Future Branding Administrator'),
(5, 'Dynamic Resonance Manager'),
(6, 'Lead Markets Developer'),
(7, 'Human Accounts Technician'),
(8, 'National Tactics Planner'),
(9, 'Interactive Applications Architect'),
(10, 'Customer Applications Architect'),
(11, 'Legacy Applications Strategist'),
(12, 'Dynamic Applications Orchestrator'),
(13, 'Human Applications Developer'),
(14, 'Internal Applications Coordinator');

-- --------------------------------------------------------

--
-- Table structure for table `reactionoptions`
--

CREATE TABLE `reactionoptions` (
  `id` int(11) NOT NULL,
  `icon` text NOT NULL,
  `name` text NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `reactionoptions`
--

INSERT INTO `reactionoptions` (`id`, `icon`, `name`, `description`) VALUES
(1, '👍', 'Like', NULL),
(2, '😂', 'Laugh', NULL),
(3, '😲', 'Wow', NULL),
(4, '😨', 'Afraid', NULL),
(5, '😠', 'Angry', NULL),
(6, '❤️', 'Love', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `reactions`
--

CREATE TABLE `reactions` (
  `id` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `messageID` int(11) NOT NULL,
  `reactionOptionID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `reactions`
--

INSERT INTO `reactions` (`id`, `userID`, `messageID`, `reactionOptionID`) VALUES
(1, 2, 32, 1),
(5, 2, 29, 1),
(10, 2, 31, 5),
(11, 2, 71, 4),
(12, 2, 3, 5),
(13, 2, 2, 1),
(16, 2, 45, 5),
(18, 3, 84, 5),
(20, 3, 59, 2),
(22, 3, 17, 1),
(24, 1, 17, 5),
(26, 2, 69, 4),
(28, 5, 45, 5),
(29, 5, 53, 1),
(31, 5, 55, 4),
(35, 5, 47, 4),
(36, 5, 48, 5),
(45, 2, 25, 5),
(48, 2, 81, 4),
(49, 2, 89, 4),
(50, 1, 89, 5),
(51, 1, 68, 4),
(52, 1, 41, 5),
(53, 1, 91, 5),
(55, 1, 48, 4),
(56, 1, 47, 4),
(57, 1, 46, 4),
(69, 1, 73, 5),
(70, 1, 74, 4),
(72, 1, 77, 5),
(74, 1, 65, 4),
(76, 1, 66, 5),
(77, 1, 87, 4),
(79, 1, 86, 4),
(81, 1, 92, 5),
(82, 1, 94, 4),
(87, 1, 80, 4),
(90, 1, 88, 4),
(91, 1, 62, 1),
(92, 6, 66, 4),
(93, 6, 73, 1),
(95, 2, 87, 5),
(96, 2, 88, 1),
(97, 2, 93, 1),
(98, 6, 98, 5),
(99, 6, 78, 5),
(100, 6, 97, 4),
(101, 6, 57, 1),
(102, 6, 99, 4),
(103, 6, 103, 5),
(104, 1, 97, 4),
(105, 1, 42, 6),
(106, 7, 104, 3),
(107, 7, 105, 5),
(109, 1, 50, 2),
(113, 1, 103, 1),
(118, 5, 115, 3),
(119, 1, 118, 2),
(120, 3, 123, 4),
(121, 4, 123, 5),
(122, 1, 112, 3),
(124, 1, 2, 1),
(129, 3, 143, 6),
(131, 3, 3, 2),
(132, 1, 145, 2),
(133, 6, 101, 6),
(134, 1, 134, 4),
(135, 1, 115, 5),
(136, 1, 133, 1),
(137, 1, 71, 6),
(138, 8, 164, 1),
(139, 1, 168, 3),
(141, 1, 167, 1),
(142, 1, 122, 2),
(143, 1, 132, 1),
(144, 1, 6, 1),
(145, 7, 163, 4),
(146, 1, 120, 3),
(147, 2, 145, 2),
(148, 3, 145, 2),
(149, 1, 177, 4),
(154, 1, 176, 6),
(157, 1, 174, 4),
(159, 1, 161, 1),
(163, 1, 190, 6),
(164, 1, 192, 2),
(165, 5, 250, 4),
(166, 8, 264, 1),
(167, 1, 187, 5),
(168, 3, 15, 5),
(169, 3, 317, 6),
(170, 3, 318, 2);

-- --------------------------------------------------------

--
-- Table structure for table `room`
--

CREATE TABLE `room` (
  `chatID` int(11) NOT NULL,
  `name` text DEFAULT NULL,
  `type` tinyint(4) NOT NULL,
  `profilePicture` text DEFAULT NULL,
  `creationDate` datetime NOT NULL DEFAULT current_timestamp(),
  `lastActionDate` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `room`
--

INSERT INTO `room` (`chatID`, `name`, `type`, `profilePicture`, `creationDate`, `lastActionDate`) VALUES
(1, NULL, 1, NULL, '2022-01-07 01:23:20', '2022-02-12 10:56:41'),
(2, NULL, 0, NULL, '2022-01-07 15:07:20', '2022-02-15 09:30:24'),
(4, NULL, 0, NULL, '2022-01-07 16:08:29', '2022-02-01 00:36:05'),
(5, NULL, 0, NULL, '2022-01-08 01:21:25', '2022-02-18 23:00:23'),
(6, NULL, 0, NULL, '2022-01-08 11:21:22', '2022-02-12 10:51:54'),
(7, NULL, 0, NULL, '2022-01-08 12:02:58', '2022-02-17 18:45:13'),
(8, NULL, 0, NULL, '2022-01-08 12:38:01', '2022-02-16 10:56:17'),
(9, NULL, 0, NULL, '2022-01-09 01:52:51', '2022-02-04 11:51:47'),
(10, NULL, 0, NULL, '2022-01-09 02:20:30', '2022-02-11 14:41:54'),
(11, NULL, 0, NULL, '2022-01-10 13:52:46', '2022-02-18 22:59:38'),
(12, NULL, 0, NULL, '2022-01-10 21:08:05', '2022-02-04 11:46:58'),
(13, NULL, 0, NULL, '2022-01-10 21:16:39', '2022-02-12 10:50:17'),
(14, NULL, 0, NULL, '2022-01-10 21:36:17', '2022-02-04 22:07:42'),
(15, NULL, 0, NULL, '2022-01-10 21:58:19', '2022-01-26 01:08:18'),
(16, NULL, 0, NULL, '2022-01-10 22:05:57', '2022-02-02 17:04:14'),
(17, NULL, 0, NULL, '2022-01-24 03:32:40', '2022-02-04 22:06:34'),
(18, NULL, 0, NULL, '2022-01-24 13:00:48', '2022-02-20 17:45:32'),
(19, NULL, 0, NULL, '2022-01-24 13:03:05', '2022-01-24 13:03:05'),
(20, NULL, 0, NULL, '2022-01-24 13:08:30', '2022-02-04 22:08:19'),
(21, NULL, 0, NULL, '2022-01-26 01:52:02', '2022-02-12 13:32:44'),
(22, NULL, 0, NULL, '2022-01-26 02:08:25', '2022-01-26 01:09:17'),
(23, NULL, 0, NULL, '2022-01-26 02:12:47', '2022-01-26 02:12:47'),
(24, NULL, 0, NULL, '2022-01-26 02:22:25', '2022-02-05 00:02:33'),
(25, NULL, 0, NULL, '2022-01-26 02:23:23', '2022-01-26 02:23:23'),
(26, NULL, 0, NULL, '2022-01-26 02:25:16', '2022-01-26 02:25:16'),
(27, NULL, 0, NULL, '2022-01-26 02:25:51', '2022-01-26 02:25:51'),
(28, NULL, 0, NULL, '2022-01-26 10:02:57', '2022-01-26 10:02:57'),
(29, NULL, 0, NULL, '2022-01-26 10:24:16', '2022-01-26 10:24:16'),
(30, NULL, 0, NULL, '2022-01-26 10:26:16', '2022-01-26 10:26:16'),
(31, NULL, 0, NULL, '2022-01-26 10:31:49', '2022-01-26 10:31:49'),
(32, NULL, 0, NULL, '2022-01-26 11:13:05', '2022-01-26 11:13:05'),
(33, NULL, 0, NULL, '2022-01-26 12:23:03', '2022-01-26 12:23:03'),
(34, NULL, 0, NULL, '2022-01-26 12:34:05', '2022-01-26 12:34:05'),
(35, NULL, 0, NULL, '2022-01-26 12:39:22', '2022-01-26 12:39:22'),
(36, NULL, 0, NULL, '2022-01-26 12:46:40', '2022-01-26 12:46:40'),
(37, NULL, 0, NULL, '2022-01-26 12:50:27', '2022-01-26 12:50:27'),
(38, NULL, 0, NULL, '2022-01-26 13:02:14', '2022-01-26 13:02:14'),
(39, NULL, 0, NULL, '2022-01-26 13:10:44', '2022-01-26 13:10:44'),
(40, NULL, 0, NULL, '2022-01-26 13:12:23', '2022-01-26 13:12:23'),
(41, NULL, 0, NULL, '2022-01-26 13:14:36', '2022-01-26 13:14:36'),
(42, NULL, 0, NULL, '2022-01-26 13:17:22', '2022-01-26 13:17:22'),
(43, NULL, 0, NULL, '2022-01-26 15:43:20', '2022-01-26 15:43:20'),
(44, NULL, 0, NULL, '2022-01-26 16:38:48', '2022-02-04 15:13:18'),
(45, NULL, 0, NULL, '2022-01-30 19:04:36', '2022-02-06 17:21:41'),
(46, NULL, 0, NULL, '2022-01-30 19:06:38', '2022-02-06 17:21:50'),
(47, NULL, 0, NULL, '2022-01-30 19:07:26', '2022-02-04 00:34:36');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `surname` text NOT NULL,
  `email` text NOT NULL,
  `profilePicture` text DEFAULT NULL,
  `password` text NOT NULL,
  `company_id` int(11) NOT NULL,
  `positionId` int(11) NOT NULL,
  `registration_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `surname`, `email`, `profilePicture`, `password`, `company_id`, `positionId`, `registration_date`) VALUES
(1, 'Test1Name', 'Test1Surname', 'test1email@gmail.com', '/images/profiles/user-128.png', '$2a$10$7ToBGJZ4ifEX.UmhKVR00.v.XN2JOh0WBNrj12RMy5n/ukoEtIjiy', 0, 1, '2022-01-07 01:05:01'),
(2, 'Test2Name', 'Test2Surname', 'test2email@gmail.com', '/images/profiles/user-129.png', '$2a$10$jBJkQjAFD2jHAJPGlHmkKeq3.ypTPQEuSkrAB.DncxG.np5hDBo1a', 0, 2, '2022-01-07 01:08:28'),
(3, 'Test3Name', 'Test3Surname', 'test3email@gmail.com', NULL, '$2a$10$FcQD2cadt/OSXiuN9.wdNOvAOJCT8ugB05zTiaCSSDPppjHz3CBSS', 0, 3, '2022-01-07 15:06:35'),
(4, 'test4Name', 'test4Surname', 'test4email@gmail.com', NULL, '$2a$10$ZxXRImnZCpmDkHeMsyo.HejKblBD.T5p.xASvFUTimbuMc7HLwwxi', 0, 4, '2022-01-08 00:42:14'),
(5, 'test5Name', 'test5Surname', 'test5email@gmail.com', NULL, '$2a$10$UnfZ/VBOb8pwd1Ud0zW4gOJb3B/82V7AqzAqRTUNVePRgd3J/WrAu', 0, 5, '2022-01-08 12:14:42'),
(6, 'test6Name', 'test6Surame', 'test6email@gmail.com', NULL, '$2a$10$IDFjO5zOFdD08Fm3UGIhje4gfiMMl5qC8royvj1zqzLqDZtvOXCAu', 0, 6, '2022-01-10 21:07:06'),
(7, 'Test', 'User7', 'test7email@gmail.com', NULL, '$2a$10$Udt6i3z86nbcfhuT858Qyu.xVmpn/NitExPwxQ68fl4FMLqK/6iH2', 0, 7, '2022-01-24 03:32:11'),
(8, '5Mugisha', 'Jean', 'test8email@gmail.com', NULL, '$2a$10$Ywb/w2Guhi1/NxiiFsCOg.Kv5J/ttzl4JovS84u9fRAhMGFR7LjpO', 0, 8, '2022-01-30 19:04:18');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `calls`
--
ALTER TABLE `calls`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `message`
--
ALTER TABLE `message`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `messagetags`
--
ALTER TABLE `messagetags`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `participants`
--
ALTER TABLE `participants`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reactionoptions`
--
ALTER TABLE `reactionoptions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reactions`
--
ALTER TABLE `reactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userID` (`userID`,`messageID`);

--
-- Indexes for table `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`chatID`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `calls`
--
ALTER TABLE `calls`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `message`
--
ALTER TABLE `message`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=321;

--
-- AUTO_INCREMENT for table `messagetags`
--
ALTER TABLE `messagetags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `participants`
--
ALTER TABLE `participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;

--
-- AUTO_INCREMENT for table `positions`
--
ALTER TABLE `positions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `reactionoptions`
--
ALTER TABLE `reactionoptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `reactions`
--
ALTER TABLE `reactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=171;

--
-- AUTO_INCREMENT for table `room`
--
ALTER TABLE `room`
  MODIFY `chatID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
