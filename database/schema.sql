CREATE DATABASE IF NOT EXISTS github_profile_analyzer;
USE github_profile_analyzer;

CREATE TABLE IF NOT EXISTS profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,
  company VARCHAR(255),
  blog VARCHAR(500),
  location VARCHAR(255),
  email VARCHAR(255),
  twitter_username VARCHAR(255),
  public_repos INT DEFAULT 0,
  public_gists INT DEFAULT 0,
  followers INT DEFAULT 0,
  following INT DEFAULT 0,
  github_created_at DATETIME,
  profile_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
