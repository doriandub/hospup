#!/usr/bin/env python3
"""
Script de synchronisation Airtable vers PostgreSQL pour les vidéos virales.
Synchronise les données d'Airtable vers la table viral_video_templates.
"""

import os
import sys
import logging
from typing import Dict, Any, List, Optional
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from pyairtable import Api

# Configuration
AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY", "")
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID", "")
AIRTABLE_TABLE_NAME = os.getenv("AIRTABLE_TABLE_NAME", "Viral Videos-Grid view (1)")

# PostgreSQL configuration
POSTGRES_URL = "postgresql://postgres:bSE10GhpRKVigbkEnzBG@hospup-db2.checoia2yosk.eu-west-1.rds.amazonaws.com:5432/postgres"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AirtableToPostgreSyncr:
    def __init__(self):
        if not AIRTABLE_API_KEY or not AIRTABLE_BASE_ID:
            raise ValueError("AIRTABLE_API_KEY et AIRTABLE_BASE_ID doivent être configurés")
        
        self.airtable = Api(AIRTABLE_API_KEY)
        self.table = self.airtable.table(AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME)
        self.pg_conn = None
        
    def connect_postgres(self):
        """Connexion à PostgreSQL"""
        try:
            self.pg_conn = psycopg2.connect(POSTGRES_URL, cursor_factory=RealDictCursor)
            logger.info("Connexion PostgreSQL établie")
        except Exception as e:
            logger.error(f"Erreur connexion PostgreSQL: {e}")
            raise
    
    def get_airtable_records(self) -> List[Dict[str, Any]]:
        """Récupère tous les enregistrements d'Airtable"""
        try:
            records = self.table.all()
            logger.info(f"Récupération de {len(records)} enregistrements d'Airtable")
            return records
        except Exception as e:
            logger.error(f"Erreur récupération Airtable: {e}")
            return []
    
    def map_airtable_to_postgres(self, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Mappe un enregistrement Airtable vers le format PostgreSQL"""
        try:
            fields = record.get('fields', {})
            
            # Mapping des champs Airtable vers PostgreSQL
            mapped = {
                'id': str(uuid.uuid4()),  # Nouveau UUID pour PostgreSQL
                'title': fields.get('Hotel name', ''),  # Utilise Hotel name comme title
                'hotel_name': fields.get('Hotel name', ''),
                'username': fields.get('Username', ''),
                'property': fields.get('Property', ''),
                'country': fields.get('Country', ''),
                'video_link': fields.get('Video link', ''),
                'account_link': fields.get('Account link', ''),
                'followers': self._safe_int(fields.get('Followers')),
                'views': self._safe_int(fields.get('Views')),
                'likes': self._safe_int(fields.get('Likes')),
                'comments': self._safe_int(fields.get('Comments')),
                'duration': self._safe_float(fields.get('Duration')),
                'script': fields.get('Script', '')  # Le script JSON
            }
            
            return mapped
            
        except Exception as e:
            logger.error(f"Erreur mapping enregistrement {record.get('id')}: {e}")
            return None
    
    def _safe_int(self, value) -> int:
        """Conversion sécurisée vers int"""
        if value is None:
            return 0
        try:
            return int(float(str(value)))
        except (ValueError, TypeError):
            return 0
    
    def _safe_float(self, value) -> float:
        """Conversion sécurisée vers float"""
        if value is None:
            return 0.0
        try:
            return float(str(value))
        except (ValueError, TypeError):
            return 0.0
    
    def clear_existing_data(self):
        """Vide la table viral_video_templates (optionnel)"""
        try:
            cursor = self.pg_conn.cursor()
            cursor.execute("DELETE FROM viral_video_templates")
            self.pg_conn.commit()
            logger.info("Table viral_video_templates vidée")
        except Exception as e:
            logger.error(f"Erreur vidage table: {e}")
            self.pg_conn.rollback()
    
    def insert_record(self, record: Dict[str, Any]) -> bool:
        """Insert un enregistrement dans PostgreSQL"""
        try:
            cursor = self.pg_conn.cursor()
            
            # Prépare la requête d'insertion
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
            
            cursor.execute(sql, record)
            self.pg_conn.commit()
            return True
            
        except Exception as e:
            logger.error(f"Erreur insertion {record.get('hotel_name')}: {e}")
            self.pg_conn.rollback()
            return False
    
    def sync(self, clear_existing: bool = False):
        """Synchronisation complète Airtable -> PostgreSQL"""
        logger.info("🚀 Début de la synchronisation Airtable -> PostgreSQL")
        
        # Connexions
        self.connect_postgres()
        
        # Optionnel : vider la table existante
        if clear_existing:
            self.clear_existing_data()
        
        # Récupère les données d'Airtable
        airtable_records = self.get_airtable_records()
        
        # Traitement des enregistrements
        success_count = 0
        error_count = 0
        
        for record in airtable_records:
            # Mappe vers le format PostgreSQL
            mapped_record = self.map_airtable_to_postgres(record)
            
            if mapped_record:
                # Insert dans PostgreSQL
                if self.insert_record(mapped_record):
                    success_count += 1
                    logger.info(f"✅ Synchronisé: {mapped_record['hotel_name']}")
                else:
                    error_count += 1
            else:
                error_count += 1
        
        # Ferme la connexion
        if self.pg_conn:
            self.pg_conn.close()
        
        logger.info(f"🎉 Synchronisation terminée: {success_count} succès, {error_count} erreurs")
        return success_count, error_count

def main():
    """Fonction principale"""
    try:
        syncer = AirtableToPostgreSyncr()
        
        # Lance la synchronisation (avec clear_existing=True pour repartir à zéro)
        success, errors = syncer.sync(clear_existing=True)
        
        if errors == 0:
            logger.info("✅ Synchronisation réussie sans erreur!")
        else:
            logger.warning(f"⚠️ Synchronisation terminée avec {errors} erreurs")
            
    except Exception as e:
        logger.error(f"❌ Erreur critique: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()