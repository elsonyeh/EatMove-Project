// 簡單的日誌工具
const isDevelopment = process.env.NODE_ENV === 'development'
const isVerbose = process.env.VERBOSE_LOGS === 'true'

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (isDevelopment && isVerbose) {
      console.log(`ℹ️ ${message}`, ...args)
    }
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`❌ ${message}`, ...args)
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, ...args)
    }
  },
  
  success: (message: string, ...args: any[]) => {
    if (isDevelopment && isVerbose) {
      console.log(`✅ ${message}`, ...args)
    }
  }
} 