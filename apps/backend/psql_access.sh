#!/bin/bash
# Script d'accès direct à AWS RDS PostgreSQL

echo "🚀 ACCÈS DIRECT AWS RDS POSTGRESQL"
echo "=================================="
echo ""
echo "📊 Tables disponibles:"
echo "- viral_video_templates (tes vidéos)"
echo "- users (utilisateurs)"  
echo "- properties (propriétés)"
echo ""
echo "💡 Exemples de requêtes:"
echo "SELECT * FROM viral_video_templates;"
echo "INSERT INTO viral_video_templates (id, title, hotel_name, username, country, video_link, views, likes, popularity_score, category, description, script) VALUES (uuid_generate_v4(), 'Titre', 'Hotel', '@user', 'France', 'https://...', 1000000, 50000, 8.5, 'Hotel Tour', 'Description...', '{\"description\": \"Script...\"}');"
echo ""
echo "🔗 Connexion en cours..."
echo ""

/opt/homebrew/bin/psql "postgresql://postgres:bSE10GhpRKVigbkEnzBG@hospup-db2.checoia2yosk.eu-west-1.rds.amazonaws.com:5432/postgres"