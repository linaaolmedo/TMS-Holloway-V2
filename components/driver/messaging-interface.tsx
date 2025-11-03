'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, MessageSquare, User } from 'lucide-react'
import { sendMessage, getMessages, markMessagesAsRead } from '@/app/actions/messages'

interface Message {
  id: number
  sender_id: string
  recipient_id: string
  load_id: number | null
  message: string
  read: boolean
  created_at: string
  sender?: {
    id: string
    email: string
    role: string
  }
  recipient?: {
    id: string
    email: string
    role: string
  }
  load?: {
    id: number
    load_number: string
  }
}

interface MessagingInterfaceProps {
  currentUserId: string
  dispatcherId: string | null
}

export function MessagingInterface({ currentUserId, dispatcherId }: MessagingInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = useCallback(async () => {
    if (!dispatcherId) return

    setLoading(true)
    const result = await getMessages(dispatcherId)
    if (result.success && result.data) {
      setMessages(result.data as Message[])
      // Mark messages as read
      await markMessagesAsRead(dispatcherId)
    }
    setLoading(false)
  }, [dispatcherId])

  useEffect(() => {
    loadMessages()
    // Poll for new messages every 10 seconds
    const interval = setInterval(loadMessages, 10000)
    return () => clearInterval(interval)
  }, [dispatcherId, loadMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !dispatcherId || sending) return

    setSending(true)
    const result = await sendMessage({
      recipient_id: dispatcherId,
      message: newMessage.trim(),
    })

    if (result.success) {
      setNewMessage('')
      // Reload messages to show the new one
      await loadMessages()
    } else {
      alert(result.error || 'Failed to send message')
    }
    setSending(false)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
  }

  if (!dispatcherId) {
    return (
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 flex-col items-center justify-center text-gray-400">
            <MessageSquare className="h-12 w-12 mb-4" />
            <p>No dispatcher assigned</p>
            <p className="text-xs mt-1">Contact your coordinator to be assigned a dispatcher</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Dispatch Communication
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-[500px] md:h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto rounded-md border border-gray-700 bg-navy-lighter p-3 md:p-4 mb-4 space-y-3">
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-sm">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare className="h-12 w-12 mb-4" />
                <p>No messages yet</p>
                <p className="text-xs mt-1">Start a conversation with dispatch</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isOwnMessage = msg.sender_id === currentUserId
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[70%] rounded-lg p-3 ${
                          isOwnMessage
                            ? 'bg-primary text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {isOwnMessage ? 'You' : 'Dispatch'}
                          </span>
                        </div>
                        <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                        {msg.load && (
                          <p className="text-xs mt-1 opacity-75">
                            Re: {msg.load.load_number}
                          </p>
                        )}
                        <p className="text-xs mt-1 opacity-75">
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              placeholder="Type your message..."
              className="flex-1"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <Button type="submit" disabled={sending || !newMessage.trim()} className="gap-2 flex-shrink-0">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

