'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MessageSquare, FileText, Send } from 'lucide-react'
import { getLoadMessages, sendMessage } from '@/app/actions/messages'
import { addLoadNote } from '@/app/actions/loads'
import { useToast } from '@/components/ui/toast'

interface CommunicationsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  load: {
    id: number
    load_number: string | null
    comments: string | null
  }
}

interface Message {
  id: number
  message: string
  created_at: string
  sender: {
    id: string
    name: string
    role: string
  }
  recipient: {
    id: string
    name: string
    role: string
  }
}

export function CommunicationsModal({ open, onOpenChange, load }: CommunicationsModalProps) {
  const [activeTab, setActiveTab] = useState<'messages' | 'notes'>('messages')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (open && activeTab === 'messages') {
      loadMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, load.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    setLoading(true)
    const result = await getLoadMessages(load.id)
    if (result.success && result.data) {
      setMessages(result.data as Message[])
    }
    setLoading(false)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    // For now, we'll need to get a recipient - typically would be the driver or carrier
    // This is a simplified implementation - in production you'd have a recipient selector
    showToast({
      type: 'info',
      title: 'Message Feature',
      message: 'Direct messaging from loads view coming soon. Use the dedicated messages page for now.',
      duration: 5000
    })
    setSending(false)
    setNewMessage('')
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || sending) return

    setSending(true)
    const result = await addLoadNote(load.id, newNote.trim())
    
    if (result.success) {
      showToast({
        type: 'success',
        title: 'Note Added',
        message: 'Your note has been added to the load.',
        duration: 3000
      })
      setNewNote('')
      // Force refresh by closing and reopening or just clear the field
      window.location.reload()
    } else {
      showToast({
        type: 'error',
        title: 'Failed to Add Note',
        message: result.error || 'Could not add note.',
        duration: 5000
      })
    }
    setSending(false)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Parse notes from comments field
  const notes = load.comments
    ? load.comments.split('\n\n').map((note, idx) => ({
        id: idx,
        text: note
      }))
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Communications - {load.load_number || `Load #${load.id}`}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700 pb-2 mt-4">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === 'messages'
                ? 'bg-primary text-white'
                : 'bg-navy-lighter text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Messages
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === 'notes'
                ? 'bg-primary text-white'
                : 'bg-navy-lighter text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" />
            Internal Notes
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px] py-4">
          {activeTab === 'messages' ? (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-400">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                  <p>No messages for this load yet</p>
                  <p className="text-sm">Messages will appear here when drivers or carriers communicate about this load</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="rounded-lg border border-gray-700 bg-navy-lighter p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{msg.sender.name}</span>
                          <span className="text-xs text-gray-400 capitalize">({msg.sender.role})</span>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{msg.message}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <FileText className="h-12 w-12 mb-2 opacity-50" />
                  <p>No internal notes yet</p>
                  <p className="text-sm">Add notes to track internal communications and decisions</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-gray-700 bg-navy-lighter p-3"
                    >
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 pt-4 mt-4">
          {activeTab === 'messages' ? (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Direct messaging coming soon - use Messages page for now..."
                className="flex-1 rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={true}
              />
              <Button type="button" disabled={true} className="gap-2">
                <Send className="h-4 w-4" />
                Send
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add an internal note..."
                rows={3}
                className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                disabled={sending}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={sending || !newNote.trim()} className="gap-2">
                  <FileText className="h-4 w-4" />
                  {sending ? 'Adding...' : 'Add Note'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

