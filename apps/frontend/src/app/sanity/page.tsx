"use client";

import * as React from "react";

export default function SanityPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">🔧 Sanity Check</h1>
      <p className="text-gray-600 mb-4">Test hydration, CSS, and client-side functionality</p>
      
      <div className="space-y-4">
        <Counter />
        <StyleTest />
        <ClientOnlyTest />
      </div>
    </main>
  );
}

function Counter() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="border p-4 rounded">
      <h3 className="font-medium mb-2">Counter Test</h3>
      <button 
        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" 
        onClick={() => setCount(count + 1)}
      >
        Count: {count}
      </button>
    </div>
  );
}

function StyleTest() {
  return (
    <div className="border p-4 rounded bg-green-50">
      <h3 className="font-medium mb-2 text-green-800">Tailwind Test</h3>
      <div className="flex space-x-2">
        <div className="w-4 h-4 bg-red-500 rounded"></div>
        <div className="w-4 h-4 bg-blue-500 rounded"></div>
        <div className="w-4 h-4 bg-green-500 rounded"></div>
      </div>
      <p className="text-sm text-green-700 mt-2">If you see colored squares, Tailwind works!</p>
    </div>
  );
}

function ClientOnlyTest() {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <div className="border p-4 rounded bg-yellow-50">
      <h3 className="font-medium mb-2 text-yellow-800">Client-Only Test</h3>
      <p className="text-sm text-yellow-700">
        Mounted: {mounted ? "✅ Yes" : "❌ No"} | 
        Window available: {typeof window !== "undefined" ? "✅ Yes" : "❌ No"}
      </p>
    </div>
  );
}