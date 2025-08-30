export default function DebugPage() {
  return (
    <div className="p-8 bg-red-100">
      <h1 className="text-2xl font-bold text-blue-600">🔧 Debug Page</h1>
      <p className="mt-4 text-green-700">Si tu vois ça avec des couleurs, Tailwind fonctionne !</p>
      <div className="mt-4 p-4 bg-yellow-200 border-2 border-black">
        <p>Test des styles Tailwind</p>
      </div>
      <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        Test Button
      </button>
    </div>
  )
}