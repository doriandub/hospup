# Landing Page Integration Guide

## Fichier créé
`/src/components/Landing.tsx` - Page landing complète React + Tailwind

## Intégration Next.js

### Option 1: Page dédiée
Créer `/src/app/landing/page.tsx`:

```tsx
import Landing from '@/components/Landing'

export const metadata = {
  title: 'Hospup - Create Viral Hotel Clips in Seconds',
  description: 'The all-in-one tool for hoteliers to generate AI voiceovers, on-brand subtitles, and trend-ready Reels.',
  keywords: 'hotel marketing, viral videos, AI content, social media for hotels'
}

export default function LandingPage() {
  return <Landing />
}
```

### Option 2: Page d'accueil
Remplacer le contenu de `/src/app/page.tsx`:

```tsx
import Landing from '@/components/Landing'

export const metadata = {
  title: 'Hospup - Create Viral Hotel Clips in Seconds',
  description: 'The all-in-one tool for hoteliers to generate AI voiceovers, on-brand subtitles, and trend-ready Reels.'
}

export default function Home() {
  return <Landing />
}
```

## Intégration Vite/React

```tsx
import Landing from './components/Landing'

function App() {
  return <Landing />
}

export default App
```

## Dépendances requises

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

## Configuration Tailwind

Ajouter à `tailwind.config.js`:

```js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  }
}
```

## Police Inter

Ajouter dans `layout.tsx` (Next.js):

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

Ou dans `index.html` (Vite):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## Fonctionnalités incluses

✅ **Responsive** - Mobile, tablet, desktop  
✅ **Accessibilité** - ARIA labels, navigation keyboard  
✅ **SEO-friendly** - Balises sémantiques, headings structurés  
✅ **Performance** - Pas de libs lourdes, animations CSS optimisées  
✅ **Animations** - Hover effects, transitions fluides  
✅ **Composants interactifs** - Onglets, accordéons, carousel  

## Personnalisation

### Couleurs (CSS Variables)
```css
:root {
  --brand: #115446;    /* Vert principal */
  --accent: #ff914d;   /* Orange CTA */
  --ink: #0b1220;      /* Texte principal */
  --muted: #6b7280;    /* Texte secondaire */
  --bg: #fafafa;       /* Fond clair */
}
```

### Contenu
Modifier l'objet `landingData` en haut du fichier `Landing.tsx`

### Logo
Remplacer le composant `Logo` par votre propre SVG/image

## Test
```bash
npm run dev
# Naviguer vers http://localhost:3000
```

La page est prête à utiliser et entièrement fonctionnelle !