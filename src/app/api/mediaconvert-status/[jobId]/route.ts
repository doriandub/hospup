import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    console.log(`📊 Checking MediaConvert status for job: ${jobId}`)

    // Récupérer le token d'authentification depuis les cookies
    const authToken = request.cookies.get('access_token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required - please login' },
        { status: 401 }
      )
    }

    // Vérifier le statut via le backend avec authentification
    const backendUrl = process.env.BACKEND_URL || 'https://web-production-b52f.up.railway.app'

    const response = await fetch(`${backendUrl}/api/v1/video-generation/status/${jobId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Backend status error:', response.status, errorText)
      return NextResponse.json(
        { error: `Backend status error: ${response.status}` },
        { status: response.status }
      )
    }

    const statusData = await response.json()
    console.log(`✅ Job ${jobId} status:`, statusData)

    return NextResponse.json({
      jobId,
      status: statusData.status,
      progress: statusData.progress || 0,
      outputUrl: statusData.output_url || statusData.outputUrl,
      createdAt: statusData.created_at || statusData.createdAt,
      completedAt: statusData.completed_at || statusData.completedAt,
      errorMessage: statusData.error_message || statusData.errorMessage
    })

  } catch (error: any) {
    console.error('❌ Status check error:', error)
    return NextResponse.json(
      { error: `Status check failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}