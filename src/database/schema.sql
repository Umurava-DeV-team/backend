-- PostgreSQL Database Schema for Umurava AI Recruiting System
-- Run this script to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('recruiter', 'candidate', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. Jobs Table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  experience_level VARCHAR(50) NOT NULL CHECK (experience_level IN ('Junior', 'Mid-Level', 'Senior')),
  applicants_target INTEGER NOT NULL,
  location VARCHAR(255) NOT NULL,
  salary_range VARCHAR(100) NOT NULL,
  description TEXT,
  description_file_url TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);

-- 3. Candidates Table (Manual entries)
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  location VARCHAR(255),
  phone VARCHAR(50),
  skills TEXT[],
  experience TEXT,
  education TEXT,
  summary TEXT,
  resume_text TEXT,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_job_id ON candidates(job_id);

-- 4. Profiles Table (Portal users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  bio TEXT,
  headline VARCHAR(500),
  location VARCHAR(255),
  skills JSONB DEFAULT '[]',
  work_experience JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  projects JSONB DEFAULT '[]',
  social_links JSONB DEFAULT '{}',
  resume_url VARCHAR(500),
  availability VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- 5. Applications Table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  cover_letter TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(candidate_id, job_id)
);

CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);

-- 6. Screening Results Table
CREATE TABLE screening_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  job_title VARCHAR(255) NOT NULL,
  total_candidates INTEGER NOT NULL,
  shortlist JSONB DEFAULT '[]',
  screened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_screening_job_id ON screening_results(job_id);

-- 7. Assessments Table (NEW STRUCTURE with Draft/Active workflow)
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  instructions TEXT,
  duration_minutes INTEGER DEFAULT 120,
  time_limit_per_question INTEGER DEFAULT 30,
  
  -- Assessment status workflow: draft -> active -> archived
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  
  -- Questions stored as JSONB array
  -- Each question: {id, type, category, question, options?, correctAnswer?, marks}
  questions JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  job_type VARCHAR(50) CHECK (job_type IN ('coding', 'non-coding')),
  job_category VARCHAR(100),
  total_questions INTEGER DEFAULT 10,
  total_marks INTEGER DEFAULT 100,
  passing_score INTEGER DEFAULT 50,
  
  -- Audit fields
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  launched_at TIMESTAMP,
  launched_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_assessments_job_id ON assessments(job_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_created_by ON assessments(created_by);

-- 8. Assessment Assignments Table (Candidate-specific instances)
CREATE TABLE assessment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  
  -- Candidate reference (can be portal user or manual candidate)
  candidate_id UUID NOT NULL,
  candidate_type VARCHAR(50) NOT NULL CHECK (candidate_type IN ('portal_user', 'manual_candidate')),
  candidate_name VARCHAR(255),
  candidate_email VARCHAR(255),
  
  -- Assignment status
  status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'evaluated')),
  
  -- Timing
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  submitted_at TIMESTAMP,
  time_taken_minutes INTEGER,
  
  -- Answers stored as JSONB array
  -- Each answer: {questionId, answer, timestamp}
  answers JSONB DEFAULT '[]',
  
  -- Scoring
  score INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  grade VARCHAR(2),
  passed BOOLEAN DEFAULT false,
  correct_answers_count INTEGER DEFAULT 0,
  
  -- Evaluation details
  evaluated_answers JSONB DEFAULT '[]',
  strengths TEXT[],
  weaknesses TEXT[],
  overall_feedback TEXT,
  
  -- Integrity tracking
  session_integrity INTEGER DEFAULT 100,
  session_status VARCHAR(50) DEFAULT 'Verified Secure',
  integrity_violations JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(assessment_id, candidate_id)
);

CREATE INDEX idx_assignments_assessment ON assessment_assignments(assessment_id);
CREATE INDEX idx_assignments_candidate ON assessment_assignments(candidate_id);
CREATE INDEX idx_assignments_status ON assessment_assignments(status);
CREATE INDEX idx_assignments_email ON assessment_assignments(candidate_email);

-- 9. Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'assessment')),
  read BOOLEAN DEFAULT false,
  link TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 10. Audit Log Table (Optional but recommended)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assessment_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO users (name, email, password_hash, role) VALUES
-- ('Test Recruiter', 'recruiter@test.com', '$2a$10$...', 'recruiter'),
-- ('Test Candidate', 'candidate@test.com', '$2a$10$...', 'candidate');
