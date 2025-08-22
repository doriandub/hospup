"use client";

export default function Error({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }
  reset: () => void 
}) {
  return (
    <main className="p-6">
      <h2 className="text-xl font-semibold text-red-600">Something went wrong!</h2>
      <pre className="mt-3 whitespace-pre-wrap text-sm opacity-80 bg-gray-100 p-4 rounded">
        {error.message}
      </pre>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600">Stack trace</summary>
        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
          {error.stack}
        </pre>
      </details>
      <button 
        onClick={() => reset()} 
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </main>
  );
}