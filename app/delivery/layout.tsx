import type React from "react"
import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import "@/globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const nunito = Nunito({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EatMove - 美食外送平台",
  description: "EatMove - 連接美食與您的生活，快速送達您的味蕾",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={nunito.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
