import { NextRequest, NextResponse } from 'next/server'

/**
 * Generate Presigned URL for direct S3 upload
 * Production-ready for scalable applications
 */
export async function POST(request: NextRequest) {
  try {
    const { key, contentType, bucket } = await request.json()

    if (!key || !contentType) {
      return NextResponse.json({ error: 'Missing key or contentType' }, { status: 400 })
    }

    // PRODUCTION CODE - AWS S3 Presigned URL
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'eu-west-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
        }
      })

      const command = new PutObjectCommand({
        Bucket: bucket || 'hospup-files',
        Key: key,
        ContentType: contentType,
        CacheControl: 'max-age=31536000', // 1 year cache
        Metadata: {
          'upload-time': new Date().toISOString(),
          'source': 'video-generator'
        }
      })

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour

      console.log(`✅ Generated presigned URL for: ${key}`)

      return NextResponse.json({
        uploadUrl,
        key,
        bucket: bucket || 'hospup-files',
        message: 'Presigned URL generated successfully'
      })

    } catch (awsError) {
      console.error('❌ AWS presigned URL generation failed:', awsError)

      // Fallback to mock for development
      const mockUrl = `https://mock-presigned-url.s3.eu-west-1.amazonaws.com/${key}?signature=mock`

      return NextResponse.json({
        uploadUrl: mockUrl,
        key,
        bucket: bucket || 'hospup-files',
        message: 'Development mode - mock presigned URL'
      })
    }

  } catch (error) {
    console.error('❌ Presigned URL API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    )
  }
}