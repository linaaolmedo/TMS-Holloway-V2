'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Loader2, User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface DispatchChatProps {
  initialQuery?: string
  initialResponse?: string
  sources: {
    loads: any[]
    fleet: any[]
    carriers: any[]
  }
  onSendMessage: (message: string) => Promise<string>
}

export function DispatchChat({ initialQuery, initialResponse, sources, onSendMessage }: DispatchChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize with the initial query and response
  useEffect(() => {
    if (initialQuery && initialResponse && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'user',
          content: initialQuery,
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant',
          content: initialResponse,
          timestamp: new Date(),
        },
      ])
    }
  }, [initialQuery, initialResponse, messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Send message with context
      const contextualPrompt = `Previous conversation context:
${messages.slice(-4).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')}

Current available data:
- ${sources.loads.length} loads
- ${sources.fleet.length} fleet units
- ${sources.carriers.length} carriers

User's follow-up question: ${input.trim()}

Please provide a specific answer based on the data sources available.`

      const response = await onSendMessage(contextualPrompt)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const suggestedQuestions = [
    'Show me loads with the highest margins',
    'Which loads have tight delivery deadlines?',
    'What equipment types are most common?',
    'Are there any geographic patterns in the loads?',
    'Which carriers would be best for Texas routes?',
  ]

  return (
    <Card className="border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-purple-400" />
          Chat with AI
          <span className="text-sm text-gray-400 font-normal">
            - Ask follow-up questions about the data
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Messages */}
        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto p-4 bg-gray-900/50 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversation yet. Ask a question to get started!</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-purple-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500/20 text-white'
                        : 'bg-gray-800 text-gray-100'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 2 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">Suggested follow-up questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(question)}
                  disabled={loading}
                  className="text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="Ask a follow-up question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


