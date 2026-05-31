import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PakLaw AI — Pakistan Legal Assistant',
  description: 'AI-powered chatbot for Pakistani law. Get instant answers on the Constitution, PPC, CPC, family law, property law, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
