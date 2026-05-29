import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Distributed Rate Limiter',
  description: 'Real-time Sliding Window Counter Rate Limiter powered by Redis and Spring Boot',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
