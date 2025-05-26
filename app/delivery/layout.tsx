import type React from "react"
import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const nunito = Nunito({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "外送員儀表板",
  description: "外送員管理介面",
}

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={nunito.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
