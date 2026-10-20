import { NextResponse, type NextRequest } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import { handleApiError, jsonError, requireAdmin } from '@/lib/api'
import { MAX_IMAGES } from '@/lib/validations/property'

export const runtime = 'nodejs'

const MAX_FILE_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return jsonError('Cloudinary is not configured. Add the CLOUDINARY_* keys to .env.local, or paste an image URL instead.', 503)
  }

  try {
    const form = await request.formData()
    const files = form.getAll('files').filter((f): f is File => f instanceof File)
    if (files.length === 0) return jsonError('No files received', 400)
    if (files.length > MAX_IMAGES) return jsonError(`Upload at most ${MAX_IMAGES} images at once`, 400)
    for (const file of files) {
      if (!file.type.startsWith('image/')) return jsonError(`${file.name} is not an image`, 400)
      if (file.size > MAX_FILE_BYTES) return jsonError(`${file.name} is larger than 10 MB`, 400)
    }

    const urls = await Promise.all(
      files.map(async (file) => {
        const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
        const result = await cloudinary.uploader.upload(`data:${file.type};base64,${base64}`, {
          folder: 'dayuse/properties',
          resource_type: 'image',
        })
        return result.secure_url
      }),
    )
    return NextResponse.json({ urls })
  } catch (err) {
    return handleApiError(err)
  }
}
