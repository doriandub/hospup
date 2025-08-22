#!/usr/bin/env python3
"""
Script de test pour ajouter manuellement "Les Oliviers de Redhouse" dans PostgreSQL
en attendant la synchronisation Airtable.
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

POSTGRES_URL = "postgresql://postgres:bSE10GhpRKVigbkEnzBG@hospup-db2.checoia2yosk.eu-west-1.rds.amazonaws.com:5432/postgres"

def add_oliviers_template():
    """Ajoute le template Les Oliviers de Redhouse manuellement"""
    try:
        # Connexion
        conn = psycopg2.connect(POSTGRES_URL, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        # Données pour "Les Oliviers de Redhouse" (basé sur l'image)
        template_data = {
            'id': str(uuid.uuid4()),
            'title': 'Les Oliviers de Redhouse',
            'hotel_name': 'Les Oliviers de Redhouse',
            'username': 'lesoliviersderedhouse',
            'property': 'hotel',  # Type de propriété
            'country': 'France',
            'video_link': 'https://www.instagram.com/p/_EXEMPLE_/',
            'account_link': 'https://www.instagram.com/lesoliviersderedhouse',
            'followers': 200000,
            'views': 962443,
            'likes': 51000,
            'comments': 1350,
            'duration': 30.0,
            'script': '''{"clips":[{"order":1,"duration":8.0,"description":"Petit déjeuner luxueux français servi dans un cadre élégant avec croissants dorés, confitures artisanales et café fraîchement moulu"},{"order":2,"duration":7.5,"description":"Table dressée avec nappe blanche, porcelaine fine et vue sur jardin méditerranéen avec oliviers"},{"order":3,"duration":8.5,"description":"Chef en cuisine préparant des spécialités françaises avec des ingrédients locaux de Provence"},{"order":4,"duration":6.0,"description":"Terrasse ensoleillée avec vue panoramique, invités savourant leur repas dans l'authenticité française"}],"texts":[{"content":"Petit Déjeuner à la Française 🥐","start_time":0},{"content":"L'Art de Vivre Provençal","start_time":8},{"content":"Réservez Votre Table","start_time":23.5}]}'''
        }
        
        # Insert
        sql = """
            INSERT INTO viral_video_templates (
                id, title, hotel_name, username, property, country,
                video_link, account_link, followers, views, likes,
                comments, duration, script
            ) VALUES (
                %(id)s, %(title)s, %(hotel_name)s, %(username)s, %(property)s, %(country)s,
                %(video_link)s, %(account_link)s, %(followers)s, %(views)s, %(likes)s,
                %(comments)s, %(duration)s, %(script)s
            )
        """
        
        cursor.execute(sql, template_data)
        conn.commit()
        
        logger.info("✅ Template 'Les Oliviers de Redhouse' ajouté avec succès!")
        
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    add_oliviers_template()