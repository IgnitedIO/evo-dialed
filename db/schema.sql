SET NAMES utf8;
SET time_zone = '+00:00';
SET FOREIGN_KEY_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb3;

-- DB Schema

DROP TABLE IF EXISTS `Users`;
CREATE TABLE Users (
	`id` int AUTO_INCREMENT NOT NULL,
	`pfp` LONGBLOB,
	`email` varchar(125) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
	`name` varchar(125) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
	`phone` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
	`user_typ` enum('evo', 'creator') NOT NULL DEFAULT 'creator',
	`is_cd` tinyint(1) NOT NULL DEFAULT 0, -- is_cd = Is Creative Director
	`created_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE KEY (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
CREATE INDEX idx_users_user_typ ON Users(user_typ);
CREATE INDEX idx_users_created_ts ON Users(created_ts);

DROP TABLE IF EXISTS `Users_Auth`;
CREATE TABLE Users_Auth (
	`user_id` int NOT NULL,
	`hash` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
	`salt` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
	PRIMARY KEY (`user_id`),
	FOREIGN KEY (`user_id`) REFERENCES Users(`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Campaign Tables

DROP TABLE IF EXISTS `Campaigns`;
CREATE TABLE Campaigns (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
	`img` LONGBLOB,
	`description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
	`created_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`supports_ig` tinyint(1) NOT NULL DEFAULT 0,
	`supports_tt` tinyint(1) NOT NULL DEFAULT 0,
	`status` enum('active', 'archive', 'complete', 'draft') NOT NULL DEFAULT 'active',
	`start_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`end_date` TIMESTAMP NOT NULL,
	`budget` decimal(10, 2) NOT NULL DEFAULT 0,
	`share_link` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
	`assigned_cd` int DEFAULT NULL,
	PRIMARY KEY (`id`),
	FOREIGN KEY (`assigned_cd`) REFERENCES Users(`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

DROP TABLE IF EXISTS `Campaign_Links`;
CREATE TABLE Campaign_Links (
	`campaign_id` int NOT NULL,
	`title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL, -- ex. "Campaign Brief", "Post Guidelines", "Post Examples"
	`url` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
	`description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
	`created_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`campaign_id`, `url`),
	FOREIGN KEY (`campaign_id`) REFERENCES Campaigns(`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

DROP TABLE IF EXISTS `Campaign_Submissions`;
CREATE TABLE Campaign_Submissions (
	`campaign_id` int NOT NULL,
	`submit_typ` enum('oauth', 'scrape') NOT NULL DEFAULT 'oauth',
	`conn_id` int,
	`clink_id` int,
	`npc_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL, -- Native Platform Content ID
	`caption` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
	`post_url` TEXT CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
	`thumbnail` TEXT CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
	`post_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`submit_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`slack_alert_sent` tinyint(1) NOT NULL DEFAULT 0, -- Track if 10k+ views alert was sent
	PRIMARY KEY (`campaign_id`, `npc_id`),
	FOREIGN KEY (`campaign_id`) REFERENCES Campaigns(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`conn_id`) REFERENCES Creator_Socials(`conn_id`) ON DELETE SET NULL,
	FOREIGN KEY (`clink_id`) REFERENCES Creator_Links(`clink_id`) ON DELETE SET NULL,
	UNIQUE KEY (`npc_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
CREATE INDEX idx_campaign_submissions_clink_id ON Campaign_Submissions(clink_id);
CREATE INDEX idx_campaign_submissions_campaign_id ON Campaign_Submissions(campaign_id);

DROP TABLE IF EXISTS `Campaign_Submissions_Metrics`;
CREATE TABLE Campaign_Submissions_Metrics (
	`id` int AUTO_INCREMENT NOT NULL,
	`npc_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
	`recorded_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`views` int NOT NULL DEFAULT 0,
	`likes` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	PRIMARY KEY (`id`),
	KEY `idx_npc_ts` (`npc_id`, `recorded_ts`),
	FOREIGN KEY (`npc_id`) REFERENCES Campaign_Submissions(`npc_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Metrics Cache Metadata Table
DROP TABLE IF EXISTS `Metrics_Cache_Metadata`;
CREATE TABLE Metrics_Cache_Metadata (
    `id` int AUTO_INCREMENT NOT NULL,
    `cache_key` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
    `timespan` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
    `campaign_ids` JSON NULL, -- Array of campaign IDs or null for all campaigns
    `creator_ids` JSON NULL,  -- Array of creator IDs or null for all creators
    `strict_period` tinyint(1) NOT NULL DEFAULT 0,
    `last_cached_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_refresh_ts` TIMESTAMP NULL, -- When the cache was last refreshed
    `is_refreshing` tinyint(1) NOT NULL DEFAULT 0, -- Whether a refresh is currently in progress
    `refresh_started_ts` TIMESTAMP NULL, -- When the current refresh started
    `cache_age_minutes` int NOT NULL DEFAULT 0, -- Age of cache in minutes
    `created_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY (`cache_key`),
    KEY `idx_timespan` (`timespan`),
    KEY `idx_campaign_ids` ((CAST(campaign_ids AS CHAR(100)))),
    KEY `idx_creator_ids` ((CAST(creator_ids AS CHAR(100)))),
    KEY `idx_last_cached` (`last_cached_ts`),
    KEY `idx_is_refreshing` (`is_refreshing`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

DROP TABLE IF EXISTS `Creator_Assignments`;
CREATE TABLE Creator_Assignments (
	`campaign_id` int NOT NULL,
	`user_id` int NOT NULL,
	`num_posts` int NOT NULL DEFAULT 0,
	`frequency` enum('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'daily',
	`start_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`end_date` TIMESTAMP NOT NULL,
	`created_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`campaign_id`, `user_id`),
	FOREIGN KEY (`campaign_id`) REFERENCES Campaigns(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`user_id`) REFERENCES Users(`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Creator Tables

DROP TABLE IF EXISTS `Creator_Socials`;
CREATE TABLE Creator_Socials (
	`conn_id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`platform` enum('tt', 'ig') NOT NULL,
	`key_a` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL, -- access token
	`key_b` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci, -- refresh token
	`key_c` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci, -- account id
	`typ` enum('oauth', 'scrape') NOT NULL DEFAULT 'oauth',
	`added_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`conn_id`),
	UNIQUE KEY (`user_id`, `platform`, `key_a`),
	FOREIGN KEY (`user_id`) REFERENCES Users(`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

DROP TABLE IF EXISTS `Creator_Links`;
CREATE TABLE Creator_Links (
	`clink_id` int AUTO_INCREMENT NOT NULL,
	`campaign_id` int NOT NULL,
	`user_id` int NOT NULL,
	`platform` enum('ig', 'tt') NOT NULL,
	`url` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
	`handle` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
	`display_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
	`pfp` LONGBLOB,
	`created_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`clink_id`),
	UNIQUE KEY (`handle`, `platform`),
	UNIQUE KEY (`url`),
	FOREIGN KEY (`user_id`) REFERENCES Users(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`campaign_id`) REFERENCES Campaigns(`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
CREATE INDEX idx_creator_links_user_id_campaign_id ON Creator_Links(user_id, campaign_id);
CREATE INDEX idx_creator_links_user_id ON Creator_Links(user_id);

DROP TABLE IF EXISTS `Social_Preview_Info`;
CREATE TABLE Social_Preview_Info (
    `id` int AUTO_INCREMENT NOT NULL,
    `platform` enum('ig', 'tt') NOT NULL,
    `url` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
    `handle` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
    `display_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    `pfp` LONGBLOB,
    `follower_count` int NOT NULL DEFAULT 0,
    `bio` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
    `num_posts` int NOT NULL DEFAULT 0,
    `following` int NOT NULL DEFAULT 0,
    `is_private` tinyint(1) NOT NULL DEFAULT 0,
    `created_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY (`handle`, `platform`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Password Reset Tables
DROP TABLE IF EXISTS `PassReset_Codes`;
CREATE TABLE PassReset_Codes (
    `id` int AUTO_INCREMENT NOT NULL,
    `user_id` int NOT NULL,
    `code` varchar(6) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
    `created_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_created_ts` (`created_ts`),
    FOREIGN KEY (`user_id`) REFERENCES Users(`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Magic Link Tables
DROP TABLE IF EXISTS `MagicLink_Codes`;
CREATE TABLE MagicLink_Codes (
    `id` int AUTO_INCREMENT NOT NULL,
    `user_id` int NOT NULL,
    `code` varchar(6) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
    `created_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_created_ts` (`created_ts`),
    FOREIGN KEY (`user_id`) REFERENCES Users(`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;


-- Invited Creators Table
DROP TABLE IF EXISTS `Invited_Creators`;
CREATE TABLE Invited_Creators (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(125) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
	`name` varchar(125) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
	`phone` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
	`invite_code` varchar(6) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
	`invited_by` int NOT NULL,
	`created_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE KEY `uk_email` (`email`),
	UNIQUE KEY `uk_invite_code` (`invite_code`),
	KEY `idx_created_ts` (`created_ts`),
	FOREIGN KEY (`invited_by`) REFERENCES Users(`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;


-- [V1.1] Creative Approval System
DROP TABLE IF EXISTS `CrvApprv_Creator_Creatives`;
CREATE TABLE CrvApprv_Creator_Creatives (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`campaign_id` int NOT NULL,
	`s3_url` TEXT CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
	`caption` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
	`thumbnail` LONGBLOB,
	`platform` enum('tt', 'ig') NOT NULL,
	`content_typ` enum('img', 'vid') NOT NULL DEFAULT 'vid',
	`status` enum('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
	`creator_notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
	`feedback_notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
	`version` int NOT NULL DEFAULT 1,
	`supersedes_id` int DEFAULT NULL,
	`reviewed_by` int DEFAULT NULL,
	`reviewed_ts` TIMESTAMP NULL,
	`created_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	FOREIGN KEY (`user_id`) REFERENCES Users(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`campaign_id`) REFERENCES Campaigns(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`supersedes_id`) REFERENCES CrvApprv_Creator_Creatives(`id`) ON DELETE SET NULL,
	FOREIGN KEY (`reviewed_by`) REFERENCES Users(`id`) ON DELETE SET NULL,
	KEY `idx_status` (`status`),
	KEY `idx_campaign_user` (`campaign_id`, `user_id`),
	KEY `idx_created_ts` (`created_ts`),
	KEY `idx_platform` (`platform`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;