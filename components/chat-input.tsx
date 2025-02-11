"use client"

import { useState, useRef, useEffect } from "react"
import { SendHorizontal, Paperclip, Mic, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface ChatInputProps {
  onSend: (message: string, file?: File | Blob) => void
  isLoading?: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState("")
  const [mediaFile, setMediaFile] = useState<File | Blob | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [microphoneAvailable, setMicrophoneAvailable] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop())
        setMicrophoneAvailable(true)
      })
      .catch(() => {
        setMicrophoneAvailable(false)
      })
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 150)
      textarea.style.height = `${newHeight}px`
    }
  }, [input])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((input.trim() || mediaFile) && !isLoading) {
      onSend(input, mediaFile || undefined)
      setInput("")
      setMediaFile(null)
      setPreview(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      console.error('File size exceeds 5MB limit')
      return
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
    setMediaFile(file)
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
        setMediaFile(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setMicrophoneAvailable(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const clearMedia = () => {
    setMediaFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence>
          {(preview || mediaFile) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="relative inline-block"
            >
              {preview ? (
                <div className="relative">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="h-20 sm:h-24 w-auto rounded-lg object-cover shadow-lg"
                  />
                </div>
              ) : (
                <div className="glass rounded-lg p-2 text-sm">
                  Audio recording ready
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-background shadow-md hover:bg-muted"
                onClick={clearMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <div className={cn(
            "glass rounded-2xl transition-all duration-200",
            isLoading && "opacity-50"
          )}>
            <div className="flex items-end gap-2 p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-secondary/80"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isRecording}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                rows={1}
                className="flex-1 bg-transparent px-2 py-2.5 text-sm sm:text-base focus-visible:outline-none min-h-[44px] max-h-[150px] resize-none"
                disabled={isLoading}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-xl hover:bg-secondary/80",
                  isRecording && "text-red-500",
                  !microphoneAvailable && "opacity-50 cursor-not-allowed"
                )}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || !!mediaFile || !microphoneAvailable}
                title={!microphoneAvailable ? "Microphone not available" : undefined}
              >
                <Mic className="h-5 w-5" />
              </Button>

              <Button 
                type="submit" 
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-xl",
                  (!input.trim() && !mediaFile) || isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-secondary/80"
                )}
                disabled={isLoading || (!input.trim() && !mediaFile)}
              >
                <SendHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}