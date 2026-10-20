'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

type TagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  id?: string
}

// Press Enter (or comma) to add a tag; Backspace on an empty input removes the last one.
export function TagInput({ value, onChange, placeholder, id }: TagInputProps) {
  const [draft, setDraft] = useState('')

  function commit() {
    const tag = draft.trim()
    if (tag && !value.some((t) => t.toLowerCase() === tag.toLowerCase())) onChange([...value, tag])
    setDraft('')
  }

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-grey-300 bg-white px-2 py-1.5 focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/20">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-medium text-teal">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={commit}
        placeholder={value.length ? '' : placeholder}
        className="min-w-[120px] flex-1 bg-transparent px-1 text-sm text-navy placeholder:text-grey-500 focus:outline-none"
      />
    </div>
  )
}
