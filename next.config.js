/** @type {import('next').NextConfig} */
const nextConfig = {
    // 減少開發模式下的日誌輸出
    logging: {
        fetches: {
            fullUrl: false,
        },
    },
    // 配置允許的外部圖片域名
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
                port: '',
                pathname: '/**',
            }
        ],
        // 優化圖片載入
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    // 實驗性功能
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },
    // 優化CSS載入
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    // 其他配置...
}

export default nextConfig 