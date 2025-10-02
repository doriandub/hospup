import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🎬 MediaConvert generation request:', {
      templateSlots: body.templateSlots?.length,
      textOverlays: body.textOverlays?.length,
      contentVideos: body.contentVideos?.length
    })

    // Récupérer le token d'authentification depuis les cookies
    const authToken = request.cookies.get('access_token')?.value

    if (!authToken) {
      console.log('⚠️ No auth token found - proceeding without auth for testing')
      // return NextResponse.json(
      //   { error: 'Authentication required - please login' },
      //   { status: 401 }
      // )
    }

    // Envoyer les données au backend avec authentification
    const backendUrl = process.env.BACKEND_URL || 'https://web-production-b52f.up.railway.app'

    // Le body contient déjà le payload MediaConvert formaté par le convertisseur
    const response = await fetch(`${backendUrl}/api/v1/video-generation/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      body: JSON.stringify(body) // Transférer directement le payload MediaConvert
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Backend error:', response.status, errorText)
      return NextResponse.json(
        { error: `Backend error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('✅ MediaConvert job created:', result)

    return NextResponse.json({
      jobId: result.job_id || result.jobId,
      status: 'SUBMITTED',
      message: 'Video generation started'
    })

  } catch (error: any) {
    console.error('❌ MediaConvert API error:', error)
    return NextResponse.json(
      { error: `MediaConvert generation failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'MediaConvert video generation API' })
}