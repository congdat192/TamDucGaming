import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Santa Jump - Mắt Kính Tâm Đức',
  description: 'Chơi game Giáng Sinh, nhận voucher hấp dẫn từ Mắt Kính Tâm Đức!',
  keywords: 'game, giáng sinh, noel, voucher, mắt kính, tâm đức',
  openGraph: {
    title: 'Santa Jump - Mắt Kính Tâm Đức',
    description: 'Chơi game Giáng Sinh, nhận voucher hấp dẫn!',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
