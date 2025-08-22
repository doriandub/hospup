import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function DebugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-inter antialiased">
        {/* PAS de Providers ici - layout clean */}
        {children}
      </body>
    </html>
  )
}