-- ========================================================
-- JOSE RIZAL UNIVERSITY (JRU) ALUMNI TRACKER DATABASE SCHEMA
-- Database: jru_alumni_db
-- ========================================================

CREATE DATABASE IF NOT EXISTS jru_alumni_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE jru_alumni_db;

DROP TABLE IF EXISTS alumni;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS colleges;

CREATE TABLE colleges (
  college_key VARCHAR(10) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  short_name VARCHAR(20) NOT NULL,
  badge_color_gradient VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE programs (
  program_id INT AUTO_INCREMENT PRIMARY KEY,
  college_key VARCHAR(10) NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(150) NOT NULL,
  major VARCHAR(150) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_key) REFERENCES colleges(college_key) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE alumni (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  batch_year INT NOT NULL,
  college_key VARCHAR(10) NOT NULL,
  program_name VARCHAR(200) NOT NULL,
  major VARCHAR(150) DEFAULT NULL,
  motto TEXT NOT NULL,
  honor VARCHAR(100) DEFAULT 'Graduate',
  academic_highlights TEXT DEFAULT NULL,
  avatar_url LONGTEXT DEFAULT NULL,
  verified TINYINT(1) DEFAULT 1,
  email VARCHAR(150) DEFAULT NULL,
  linkedin VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_key) REFERENCES colleges(college_key) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_batch_year (batch_year),
  INDEX idx_college_key (college_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO colleges (college_key, name, short_name, badge_color_gradient) VALUES
('EAS', 'College of Education, Arts & Sciences', 'EAS', 'from-blue-600 to-indigo-700'),
('BAA', 'College of Business Administration & Accountancy', 'BAA', 'from-amber-600 to-yellow-600'),
('CSE', 'College of Computer Studies & Engineering', 'CSE', 'from-cyan-600 to-blue-700'),
('HTM', 'College of Hospitality & Tourism Management', 'HTM', 'from-emerald-600 to-teal-700'),
('NHS', 'College of Nursing & Health Sciences', 'NHS', 'from-rose-600 to-pink-700'),
('CJE', 'College of Criminal Justice Education', 'CJE', 'from-purple-600 to-indigo-800');

INSERT INTO programs (college_key, code, name, major) VALUES
('EAS', 'AB-Econ', 'Bachelor of Arts (AB)', 'Major in Economics'),
('EAS', 'AB-Eng', 'Bachelor of Arts (AB)', 'Major in English Language'),
('EAS', 'AB-Hist', 'Bachelor of Arts (AB)', 'Major in History'),
('EAS', 'BSPsy', 'Bachelor of Science in Psychology (BSPsy)', NULL),
('EAS', 'BSED-Eng', 'Bachelor of Secondary Education (BSED)', 'Major in English'),
('EAS', 'BSED-Math', 'Bachelor of Secondary Education (BSED)', 'Major in Mathematics'),
('EAS', 'BSED-SS', 'Bachelor of Secondary Education (BSED)', 'Major in Social Studies'),
('EAS', 'BSAM', 'Bachelor of Science in Applied Mathematics (BSAM)', NULL),
('EAS', 'BEED', 'Bachelor of Elementary Education (BEED)', NULL),
('EAS', 'TCP', 'Teaching Certificate Program (TCP)', NULL),
('BAA', 'BSA', 'Bachelor of Science in Accountancy (BSA)', NULL),
('BAA', 'BSBA-Acct', 'Bachelor of Science in Business Administration (BSBA)', 'Major in Accounting'),
('BAA', 'BSBA-FinTech', 'Bachelor of Science in Business Administration (BSBA)', 'Major in Enterprise Finance & Fintech'),
('BAA', 'BSBA-Econ', 'Bachelor of Science in Business Administration (BSBA)', 'Major in Business Economics'),
('BAA', 'BSBA-Mkt', 'Bachelor of Science in Business Administration (BSBA)', 'Major in Market Innovation & Growth'),
('BAA', 'BSBA-SIDS', 'Bachelor of Science in Business Administration (BSBA)', 'Major in Strategic Intelligence & Decision Systems'),
('BAA', 'BSBA-Supply', 'Bachelor of Science in Business Administration (BSBA)', 'Major in Supply Management'),
('BAA', 'BSLgM', 'Bachelor of Science in Legal Management (BSLgM)', NULL),
('CSE', 'BSCpE', 'Bachelor of Science in Computer Engineering (BSCpE)', NULL),
('CSE', 'BSECE', 'Bachelor of Science in Electronics Engineering (BSECE)', NULL),
('CSE', 'BSIT', 'Bachelor of Science in Information Technology (BSIT)', NULL),
('CSE', 'BSIT-BA', 'Bachelor of Science in Information Technology (BSIT-BA)', 'Major in Business Analytics'),
('CSE', 'BSEMC-DAT', 'Bachelor of Science in Entertainment and Multimedia Computing (BSEMC)', 'Major in Digital Animation Technology'),
('CSE', 'BSEMC-GD', 'Bachelor of Science in Entertainment and Multimedia Computing (BSEMC)', 'Major in Game Development'),
('HTM', 'BSHM', 'Bachelor of Science in Hospitality Management (BSHM)', NULL),
('HTM', 'BSHM-CM', 'Bachelor of Science in Hospitality Management (BSHM – CM)', 'Major in Cruise Management'),
('HTM', 'BSTM', 'Bachelor of Science in Tourism Management (BSTM)', NULL),
('NHS', 'BSN', 'Bachelor of Science in Nursing (BSN)', NULL),
('CJE', 'BSCrim', 'Bachelor of Science in Criminology (BSCrim)', NULL);

INSERT INTO alumni (id, student_id, full_name, batch_year, college_key, program_name, major, motto, honor, academic_highlights, avatar_url, verified, email, linkedin) VALUES
('jru-2021-001', '21-849201', 'Samantha Ramos', 2021, 'CSE', 'Bachelor of Science in Information Technology (BSIT-BA)', 'Major in Business Analytics', 'Data reveals stories, but human curiosity turns insights into meaningful impact.', 'Summa Cum Laude', 'President of JRU Computer Society (2020-2021). Recipient of the Jose Rizal Outstanding Academic Excellence Award.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80', 1, 'samantha.ramos@my.jru.edu', 'https://linkedin.com/in/samantharamos-analytics'),
('jru-2015-042', '15-540192', 'Marcus Aurelius Santos', 2015, 'BAA', 'Bachelor of Science in Accountancy (BSA)', NULL, 'Integrity in numbers builds everlasting trust in ethical leadership.', 'Magna Cum Laude', 'Class Valedictorian, College of Business Administration & Accountancy Class of 2015. National CPA Board Exam Topnotcher.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80', 1, 'marcus.santos@my.jru.edu', 'https://linkedin.com/in/marcussantos-cpa'),
('jru-2008-112', '08-112089', 'Dr. Katrina Dela Cruz', 2008, 'NHS', 'Bachelor of Science in Nursing (BSN)', NULL, 'Compassion is the heart of nursing; technical precision is its backbone.', 'Cum Laude', 'Head Nurse Scholar and Chief Student Clinical Coordinator. Lead Researcher in Community Health Policy.', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80', 1, 'katrina.delacruz@my.jru.edu', 'https://linkedin.com/in/drkatrinadelacruz'),
('jru-2019-088', '19-482019', 'Gabriel Alonzo', 2019, 'CSE', 'Bachelor of Science in Entertainment and Multimedia Computing (BSEMC)', 'Major in Game Development', 'Code the worlds you wish to explore and inspire through interactive art.', 'Academic Distinction', 'Winner of National Student Game Innovation Expo 2019. Lead Developer for JRU Interactive Virtual Campus Map.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', 1, 'gabriel.alonzo@my.jru.edu', 'https://linkedin.com/in/gabrielalonzo-dev'),
('jru-2012-054', '12-302912', 'Patricia Mendoza', 2012, 'BAA', 'Bachelor of Science in Business Administration (BSBA)', 'Major in Enterprise Finance & Fintech', 'Financial technology should bridge economic divides and empower local communities.', 'Magna Cum Laude', 'JRU Junior Finance Executives Club President. Champion of Inter-University Financial Literacy Challenge.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80', 1, 'patricia.mendoza@my.jru.edu', 'https://linkedin.com/in/patriciamendoza-fintech'),
('jru-2004-019', '04-918204', 'Atty. Ricardo Gomez', 2004, 'BAA', 'Bachelor of Science in Legal Management (BSLgM)', NULL, 'Law is the ethical scaffolding upon which sustainable enterprise flourishes.', 'Summa Cum Laude', 'Captain of JRU Debate Team. Recipient of Most Outstanding Student Leader Award 2004.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', 1, 'ricardo.gomez@my.jru.edu', 'https://linkedin.com/in/atty-ricardo-gomez'),
('jru-2010-067', '10-671092', 'Capt. Juan Miguel Reyes', 2010, 'HTM', 'Bachelor of Science in Hospitality Management (BSHM – CM)', 'Major in Cruise Management', 'World-class hospitality knows no oceans; service excellence is a universal language.', 'Cum Laude', 'International Maritime Hospitality Exchange Scholar. JRU Culinary Arts Guild Lead.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80', 1, 'juan.reyes@my.jru.edu', 'https://linkedin.com/in/capt-juan-reyes'),
('jru-2017-033', '17-339217', 'Maria Clara Espiritu', 2017, 'EAS', 'Bachelor of Science in Psychology (BSPsy)', NULL, 'Understanding minds fosters empathetic organizations where innovation thrives.', 'Magna Cum Laude', 'Editor-in-Chief of The Rizalian Student Journal. Lead Youth Mental Health Advocate.', 'https://images.unsplash.com/photo-1534751516642-a171e3914975?w=600&auto=format&fit=crop&q=80', 1, 'maria.espiritu@my.jru.edu', 'https://linkedin.com/in/mariaclara-espiritu'),
('jru-2002-005', '02-059202', 'P/Lt. Col. Eduardo Dalisay', 2002, 'CJE', 'Bachelor of Science in Criminology (BSCrim)', NULL, 'Honor, duty, and relentless commitment to justice and public safety.', 'Summa Cum Laude', 'Corps Commander of JRU ROTC Unit. Top scorer in National Criminologist Licensure Examination.', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80', 1, 'eduardo.dalisay@my.jru.edu', 'https://linkedin.com/in/eduardo-dalisay-pnp');