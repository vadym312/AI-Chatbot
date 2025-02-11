"use client"

import { useState, useCallback } from "react"
import { Check, Copy } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language }: CodeBlockProps) {
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