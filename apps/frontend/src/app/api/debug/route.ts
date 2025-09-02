import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    api_url: process.env.NEXT_PUBLIC_API_URL || 'NOT_SET',
    fallback: 'https://web-production-93a0d.up.railway.app',
    all_env: Object.keys(process.env).filter(k => k.includes('API')),
    timestamp: new Date().toISOString()
  })
}