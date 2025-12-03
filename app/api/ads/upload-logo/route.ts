import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PNG, JPG, and WebP are allowed' },
                { status: 400 }
            )
        }

        // Validate file size (max 500KB)
        const maxSize = 500 * 1024 // 500KB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 500KB' },
                { status: 400 }
            )
        }

        // Generate unique filename
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const randomString = randomBytes(8).toString('hex')
        const extension = file.name.split('.').pop()
        const filename = `logo-${Date.now()}-${randomString}.${extension}`

        // Save to public/ads/
        const filepath = join(process.cwd(), 'public', 'ads', filename)
        await writeFile(filepath, buffer)

        // Return public URL
        const url = `/ads/${filename}`

        return NextResponse.json({
            success: true,
            url,
            filename
        })
    } catch (error) {
        console.error('[API] /api/ads/upload-logo error:', error)
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        )
    }
}
