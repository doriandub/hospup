'use client';

import { useState, useEffect } from 'react';

export default function TestIntegration() {
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-93a0d.up.railway.app';

  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test health endpoint
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setBackendStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (endpoint: string) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();
      console.log(`✅ ${endpoint}:`, data);
      alert(`✅ Success! Check console for details`);
    } catch (err) {
      console.error(`❌ ${endpoint}:`, err);
      alert(`❌ Error: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Test d'Intégration Frontend ↔ Backend
        </h1>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 Status du Backend</h2>
          
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Connexion au backend...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <span className="text-red-600">❌ Erreur: {error}</span>
              </div>
            </div>
          )}

          {backendStatus && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✅ Backend connecté!</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Status:</strong> {backendStatus.status}</p>
                  <p><strong>Environment:</strong> {backendStatus.environment}</p>
                  <p><strong>Redis:</strong> {backendStatus.redis_connected ? '🟢 Connecté' : '🔴 Déconnecté'}</p>
                  <p><strong>Version:</strong> {backendStatus.version}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🔧 Tests d'Endpoints</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => testEndpoint('/health')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Health Check
            </button>
            <button
              onClick={() => testEndpoint('/debug')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Debug Info
            </button>
            <button
              onClick={() => testEndpoint('/test')}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Test Endpoint
            </button>
            <button
              onClick={() => testEndpoint('/')}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
            >
              Root
            </button>
            <button
              onClick={() => testEndpoint('/api/v1/auth/test')}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Auth Test
            </button>
            <button
              onClick={testBackendConnection}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              🔄 Retest
            </button>
          </div>
        </div>

        {/* Configuration Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">⚙️ Configuration</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Backend URL:</strong> {API_URL}</p>
            <p><strong>Frontend Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Server-side'}</p>
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. ✅ Backend Status doit être vert</li>
            <li>2. 🔧 Teste les différents endpoints</li>
            <li>3. 👀 Vérifie la console du navigateur (F12)</li>
            <li>4. 🚀 Si tout fonctionne, ton intégration est réussie!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}