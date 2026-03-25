-- Migration: Create users table
-- Description: Creates the users table with role-based access control and manager relationships
-- Requirements: 1.2, 1.3, 2.4, 8.1, 12.2

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('employee', 'manager')),
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user accounts for employees and managers';
COMMENT ON COLUMN users.role IS 'User role: employee or manager';
COMMENT ON COLUMN users.manager_id IS 'Reference to manager user for employees';
