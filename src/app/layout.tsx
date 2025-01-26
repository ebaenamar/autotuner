import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Real-Time AutoTune',
  description: 'Web-based autotune with interval selection',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900`}>
        <div className="min-h-screen p-4 md:p-8">
          {children}
        </div>
      </body>
    </html>
  )
}
