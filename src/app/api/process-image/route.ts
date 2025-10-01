import { NextRequest, NextResponse } from 'next/server'
import { processImage } from '@/lib/content/image-processor'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File must be an image (${supportedTypes.join(', ')})` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await processImage(buffer, file.type)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    )
  }
}
