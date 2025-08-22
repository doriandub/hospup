-- Template SQL pour ajouter tes vidéos virales rapidement
-- Remplace les valeurs et exécute dans psql

INSERT INTO viral_video_templates 
(id, title, hotel_name, username, country, video_link, account_link,
 followers, views, likes, comments, duration, script, category, 
 description, popularity_score, tags, segments_pattern, is_active,
 total_duration_min, total_duration_max, created_at, updated_at)
VALUES (
    gen_random_uuid(),                           -- id automatique
    'TITRE_DE_LA_VIDEO',                        -- titre
    'NOM_HOTEL',                                 -- hotel_name  
    'USERNAME',                                  -- username (sans @)
    'PAYS',                                      -- country
    'LIEN_VIDEO',                                -- video_link
    'LIEN_COMPTE',                               -- account_link
    FOLLOWERS_NUMBER,                            -- followers (nombre)
    VIEWS_NUMBER,                                -- views (nombre)
    LIKES_NUMBER,                                -- likes (nombre)
    COMMENTS_NUMBER,                             -- comments (nombre)
    DURATION_SECONDS,                            -- duration (secondes)
    '{"description": "DESCRIPTION_SCRIPT"}',     -- script (JSON)
    'CATEGORIE',                                 -- category
    'DESCRIPTION_VIDEO',                         -- description
    SCORE_VIRAL,                                 -- popularity_score (1-10)
    '[]',                                        -- tags (vide pour l'instant)
    '{}',                                        -- segments_pattern (vide)
    true,                                        -- is_active
    DURATION_SECONDS * 0.8,                     -- total_duration_min
    DURATION_SECONDS * 1.2,                     -- total_duration_max
    NOW(),                                       -- created_at
    NOW()                                        -- updated_at
);

-- EXEMPLE CONCRET basé sur ta vidéo:
/*
INSERT INTO viral_video_templates 
(id, title, hotel_name, username, country, video_link, account_link,
 followers, views, likes, comments, duration, script, category, 
 description, popularity_score, tags, segments_pattern, is_active,
 total_duration_min, total_duration_max, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Hotel Morning Routine',
    'Four Seasons Paris',
    'luxurytraveler',
    'France', 
    'https://www.instagram.com/p/ABC123/',
    'https://www.instagram.com/luxurytraveler/',
    150000,
    850000,
    35000,
    420,
    25.0,
    '{"description": "Morning routine in luxury hotel with terrace yoga"}',
    'Morning Routine',
    'Luxury morning routine in Parisian palace hotel',
    8.8,
    '[]',
    '{}',
    true,
    20.0,
    30.0,
    NOW(),
    NOW()
);
*/