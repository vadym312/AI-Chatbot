"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { ChatMessage } from "./chat-message"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  media?: {
    type: "image" | "audio"
    url: string
  }
}

interface MessageListProps {
  messages: Message[]
}

export const MessageList = memo(({ messages }: MessageListProps) => (
  <motion.div 
    key="message-list" 
    className="space-y-6 pt-20 pb-10"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    {messages.map((message, index) => (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="px-2 sm:px-4"
      >
        <ChatMessage
          role={message.role}
          content={message.content}
          media={message.media}
        />
      </motion.div>
    ))}
  </motion.div>
))