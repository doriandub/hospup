-- Initialize database with extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create development user if needed
-- (The main user is already created via POSTGRES_USER env var)