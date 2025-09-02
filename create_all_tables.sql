-- Create all necessary tables for Hospup application

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    plan VARCHAR NOT NULL DEFAULT 'free',
    videos_used INTEGER NOT NULL DEFAULT 0,
    videos_limit INTEGER NOT NULL DEFAULT 2,
    subscription_id VARCHAR,
    customer_id VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    address TEXT,
    city VARCHAR,
    country VARCHAR,
    property_type VARCHAR,
    description TEXT,
    website_url VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    instagram_handle VARCHAR,
    language VARCHAR DEFAULT 'fr',
    is_active BOOLEAN DEFAULT true,
    text_font VARCHAR DEFAULT 'Helvetica',
    text_color VARCHAR DEFAULT '#FFFFFF',
    text_size VARCHAR DEFAULT 'medium',
    text_shadow BOOLEAN DEFAULT false,
    text_outline BOOLEAN DEFAULT false,
    text_background BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    video_url VARCHAR NOT NULL,
    thumbnail_url VARCHAR,
    format VARCHAR NOT NULL DEFAULT 'mp4',
    duration FLOAT,
    size INTEGER,
    status VARCHAR NOT NULL DEFAULT 'processing',
    language VARCHAR NOT NULL DEFAULT 'en',
    source_type VARCHAR,
    source_data TEXT,
    viral_video_id VARCHAR,
    generation_job_id VARCHAR,
    ai_description TEXT,
    instagram_audio_url VARCHAR,
    user_id VARCHAR NOT NULL,
    property_id VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_property_id ON videos(property_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);

-- Check what tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';