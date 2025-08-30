'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  onFilesChange: (files: File[]) => void
  disabled?: boolean
}

interface FileWithPreview extends File {
  preview?: string
  id: string
  status: 'uploading' | 'uploaded' | 'error'
  progress?: number
}

export function FileUpload({ 
  accept = { 'video/*': ['.mp4', '.mov', '.avi'] },
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB
  onFilesChange,
  disabled = false
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const fileWithPreview = file as FileWithPreview
      fileWithPreview.id = Math.random().toString(36).substring(7)
      fileWithPreview.status = 'uploaded'
      fileWithPreview.preview = file.type.startsWith('video/') ? URL.createObjectURL(file) : undefined
      return fileWithPreview
    })

    setFiles(prev => {
      const updated = [...prev, ...newFiles].slice(0, maxFiles)
      onFilesChange(updated)
      return updated
    })
  }, [maxFiles, onFilesChange])

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId)
      onFilesChange(updated)
      return updated
    })
  }

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - files.length,
    maxSize,
    disabled: disabled || files.length >= maxFiles
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : disabled || files.length >= maxFiles
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary hover:bg-primary/5'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`mx-auto h-12 w-12 mb-4 ${
          disabled || files.length >= maxFiles ? 'text-gray-300' : 'text-gray-400'
        }`} />
        
        <div className="space-y-2">
          {files.length >= maxFiles ? (
            <p className="text-gray-500">Maximum number of files reached</p>
          ) : isDragActive ? (
            <p className="text-primary font-medium">Drop the files here...</p>
          ) : (
            <>
              <p className="text-gray-700 font-medium">
                Drag & drop your videos here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Max {maxFiles} files, up to {formatFileSize(maxSize)} each
              </p>
            </>
          )}
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-red-700 font-medium mb-2">Some files were rejected:</h4>
          <ul className="text-red-600 text-sm space-y-1">
            {fileRejections.map(({ file, errors }, index) => (
              <li key={index}>
                {file.name}: {errors.map(e => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Uploaded Files ({files.length})</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
                <div className="flex-shrink-0">
                  {file.status === 'uploaded' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : file.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <File className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}