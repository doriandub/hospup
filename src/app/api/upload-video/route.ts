import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    console.log(`📤 Upload request received: ${file?.name || 'no filename'}, size: ${file?.size || 0} bytes`)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size === 0) {
      console.error('❌ File is empty (0 bytes)')
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    // Convert file to buffer for S3 upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename with timestamp and UUID
    const timestamp = Date.now()
    const uuid = crypto.randomUUID()
    const extension = file.name.split('.').pop() || 'webm'

    // Use same structure as existing assets: videos/3/2/filename.ext
    // Add "generated" subfolder to differentiate from regular uploads
    const filename = `videos/generated/${uuid}.${extension}`

    // REAL AWS S3 UPLOAD - Use AWS SDK v3
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')

      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'eu-west-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
        }
      })

      const uploadParams = {
        Bucket: 'hospup-files',
        Key: filename,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'max-age=31536000', // 1 year cache
        Metadata: {
          'upload-time': new Date().toISOString(),
          'source': 'video-generator'
        }
      }

      const command = new PutObjectCommand(uploadParams)
      await s3Client.send(command)

      const s3Url = `https://s3.eu-west-1.amazonaws.com/hospup-files/${filename}`

      console.log(`✅ REAL AWS S3 UPLOAD SUCCESS: ${s3Url}`)
      console.log(`📊 File: ${filename}, Size: ${file.size} bytes`)

      return NextResponse.json({
        url: s3Url,
        filename: filename,
        size: file.size,
        message: "✅ REAL AWS S3 UPLOAD SUCCESS"
      })

    } catch (awsError) {
      console.error('❌ AWS S3 upload failed:', awsError)

      // Fallback to mock for development
      const s3Url = `https://s3.eu-west-1.amazonaws.com/hospup-files/${filename}`
      console.log(`📁 FALLBACK MOCK UPLOAD: ${s3Url}`)
      console.log(`⚠️ AWS Error: ${awsError}`)

      return NextResponse.json({
        url: s3Url,
        filename: filename,
        size: file.size,
        message: "❌ MOCK UPLOAD (AWS failed)"
      })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}