// Script de debug avancé pour hospup.vercel.app
// À coller dans la console F12 de https://hospup.vercel.app

console.log('🔬 DEBUG AVANCÉ AUTHENTIFICATION FRONTEND');

const API_URL = 'https://hospup-backend.onrender.com';

// Test de l'API exactement comme le fait axios
async function testWithAxiosLike() {
  console.log('📡 Test avec configuration axios-like...');
  
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Frontend Debug User',
        email: `debug${Date.now()}@example.com`,
        password: 'Password123'
      }),
      timeout: 10000, // Même timeout qu'axios
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    console.log('📊 Response headers:');
    for (let [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const data = await response.json();
    console.log('📋 Response data:', data);
    
    // Test de la déstructuration exacte du frontend
    const { access_token, refresh_token, user } = data;
    console.log('🔑 Extracted tokens:', {
      access_token: access_token ? access_token.substring(0, 30) + '...' : 'MISSING',
      refresh_token: refresh_token ? refresh_token.substring(0, 30) + '...' : 'MISSING',
      user: user ? user : 'MISSING'
    });
    
    // Test localStorage
    if (access_token) {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('✅ Tokens stored in localStorage');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Fetch error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'AbortError') {
      console.error('🕐 Timeout error - backend too slow');
    } else if (error.name === 'TypeError') {
      console.error('🌐 Network error - CORS or connectivity issue');
    }
    
    return false;
  }
}

// Test en simulant exactement axios
async function testWithAxiosSimulation() {
  console.log('📡 Test avec simulation axios complète...');
  
  try {
    // Créer un AbortController pour le timeout comme axios
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Axios Simulation User',
        email: `axios${Date.now()}@example.com`,
        password: 'Password123'
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // Simuler l'erreur axios
      const errorData = await response.text();
      const axiosError = new Error(`Request failed with status ${response.status}`);
      axiosError.response = {
        status: response.status,
        data: errorData,
        statusText: response.statusText
      };
      throw axiosError;
    }
    
    const data = await response.json();
    
    // Simuler l'objet response d'axios
    const axiosResponse = {
      data: data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config: {}
    };
    
    console.log('✅ Axios simulation successful:', axiosResponse);
    return axiosResponse;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      error.message = 'timeout of 10000ms exceeded';
    }
    console.error('❌ Axios simulation error:', error);
    throw error;
  }
}

// Test complet
async function runCompleteTest() {
  console.log('🚀 Lancement du test complet...');
  
  console.log('\n--- Test 1: Fetch natif ---');
  const fetchResult = await testWithAxiosLike();
  
  console.log('\n--- Test 2: Simulation axios ---');
  try {
    const axiosResult = await testWithAxiosSimulation();
    console.log('✅ Axios simulation passed');
  } catch (error) {
    console.error('❌ Axios simulation failed:', error.message);
  }
  
  console.log('\n--- Résumé ---');
  console.log('- Fetch natif:', fetchResult ? '✅' : '❌');
  console.log('- Backend accessible:', fetchResult ? '✅' : '❌');
  
  if (fetchResult) {
    console.log('🎉 Le backend fonctionne parfaitement !');
    console.log('💡 Le problème est probablement dans le composant React ou axios');
    
    // Test des variables d'environnement frontend
    console.log('\n--- Variables d\'environnement ---');
    console.log('window.location.origin:', window.location.origin);
    console.log('process?.env?.NEXT_PUBLIC_API_URL:', typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_API_URL : 'undefined');
  } else {
    console.log('❌ Problème de connectivité avec le backend');
  }
}

runCompleteTest();