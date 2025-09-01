#!/usr/bin/env node

// Script de test d'intégration frontend-backend
const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://hospup-backend.onrender.com';
const FRONTEND_ORIGIN = 'https://hospup.vercel.app';

// Couleurs pour les logs
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: options.method || 'GET',
            headers: {
                'Origin': FRONTEND_ORIGIN,
                'Content-Type': 'application/json',
                'User-Agent': 'Integration-Test/1.0',
                ...options.headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data,
                    success: res.statusCode >= 200 && res.statusCode < 300
                });
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

async function runTests() {
    log('bold', '\n🚀 TEST D\'INTÉGRATION HOSPUP FRONTEND ↔ BACKEND\n');
    
    const tests = [
        {
            name: 'Health Check',
            url: `${BACKEND_URL}/health`,
            expectedStatus: 200
        },
        {
            name: 'Root Endpoint',
            url: `${BACKEND_URL}/`,
            expectedStatus: 200
        },
        {
            name: 'Debug Info',
            url: `${BACKEND_URL}/debug`,
            expectedStatus: 200
        },
        {
            name: 'Test Endpoint',
            url: `${BACKEND_URL}/test`,
            expectedStatus: 200
        },
        {
            name: 'CORS Preflight (OPTIONS)',
            url: `${BACKEND_URL}/health`,
            method: 'OPTIONS',
            headers: {
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            },
            expectedStatus: 200
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            log('blue', `\n📋 Test: ${test.name}`);
            log('yellow', `   URL: ${test.url}`);
            
            const result = await makeRequest(test.url, {
                method: test.method,
                headers: test.headers
            });
            
            if (result.success && result.statusCode === test.expectedStatus) {
                log('green', `   ✅ SUCCESS (${result.statusCode})`);
                
                // Afficher les infos CORS importantes
                if (result.headers['access-control-allow-origin']) {
                    log('green', `   🌐 CORS Origin: ${result.headers['access-control-allow-origin']}`);
                }
                
                // Afficher la réponse si c'est du JSON
                try {
                    const jsonData = JSON.parse(result.data);
                    if (test.name === 'Health Check') {
                        log('blue', `   💓 Status: ${jsonData.status}`);
                        log('blue', `   🔗 Redis: ${jsonData.redis_connected ? 'Connected' : 'Disconnected'}`);
                    }
                    if (test.name === 'Debug Info') {
                        log('blue', `   🏷️  App: ${jsonData.app_name}`);
                        log('blue', `   🌍 Env: ${jsonData.environment}`);
                    }
                } catch (e) {
                    // Pas du JSON, pas grave
                }
                
                passed++;
            } else {
                log('red', `   ❌ FAILED (${result.statusCode}, expected ${test.expectedStatus})`);
                if (result.data) {
                    log('red', `   📄 Response: ${result.data.substring(0, 200)}`);
                }
                failed++;
            }
            
        } catch (error) {
            log('red', `   ❌ ERROR: ${error.message}`);
            failed++;
        }
    }
    
    log('bold', `\n📊 RÉSULTATS:`);
    log('green', `   ✅ Tests réussis: ${passed}`);
    log('red', `   ❌ Tests échoués: ${failed}`);
    log('blue', `   📈 Total: ${passed + failed}`);
    
    if (failed === 0) {
        log('bold', '\n🎉 INTÉGRATION RÉUSSIE ! Le backend est prêt pour le frontend.\n');
        
        log('yellow', '📋 PROCHAINES ÉTAPES:');
        log('blue', '   1. Teste depuis ton frontend Vercel');
        log('blue', '   2. Vérifie l\'authentification');
        log('blue', '   3. Teste les uploads de fichiers');
        log('blue', '   4. Vérifie les WebSockets si utilisés\n');
        
        return true;
    } else {
        log('bold', '\n⚠️  Certains tests ont échoué. Vérifier la configuration.\n');
        return false;
    }
}

// Test spécifique d'authentification
async function testAuth() {
    log('bold', '\n🔐 TEST D\'AUTHENTIFICATION\n');
    
    try {
        // Test endpoint d'auth (si disponible)
        const authTest = await makeRequest(`${BACKEND_URL}/api/v1/auth/test`, {
            method: 'GET'
        });
        
        if (authTest.statusCode === 404) {
            log('yellow', '⚠️  Endpoint auth/test non trouvé (normal si pas implémenté)');
        } else if (authTest.statusCode === 401) {
            log('green', '✅ Authentification requise (comportement attendu)');
        } else {
            log('blue', `ℹ️  Auth response: ${authTest.statusCode}`);
        }
        
    } catch (error) {
        log('red', `❌ Erreur auth test: ${error.message}`);
    }
}

// Exécuter les tests
runTests().then(success => {
    if (success) {
        testAuth();
    }
    process.exit(success ? 0 : 1);
});