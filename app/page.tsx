"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { ChatInput } from "@/components/chat-input"
import { ChatList } from "@/components/chat-list"
import { EmptyState } from "@/components/chat/empty-state"
import { LoadingSpinner } from "@/components/chat/loading-spinner"
import { MessageList } from "@/components/chat/message-list"
import { useChat } from "@/lib/hooks/use-chat"

export default function Home() {
  const {
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
  } = useChat()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (currentChat?.messages?.length) {
      scrollToBottom(false)
    }
  }, [currentChat?.messages, scrollToBottom])

  useEffect(() => {
    if (!isLoading && currentChat?.messages?.length) {
      scrollToBottom(false)
    }
  }, [isLoading, currentChat?.messages?.length, scrollToBottom])

  useEffect(() => {
    if (currentChatId && currentChat?.messages?.length) {
      scrollToBottom(true)
    }
  }, [currentChatId, currentChat?.messages?.length, scrollToBottom])

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-[250px] lg:w-[330px] h-full flex-col glass border-r">
        <ChatList
          chats={chats}
          currentChatId={currentChatId}
          onSelect={setCurrentChatId}
          onNew={createNewChat}
          onRemove={removeChat}
        />
      </div>

      {/* Sidebar - Mobile */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden fixed left-4 top-4 z-30"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-full sm:w-[300px] glass">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <ChatList
            chats={chats}
            currentChatId={currentChatId}
            onSelect={(id) => {
              setCurrentChatId(id)
              setIsSidebarOpen(false)
            }}
            onNew={createNewChat}
            onRemove={removeChat}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth px-4 md:px-6"
        >
          <div className="max-w-3xl mx-auto w-full">
            <AnimatePresence mode="wait" initial={false}>
              {!currentChat || currentChat.messages.length === 0 ? (
                <EmptyState key="empty-state" />
              ) : (
                <MessageList key="message-list" messages={currentChat.messages} />
              )}
              {isLoading && <LoadingSpinner key="loading-spinner" />}
            </AnimatePresence>
          </div>
        </main>

        <div className="glass mt-auto">
          <div className="max-w-3xl mx-auto w-full px-4 md:px-6">
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}