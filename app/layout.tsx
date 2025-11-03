import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Manager Data Entry',
  description: 'Address validation and mapping tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
