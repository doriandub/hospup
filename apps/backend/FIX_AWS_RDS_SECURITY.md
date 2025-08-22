# 🔧 PROBLÈME: AWS RDS TIMEOUT - SOLUTION

**❌ Erreur**: Connection timeout vers AWS RDS  
**✅ Solution**: Configurer les Security Groups AWS  

## 🛠️ **ÉTAPES DE CORRECTION**

### **1. Aller dans AWS Console**
1. **Console AWS** → EC2 → Security Groups
2. **Trouve le Security Group** de ta base RDS
3. **Edit Inbound Rules**

### **2. Ajouter règle PostgreSQL**
```
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: 0.0.0.0/0 (Anywhere IPv4)
Description: PostgreSQL access
```

### **3. Vérifier la configuration RDS**
1. **RDS Console** → Ta base "hospup-prod"
2. **Connectivity & Security**:
   - ✅ **Public access**: YES
   - ✅ **VPC security groups**: Modifier
   - ✅ **Port**: 5432

### **4. Alternative: Tester avec psql local**
```bash
psql "host=hospup-db.checoia2yosk.eu-west-1.rds.amazonaws.com port=5432 dbname=postgres user=postgres password=9YWI2ejYAaap4RwRM4hT sslmode=require"
```

## 🚀 **SOLUTION RAPIDE: RAILWAY**

Si AWS RDS est compliqué, utilise Railway (plus simple) :

1. **Va sur railway.app**
2. **Connect GitHub**
3. **New Project** → Add PostgreSQL
4. **Copy DATABASE_URL**
5. **Replace dans .env**

**DATABASE_URL format Railway:**
```
postgresql://postgres:password@roundhouse.proxy.rlwy.net:12345/railway
```

## ⚡ **TEST RAPIDE**

Une fois configuré, teste:
```bash
source venv/bin/activate
python migration_to_postgresql.py
```

---

**🎯 Railway = 2 minutes de setup vs AWS RDS = 15 minutes de configuration sécurité**