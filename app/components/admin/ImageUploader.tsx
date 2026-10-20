'use client'

import { useRef, useState, type DragEvent } from 'react'
import { GripVertical, ImageIcon, LoaderCircle, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

type ImageUploaderProps = {
  value: string[]
  onChange: (urls: string[]) => void
  max?: number
}

// Uploads to Cloudinary through /api/upload. Thumbnails can be dragged to reorder.
// Pasting a URL is a fallback for when Cloudinary isn't configured yet.
export function ImageUploader({ value, onChange, max = 12 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [fileOver, setFileOver] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  const single = max === 1
  const room = single ? 1 : max - value.length

  // In single mode a new image replaces the current one.
  const addUrls = (urls: string[]) => onChange(single ? urls.slice(0, 1) : [...value, ...urls].slice(0, max))

  async function upload(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    if (room <= 0) return setError(`You can add at most ${max} images.`)
    const batch = files.slice(0, room)
    setError(files.length > room ? `Only the first ${room} image(s) were added (limit ${max}).` : null)

    const form = new FormData()
    batch.forEach((f) => form.append('files', f))
    setUploading(true)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      addUrls(data.urls)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function addFromUrl() {
    const url = urlInput.trim()
    try {
      const parsed = new URL(url)
      if (!/^https?:$/.test(parsed.protocol)) throw new Error()
    } catch {
      return setError('Enter a full image URL starting with https://')
    }
    if (room <= 0) return setError(`You can add at most ${max} images.`)
    addUrls([url])
    setUrlInput('')
    setError(null)
  }

  function moveTo(target: number) {
    if (dragIndex === null || dragIndex === target) return
    const next = [...value]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(target, 0, moved)
    onChange(next)
    setDragIndex(target)
  }

  function onDropFiles(e: DragEvent) {
    e.preventDefault()
    setFileOver(false)
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className={cn('grid gap-3', single ? 'max-w-xs grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4')}>
          {value.map((url, i) => (
            <li
              key={url + i}
              draggable={!single}
              onDragStart={() => setDragIndex(i)}
              onDragEnter={() => moveTo(i)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={() => setDragIndex(null)}
              className={cn(
                'group relative aspect-[4/3] overflow-hidden rounded-lg border border-grey-100 bg-grey-100',
                dragIndex === i && 'opacity-50 ring-2 ring-coral',
                !single && 'cursor-grab',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- previews may come from any host */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              {!single && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-navy/70 px-1.5 py-0.5 text-xs text-white">
                  <GripVertical className="h-3 w-3" />
                  {i + 1}
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-navy shadow hover:bg-white"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {(single || room > 0) && (
        <div
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes('Files')) {
              e.preventDefault()
              setFileOver(true)
            }
          }}
          onDragLeave={() => setFileOver(false)}
          onDrop={onDropFiles}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors',
            fileOver ? 'border-coral bg-coral/5' : 'border-grey-300 bg-grey-50',
          )}
        >
          {uploading ? <LoaderCircle className="h-6 w-6 animate-spin text-coral" /> : <ImageIcon className="h-6 w-6 text-grey-500" />}
          <p className="text-grey-500">
            {uploading ? 'Uploading…' : single && value.length ? 'Drop an image to replace the cover' : 'Drag images here or'}
          </p>
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="h-3.5 w-3.5" />
            Choose {single ? 'image' : 'images'}
          </Button>
          {!single && <p className="text-xs text-grey-500">{value.length}/{max} added · JPG, PNG or WebP up to 10 MB</p>}
          <input ref={inputRef} type="file" accept="image/*" multiple={!single} hidden onChange={(e) => e.target.files && upload(e.target.files)} />
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addFromUrl()
            }
          }}
          placeholder="…or paste an image URL"
        />
        <Button variant="secondary" onClick={addFromUrl} disabled={!urlInput.trim()}>
          Add
        </Button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
