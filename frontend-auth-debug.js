// Script de debug pour tester l'authentification sur hospup.vercel.app
// À coller dans la console F12 de https://hospup.vercel.app

console.log('🔍 DEBUG AUTHENTIFICATION FRONTEND');

// 1. Vérifier les variables d'environnement 
const API_URL = 'https://hospup-backend.onrender.com';
console.log('📡 API_URL:', API_URL);

// 2. Test de connectivité de base
async function testBackendConnectivity() {
  try {
    console.log('🏥 Test connectivité backend...');
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('✅ Backend accessible:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend inaccessible:', error);
    return false;
  }
}

// 3. Test inscription
async function testRegistration() {
  try {
    console.log('📝 Test inscription...');
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Debug User',
        email: `debug${Date.now()}@example.com`,
        password: 'password123'
      })
    });

    console.log('📊 Registration status:', response.status);
    console.log('📊 Registration headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Registration successful:', data);
      return data.access_token;
    } else {
      const errorText = await response.text();
      console.error('❌ Registration failed:', response.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    return null;
  }
}

// 4. Test connexion
async function testLogin() {
  try {
    console.log('🔑 Test connexion...');
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'frontendtest@example.com',
        password: 'password123'
      })
    });

    console.log('📊 Login status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful:', data);
      return data.access_token;
    } else {
      const errorText = await response.text();
      console.error('❌ Login failed:', response.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return null;
  }
}

// 5. Lancer tous les tests
async function runAllTests() {
  console.log('🚀 Lancement de tous les tests...');
  
  const isBackendUp = await testBackendConnectivity();
  if (!isBackendUp) {
    console.error('🛑 Backend inaccessible - arrêt des tests');
    return;
  }
  
  const registerToken = await testRegistration();
  const loginToken = await testLogin();
  
  console.log('📋 RÉSUMÉ:');
  console.log('- Backend accessible:', isBackendUp ? '✅' : '❌');
  console.log('- Registration fonctionne:', registerToken ? '✅' : '❌');
  console.log('- Login fonctionne:', loginToken ? '✅' : '❌');
  
  if (registerToken || loginToken) {
    console.log('🎉 Authentification backend fonctionnelle !');
    console.log('💡 Si le frontend ne fonctionne pas, vérifier les composants React');
  }
}

runAllTests();