#!/usr/bin/env python3
"""
Script de synchronisation complète Airtable -> PostgreSQL
Remplace toutes les données existantes par celles d'Airtable
"""

import os
import sys
import logging
from typing import Dict, Any, List, Optional
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from pyairtable import Api

# Configuration - À REMPLIR AVEC TES VRAIES CLÉS
AIRTABLE_API_KEY = "pat2nW4NiGevOD9Zj.ad544908afd213120026c690772887323dc2025780012a03aa2f7613395721d8"
AIRTABLE_BASE_ID = "appWktKeiUfbmhc0U"  
AIRTABLE_TABLE_NAME = "Viral Videos"

# PostgreSQL configuration
POSTGRES_URL = "postgresql://postgres:bSE10GhpRKVigbkEnzBG@hospup-db2.checoia2yosk.eu-west-1.rds.amazonaws.com:5432/postgres"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AirtableFullSync:
    def __init__(self, api_key: str, base_id: str, table_name: str):
        if not api_key or api_key == "VOTRE_CLE_API_AIRTABLE":
            raise ValueError("❌ AIRTABLE_API_KEY doit être configuré avec ta vraie clé API")
        
        if not base_id or base_id == "VOTRE_BASE_ID":
            raise ValueError("❌ AIRTABLE_BASE_ID doit être configuré avec ton vrai base ID")
        
        self.airtable = Api(api_key)
        self.table = self.airtable.table(base_id, table_name)
        self.pg_conn = None
        
    def connect_postgres(self):
        """Connexion à PostgreSQL"""
        try:
            self.pg_conn = psycopg2.connect(POSTGRES_URL, cursor_factory=RealDictCursor)
            logger.info("✅ Connexion PostgreSQL établie")
        except Exception as e:
            logger.error(f"❌ Erreur connexion PostgreSQL: {e}")
            raise
    
    def get_airtable_records(self) -> List[Dict[str, Any]]:
        """Récupère TOUS les enregistrements d'Airtable"""
        try:
            logger.info("📥 Récupération des données d'Airtable...")
            records = self.table.all()
            logger.info(f"✅ {len(records)} enregistrements récupérés d'Airtable")
            return records
        except Exception as e:
            logger.error(f"❌ Erreur récupération Airtable: {e}")
            return []
    
    def clear_postgres_table(self):
        """Vide complètement la table PostgreSQL"""
        try:
            cursor = self.pg_conn.cursor()
            cursor.execute("DELETE FROM viral_video_templates")
            self.pg_conn.commit()
            logger.info("🗑️ Table viral_video_templates vidée complètement")
        except Exception as e:
            logger.error(f"❌ Erreur vidage table: {e}")
            self.pg_conn.rollback()
            raise
    
    def map_airtable_to_postgres(self, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Mappe un enregistrement Airtable vers le format PostgreSQL"""
        try:
            fields = record.get('fields', {})
            
            # Affiche les champs disponibles pour debug
            logger.debug(f"Champs disponibles: {list(fields.keys())}")
            
            # Mapping des champs Airtable vers PostgreSQL (EXACT selon ta structure)
            mapped = {
                'id': str(uuid.uuid4()),
                'title': fields.get('Titre', '') or fields.get('Hotel name', ''),  # Titre au lieu de Title
                'hotel_name': fields.get('Hotel name', ''),
                'username': fields.get('Username', ''),
                'property': fields.get('Property', ''),
                'country': fields.get('Country', ''),
                'video_link': fields.get('Video link', ''),
                'account_link': fields.get('Account link', ''),
                'followers': self._safe_int(fields.get('Followers', 0)),
                'views': self._safe_int(fields.get('Views', 0)),
                'likes': self._safe_int(fields.get('Likes', 0)),
                'comments': self._safe_int(fields.get('Comments', 0)),
                'duration': self._safe_float(fields.get('Duration', 30.0)),
                'script': fields.get('Script', '') or '',
                'audio_url': fields.get('Audio', ''),  # Nouveau champ Audio
                'ratio': self._safe_float(fields.get('Ratio', 1.0))  # Nouveau champ Ratio
            }
            
            # Log pour debug
            logger.debug(f"📋 Mapped: {mapped['hotel_name']} - {mapped['country']}")
            
            return mapped
            
        except Exception as e:
            logger.error(f"❌ Erreur mapping enregistrement {record.get('id')}: {e}")
            return None
    
    def _safe_int(self, value) -> int:
        """Conversion sécurisée vers int"""
        if value is None:
            return 0
        try:
            # Gère les formats avec "K", "M" etc.
            if isinstance(value, str):
                value = value.replace(',', '').replace(' ', '').upper()
                if 'K' in value:
                    return int(float(value.replace('K', '')) * 1000)
                elif 'M' in value:
                    return int(float(value.replace('M', '')) * 1000000)
            return int(float(str(value)))
        except (ValueError, TypeError):
            return 0
    
    def _safe_float(self, value) -> float:
        """Conversion sécurisée vers float"""
        if value is None:
            return 30.0  # Durée par défaut
        try:
            return float(str(value))
        except (ValueError, TypeError):
            return 30.0
    
    def insert_record(self, record: Dict[str, Any]) -> bool:
        """Insert un enregistrement dans PostgreSQL"""
        try:
            cursor = self.pg_conn.cursor()
            
            sql = """
                INSERT INTO viral_video_templates (
                    id, title, hotel_name, username, property, country,
                    video_link, account_link, followers, views, likes,
                    comments, duration, script, audio_url, ratio
                ) VALUES (
                    %(id)s, %(title)s, %(hotel_name)s, %(username)s, %(property)s, %(country)s,
                    %(video_link)s, %(account_link)s, %(followers)s, %(views)s, %(likes)s,
                    %(comments)s, %(duration)s, %(script)s, %(audio_url)s, %(ratio)s
                )
            """
            
            cursor.execute(sql, record)
            self.pg_conn.commit()
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur insertion {record.get('hotel_name', 'Unknown')}: {e}")
            self.pg_conn.rollback()
            return False
    
    def sync_full(self):
        """Synchronisation complète avec remplacement total"""
        logger.info("🚀 DÉBUT DE LA SYNCHRONISATION COMPLÈTE AIRTABLE -> POSTGRESQL")
        
        # Connexion
        self.connect_postgres()
        
        # 1. Vider la table PostgreSQL
        self.clear_postgres_table()
        
        # 2. Récupérer toutes les données d'Airtable
        airtable_records = self.get_airtable_records()
        
        if not airtable_records:
            logger.error("❌ Aucune donnée récupérée d'Airtable")
            return False
        
        # 3. Traitement et insertion
        success_count = 0
        error_count = 0
        
        for i, record in enumerate(airtable_records, 1):
            logger.info(f"📝 Traitement {i}/{len(airtable_records)}")
            
            # Mappe vers PostgreSQL
            mapped_record = self.map_airtable_to_postgres(record)
            
            if mapped_record:
                if self.insert_record(mapped_record):
                    success_count += 1
                    logger.info(f"✅ Synchronisé: {mapped_record['hotel_name']} ({mapped_record['country']})")
                else:
                    error_count += 1
            else:
                error_count += 1
        
        # 4. Fermeture
        if self.pg_conn:
            self.pg_conn.close()
        
        # 5. Résumé
        logger.info("="*60)
        logger.info(f"🎉 SYNCHRONISATION TERMINÉE")
        logger.info(f"✅ Succès: {success_count}")
        logger.info(f"❌ Erreurs: {error_count}")
        logger.info(f"📊 Total traité: {len(airtable_records)}")
        logger.info("="*60)
        
        return error_count == 0

def main():
    """Fonction principale"""
    logger.info("🔄 Démarrage de la synchronisation Airtable -> PostgreSQL")
    
    # Vérification des paramètres
    if AIRTABLE_API_KEY == "VOTRE_CLE_API_AIRTABLE":
        logger.error("❌ Configure d'abord AIRTABLE_API_KEY dans le script!")
        logger.error("💡 Ouvre sync_airtable_full.py et remplace 'VOTRE_CLE_API_AIRTABLE' par ta vraie clé")
        sys.exit(1)
    
    if AIRTABLE_BASE_ID == "VOTRE_BASE_ID":
        logger.error("❌ Configure d'abord AIRTABLE_BASE_ID dans le script!")
        logger.error("💡 Ouvre sync_airtable_full.py et remplace 'VOTRE_BASE_ID' par ton vrai base ID")
        sys.exit(1)
    
    try:
        syncer = AirtableFullSync(
            api_key=AIRTABLE_API_KEY,
            base_id=AIRTABLE_BASE_ID,
            table_name=AIRTABLE_TABLE_NAME
        )
        
        success = syncer.sync_full()
        
        if success:
            logger.info("🎉 SYNCHRONISATION RÉUSSIE ! Toutes les données d'Airtable sont maintenant dans PostgreSQL")
        else:
            logger.warning("⚠️ Synchronisation terminée avec des erreurs")
            
    except Exception as e:
        logger.error(f"❌ ERREUR CRITIQUE: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()