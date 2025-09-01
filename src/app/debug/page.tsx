'use client'

export default function DebugPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hospup-backend.onrender.com'
  
  const testAuth = async () => {
    try {
      console.log('🚀 Testing authentication with:', apiUrl)
      
      const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Debug User',
          email: `debug${Date.now()}@example.com`,
          password: 'Password123'
        })
      })

      console.log('📊 Response status:', response.status)
      console.log('📊 Response ok:', response.ok)

      const data = await response.json()
      console.log('📋 Response data:', data)
      
      if (data.access_token) {
        alert('✅ Registration successful! Check console for details.')
        localStorage.setItem('debug_token', data.access_token)
      } else {
        alert('❌ Registration failed: ' + JSON.stringify(data))
      }
    } catch (error) {
      console.error('❌ Registration error:', error)
      alert('❌ Network error: ' + error.message)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 Debug Authentication</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Environment Variables</h3>
          <p><strong>API URL:</strong> {apiUrl}</p>
          <p><strong>Window location:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
        </div>

        <button 
          onClick={testAuth}
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 font-medium"
        >
          🧪 Test Registration API
        </button>
        
        <div className="p-4 bg-yellow-100 rounded border border-yellow-300">
          <h3 className="font-semibold text-yellow-800">Instructions</h3>
          <ol className="list-decimal list-inside text-yellow-700 mt-2 space-y-1">
            <li>Open browser console (F12)</li>
            <li>Click "Test Registration API"</li>
            <li>Check console for detailed output</li>
            <li>Check if backend is accessible</li>
          </ol>
        </div>

        <div className="p-4 bg-green-100 rounded border border-green-300">
          <h3 className="font-semibold text-green-800">Expected Results</h3>
          <ul className="list-disc list-inside text-green-700 mt-2 space-y-1">
            <li>✅ Status: 200</li>
            <li>✅ Data contains access_token</li>
            <li>✅ Token saved to localStorage</li>
          </ul>
        </div>
      </div>
    </div>
  )
}