import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/tokens.css'
import { Providers } from '@/components/providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Hospup-SaaS - AI Video Generation for Properties',
  description: 'Generate viral videos for your hotels, Airbnb, restaurants and vacation rentals with AI',
  keywords: ['AI', 'video generation', 'hotels', 'airbnb', 'restaurants', 'viral videos'],
  authors: [{ name: 'Hospup Team' }],
  openGraph: {
    title: 'Hospup-SaaS - AI Video Generation',
    description: 'Generate viral videos for your properties with AI',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-inter antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}