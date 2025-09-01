// Script de debug pour tester l'upload directement depuis le navigateur
// À coller dans la console F12 de https://hospup.vercel.app

console.log('🔍 DEBUG UPLOAD - Début du test');

// Test 1: Vérifier les variables d'environnement
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hospup-backend.onrender.com';
console.log('📡 API_URL configurée:', API_URL);

// Test 2: Vérifier l'authentification
const token = localStorage.getItem('access_token');
if (!token) {
  console.error('❌ Pas de token d\'authentification!');
} else {
  console.log('✅ Token présent:', token.substring(0, 50) + '...');
}

// Test 3: Tester la connectivité backend
async function testBackendConnection() {
  try {
    console.log('🏥 Test de connexion backend...');
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('✅ Backend accessible:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend inaccessible:', error);
    return false;
  }
}

// Test 4: Simuler l'appel presigned-url
async function testPresignedUrl() {
  try {
    console.log('📋 Test presigned URL...');
    const response = await fetch(`${API_URL}/api/v1/upload/presigned-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_name: 'test.mp4',
        content_type: 'video/mp4', 
        property_id: 'test-property-id',
        file_size: 1000000
      })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', [...response.headers.entries()]);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Presigned URL failed:', response.status, errorText);
    } else {
      const data = await response.json();
      console.log('✅ Presigned URL success:', data);
    }
  } catch (error) {
    console.error('❌ Presigned URL error:', error);
  }
}

// Lancer tous les tests
async function runAllTests() {
  console.log('🚀 Lancement de tous les tests...');
  await testBackendConnection();
  await testPresignedUrl();
  console.log('✅ Tests terminés');
}

runAllTests();