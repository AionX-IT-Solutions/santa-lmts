import { useRef } from 'react'
import { Upload, File, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FileUploadFieldProps {
  label?: string
  accept?: string
  value?: File | null
  onChange: (file: File | null) => void
  required?: boolean
  error?: string
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function FileUploadField({
  label = 'Attachment',
  accept = '.pdf,.doc,.docx',
  value,
  onChange,
  required,
  error
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200',
          value
            ? 'border-blue-300 bg-blue-50'
            : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30',
          error && 'border-red-300'
        )}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-blue-600">
              <File size={16} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate max-w-[180px]">{value.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(value.size)}</p>
              </div>
            </div>
            <button
              type="button"
              className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Upload size={20} className="text-slate-400" />
            <p className="text-sm text-slate-500">
              <span className="text-blue-600 font-medium">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs text-slate-400">
              {accept.replace(/\./g, '').toUpperCase().split(',').join(', ')}
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}
