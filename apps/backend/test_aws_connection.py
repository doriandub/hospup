#!/usr/bin/env python3
"""
Test de connexion AWS RDS avec diagnostic
"""

import psycopg2
import socket
import ssl
from datetime import datetime

def test_network_connection():
    """Tester la connectivité réseau brute"""
    host = "hospup-db2.checoia2yosk.eu-west-1.rds.amazonaws.com"
    port = 5432
    
    print(f"🌐 Test de connectivité réseau vers {host}:{port}")
    
    try:
        # Test socket brut
        sock = socket.create_connection((host, port), timeout=10)
        print("✅ Connexion socket réussie")
        sock.close()
        return True
    except socket.timeout:
        print("❌ Timeout - Security Groups ou firewall bloque")
        return False
    except socket.gaierror as e:
        print(f"❌ Erreur DNS: {e}")
        return False
    except ConnectionRefusedError:
        print("❌ Connexion refusée - Service arrêté?")
        return False
    except Exception as e:
        print(f"❌ Erreur réseau: {e}")
        return False

def test_postgresql_connection():
    """Tester la connexion PostgreSQL complète"""
    connection_params = {
        'host': 'hospup-db2.checoia2yosk.eu-west-1.rds.amazonaws.com',
        'port': 5432,
        'database': 'postgres',
        'user': 'postgres',
        'password': 'bSE10GhpRKVigbkEnzBG',
        'sslmode': 'require',
        'connect_timeout': 10
    }
    
    print(f"\n🗄️ Test de connexion PostgreSQL...")
    print(f"📍 Host: {connection_params['host']}")
    print(f"🔐 User: {connection_params['user']}")
    print(f"🔒 SSL: {connection_params['sslmode']}")
    
    try:
        # Connexion PostgreSQL
        conn = psycopg2.connect(**connection_params)
        cursor = conn.cursor()
        
        # Test de base
        cursor.execute('SELECT version();')
        version = cursor.fetchone()[0]
        print(f"✅ Connexion PostgreSQL réussie!")
        print(f"📊 Version: {version[:50]}...")
        
        # Test permissions
        cursor.execute('SELECT current_database(), current_user;')
        db_info = cursor.fetchone()
        print(f"🏢 Base: {db_info[0]}, Utilisateur: {db_info[1]}")
        
        conn.close()
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Erreur PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
        return False

def test_alternative_methods():
    """Tester des méthodes alternatives"""
    print(f"\n🔧 SOLUTIONS POSSIBLES:")
    print(f"1. Attendre 5 minutes (propagation AWS)")
    print(f"2. Vérifier VPC/Subnet Groups dans RDS")
    print(f"3. Vérifier région AWS (eu-west-1)")
    print(f"4. Essayer connexion depuis IP différente")
    print(f"5. Basculer vers Railway.app (plus simple)")

if __name__ == "__main__":
    print("🚀 DIAGNOSTIC CONNEXION AWS RDS")
    print("=" * 50)
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Connectivité réseau
    network_ok = test_network_connection()
    
    if network_ok:
        # Test 2: PostgreSQL
        pg_ok = test_postgresql_connection()
        
        if pg_ok:
            print(f"\n🎉 CONNEXION OK - Peux lancer la migration!")
        else:
            print(f"\n❌ Problème d'authentification PostgreSQL")
    else:
        print(f"\n❌ Problème réseau/sécurité AWS")
        test_alternative_methods()