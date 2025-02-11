"use client"

import { useState, useCallback, useRef } from "react"
import toast from "react-hot-toast"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  media?: {
    type: "image" | "audio"
    url: string
  }
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export function useChat() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  const currentChat = chats.find(chat => chat.id === currentChatId)

  const scrollToBottom = useCallback((immediate = false) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    const performScroll = () => {
      if (chatContainerRef.current) {
        const container = chatContainerRef.current
        const scrollOptions = {
          top: container.scrollHeight,
          behavior: immediate ? 'auto' : 'smooth' as ScrollBehavior
        }

        container.scrollTo(scrollOptions)

        scrollTimeoutRef.current = setTimeout(() => {
          container.scrollTo(scrollOptions)
          
          scrollTimeoutRef.current = setTimeout(() => {
            container.scrollTo(scrollOptions)
          }, 150)
        }, 50)
      }
    }

    requestAnimationFrame(performScroll)
  }, [])

  const generateChatTitle = useCallback((message: string) => {
    if (message.length < 30) return message
    
    const questionMatch = message.match(/^(what|who|how|why|when|where|can|could|would|will|should|is|are|do|does|did).+?\?/i)
    if (questionMatch) return questionMatch[0].slice(0, 30) + "..."
    
    return message.split(' ').slice(0, 4).join(' ') + "..."
  }, [])

  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    return newChat.id
  }, [])

  const removeChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
    }
  }, [currentChatId])

  const sendMessage = useCallback(async (message: string, file?: File | Blob) => {
    if (!message.trim() && !file) {
      toast.error('Please enter a message or upload a file')
      return
    }

    let chatId = currentChatId
    if (!chatId) {
      chatId = createNewChat()
    }

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    }

    if (file) {
      const fileUrl = URL.createObjectURL(file)
      newMessage.media = {
        type: file.type.startsWith('image/') ? 'image' : 'audio',
        url: fileUrl
      }
    }

    // Update chat immediately with user message
    setChats(prev => {
      const updatedChats = prev.map(chat => 
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              title: chat.messages.length === 0 ? generateChatTitle(message) : chat.title,
              updatedAt: new Date()
            }
          : chat
      )
      return updatedChats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    })

    scrollToBottom(true)
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('message', message)
      
      const chat = chats.find(c => c.id === chatId)
      const history = chat?.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })) || []
      formData.append('history', JSON.stringify(history))
      
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error('File size exceeds 10MB limit')
          return
        }
        formData.append('file', file)
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to get response')
      }

      const data = await response.json()

      setChats(prev => {
        const updatedChats = prev.map(chat => {
          if (chat.id === chatId) {
            const assistantMessage: Message = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: data.content,
            }

            if (data.type === 'image' || data.type === 'audio') {
              assistantMessage.media = {
                type: data.type,
                url: data.url
              }
            }

            return {
              ...chat,
              messages: [...chat.messages, assistantMessage],
              updatedAt: new Date()
            }
          }
          return chat
        })
        return updatedChats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      })

      scrollToBottom(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [currentChatId, chats, createNewChat, generateChatTitle, scrollToBottom])

  return {
    chats,
    currentChat,
    currentChatId,
    isLoading,
    chatContainerRef,
    setCurrentChatId,
    createNewChat,
    removeChat,
    sendMessage,
    scrollToBottom
  }
}