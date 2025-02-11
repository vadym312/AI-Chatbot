"use client"

import { memo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CircleUserRound, Sparkles, X, Download } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { CodeBlock } from "./code-block"
import { Button } from "@/components/ui/button"

interface ChatMessageProps {
  content: string
  role: "user" | "assistant"
  media?: {
    type: "image" | "audio"
    url: string
  }
}

function formatMessageContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/^```(\w+)?\n([\s\S]*?)```$/)
      const language = match?.[1]
      const code = match?.[2] || part.slice(3, -3)
      return <CodeBlock key={index} code={code} language={language} />
    }
    return <p key={index} className="whitespace-pre-wrap break-words leading-relaxed">{part}</p>
  })
}

export const ChatMessage = memo(({ content, role, media }: ChatMessageProps) => {
  const isUser = role === "user"
  const { theme } = useTheme()
  const [showImagePreview, setShowImagePreview] = useState(false)

  const handleDownload = async () => {
    if (!media?.url) return

    try {
      // Create a link element
      const link = document.createElement('a')
      
      // Set the href to the image URL
      link.href = media.url
      
      // Set download filename
      link.download = `generated-image-${Date.now()}.png`
      
      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-start gap-3 sm:gap-4 transition-colors",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div className={cn(
          "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 select-none items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-primary"
        )}>
          {isUser ? <CircleUserRound className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </div>
        <div className={cn(
          "flex-1 space-y-4 overflow-hidden",
          isUser ? "items-end" : "items-start"
        )}>
          {media && (
            <div className={cn(
              "rounded-lg overflow-hidden max-w-[240px] sm:max-w-sm",
              isUser ? "ml-auto" : "mr-auto"
            )}>
              {media.type === 'image' ? (
                <div className="relative group">
                  <div 
                    className="rounded-lg overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => setShowImagePreview(true)}
                  >
                    {media.url.startsWith('data:image/') ? (
                      <img 
                        src={media.url} 
                        alt="Generated image"
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <img 
                        src={media.url} 
                        alt="Generated image"
                        className="w-full h-auto object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (!img.src.startsWith('data:image/')) {
                            img.src = `data:image/png;base64,${media.url}`;
                          }
                        }}
                      />
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 hover:bg-background shadow-md"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <audio 
                  controls 
                  src={media.url}
                  className="w-full rounded-lg shadow-lg"
                />
              )}
            </div>
          )}
          <div className={cn(
            "text-sm sm:text-base space-y-4 rounded-2xl px-6 py-4",
            isUser ? "bg-primary/5" : "bg-secondary/50"
          )}>
            {formatMessageContent(content)}
          </div>
        </div>
      </motion.div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showImagePreview && media?.type === 'image' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowImagePreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -right-2 -top-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background shadow-md hover:bg-muted"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background shadow-md hover:bg-muted"
                  onClick={() => setShowImagePreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <img
                src={media.url}
                alt="Preview"
                className="rounded-lg shadow-xl max-w-full max-h-[90vh] object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})
ChatMessage.displayName = 'ChatMessage'