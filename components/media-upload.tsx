"use client"

import { Upload, Mic, Image as ImageIcon, X } from "lucide-react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MediaUploadProps {
  onFileSelect: (file: File) => void
  onRecordingComplete: (blob: Blob) => void
}

export function MediaUpload({ onFileSelect, onRecordingComplete }: MediaUploadProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }

    onFileSelect(file)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onRecordingComplete(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      let errorMessage = 'No microphone found. Please connect a microphone and try again.'
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone access to record audio.'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is already in use by another application.'
        }
      }

      // Display error in console only since toast is removed
      console.warn('Microphone Error:', errorMessage)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const clearPreview = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        className={cn(isRecording && "text-red-500")}
      >
        <Mic className="h-5 w-5" />
      </Button>

      {preview && (
        <div className="relative">
          <img src={preview} alt="Preview" className="h-8 w-8 rounded object-cover" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-foreground/10 p-0 hover:bg-foreground/20"
            onClick={clearPreview}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}