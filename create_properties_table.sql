-- Create properties table for Hospup application
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

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);