"use client"

import { motion } from "framer-motion"
import { User, Bot, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

interface ChatMessageProps {
  content: string
  role: "user" | "assistant"
  media?: {
    type: "image" | "audio"
    url: string
  }
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }, [code])

  const isDark = theme === 'dark'

  return (
    <div className="relative group rounded-lg overflow-hidden">
      {/* Code header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2",
        isDark ? "bg-zinc-800" : "bg-zinc-100"
      )}>
        <span className="text-xs text-muted-foreground">
          {language}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-md transition-opacity",
            isDark ? "hover:bg-zinc-700" : "hover:bg-zinc-200"
          )}
          onClick={copyToClipboard}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Code content */}
      <pre className={cn(
        "p-4 overflow-x-auto",
        isDark ? "bg-zinc-900" : "bg-zinc-50"
      )}>
        <code className={cn(
          "text-sm font-mono",
          isDark ? "text-zinc-100" : "text-zinc-900"
        )}>{code}</code>
      </pre>
    </div>
  )
}

function formatMessageContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      // Extract language if specified
      const match = part.match(/^```(\w+)?\n([\s\S]*?)```$/)
      const language = match?.[1]
      const code = match?.[2] || part.slice(3, -3)
      return <CodeBlock key={index} code={code} language={language} />
    }
    return <p key={index} className="whitespace-pre-wrap break-words">{part}</p>
  })
}

export function ChatMessage({ content, role, media }: ChatMessageProps) {
  const isUser = role === "user"
  const { theme } = useTheme()

  const userBgColor = theme === 'dark' ? 'bg-[#303030]' : 'bg-gray-100'
  const userIconBgColor = theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-200'
  const userTextColor = theme === 'dark' ? 'text-neutral-100' : 'text-gray-900'
  const assistantTextColor = theme === 'dark' ? 'text-neutral-100' : 'text-gray-900'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full items-start gap-4 p-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full",
        isUser
          ? cn(userIconBgColor, userTextColor)
          : "bg-primary text-primary-foreground"
      )}>
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      <div className={cn(
        "space-y-4 overflow-hidden max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        {media && (
          <div className={cn(
            "mb-4",
            isUser ? "ml-auto" : "mr-auto"
          )}>
            {media.type === 'image' ? (
              <img 
                src={media.url} 
                alt="Uploaded image"
                className="max-w-sm rounded-lg shadow-sm"
              />
            ) : (
              <audio 
                controls 
                src={media.url}
                className="w-full max-w-sm"
              />
            )}
          </div>
        )}
        <div className={cn(
          "space-y-4",
          isUser 
            ? cn("rounded-2xl px-4 py-3", userBgColor, userTextColor)
            : assistantTextColor
        )}>
          <div className="text-sm leading-relaxed space-y-4">
            {formatMessageContent(content)}
          </div>
        </div>
      </div>
    </motion.div>
  )
}