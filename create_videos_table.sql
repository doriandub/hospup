-- Create videos table for Hospup application
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

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_property_id ON videos(property_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);