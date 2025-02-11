"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageSquareText, Trash2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface Chat {
  id: string
  title: string
  messages: any[]
  createdAt: Date
}

interface ChatListProps {
  chats: Chat[]
  currentChatId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onRemove: (id: string) => void
}

export function ChatList({ chats, currentChatId, onSelect, onNew, onRemove }: ChatListProps) {
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null)

  const handleDelete = (chatId: string) => {
    onRemove(chatId)
    setChatToDelete(null)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border/10">
        <div className="flex items-center gap-2 text-primary">
          <MessageSquareText className="h-5 w-5 shrink-0"/>
          <h2 className="text-lg font-semibold truncate">Conversations</h2>
        </div>
        <ThemeToggle />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 hover:bg-primary/5 hover:text-primary transition-colors"
            onClick={onNew}
          >
            <Plus className="h-4 w-4 shrink-0" />
            New conversation
          </Button>
          {chats.map(chat => (
            <div 
              key={chat.id} 
              className="relative"
              onMouseEnter={() => setHoveredChatId(chat.id)}
              onMouseLeave={() => setHoveredChatId(null)}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 relative pr-12 transition-all duration-200",
                  chat.id === currentChatId && "bg-primary/10 text-primary hover:bg-primary/20",
                  chat.id === hoveredChatId && chat.id !== currentChatId && "bg-muted"
                )}
                onClick={() => onSelect(chat.id)}
              >
                <span className="truncate">{chat.title}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 transition-opacity",
                  "text-muted-foreground hover:text-destructive",
                  (hoveredChatId === chat.id || chatToDelete === chat.id) && "opacity-100"
                )}
                onClick={() => setChatToDelete(chat.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <AlertDialog open={!!chatToDelete} onOpenChange={() => setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => chatToDelete && handleDelete(chatToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}