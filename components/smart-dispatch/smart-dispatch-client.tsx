'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap, Send, Loader2, TrendingUp, AlertCircle } from 'lucide-react'
import { getSmartDispatchRecommendations } from '@/app/actions/ai'
import ReactMarkdown from 'react-markdown'

export default function SmartDispatchClient() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    loads_analyzed: number
    fleet_analyzed: number
    carriers_analyzed: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const quickQueries = [
    'Optimize dispatch for today\'s pending loads',
    'Which loads should I prioritize based on pickup times?',
    'Suggest best carrier-load matches for maximum margin',
    'Show me potential scheduling conflicts',
    'Recommend assignments for loads with tight delivery windows'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setError(null)
    
    const result = await getSmartDispatchRecommendations(query)
    
    if (result.success) {
      setRecommendation(result.recommendation || null)
      setStats({
        loads_analyzed: result.loads_analyzed || 0,
        fleet_analyzed: result.fleet_analyzed || 0,
        carriers_analyzed: result.carriers_analyzed || 0
      })
    } else {
      setError(result.error || 'Failed to get recommendations')
    }
    
    setLoading(false)
  }

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
              <Zap className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Smart Dispatch</h1>
              <p className="text-sm text-gray-400">AI-powered dispatch optimization and load assignment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Loads Analyzed</p>
                  <p className="text-3xl font-bold text-white">{stats.loads_analyzed}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Fleet Analyzed</p>
                  <p className="text-3xl font-bold text-white">{stats.fleet_analyzed}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Carriers Analyzed</p>
                  <p className="text-3xl font-bold text-white">{stats.carriers_analyzed}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Ask Smart Dispatch</CardTitle>
          <p className="text-sm text-gray-400">
            Describe your dispatch needs and get AI-powered recommendations
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g., 'Optimize dispatch for loads picking up tomorrow in Texas'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Get Recommendations
                </>
              )}
            </Button>
          </form>

          {/* Quick Queries */}
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Quick queries:</p>
            <div className="flex flex-wrap gap-2">
              {quickQueries.map((quickQuery, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuery(quickQuery)}
                  disabled={loading}
                  className="text-xs"
                >
                  {quickQuery}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-500">Error</p>
                <p className="text-sm text-red-400">{error}</p>
                {error.includes('API key') && (
                  <p className="text-xs text-gray-400 mt-2">
                    Make sure your OPENAI_API_KEY is set in your environment variables.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-6 mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold text-white mt-5 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="text-gray-300 mb-3">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-gray-300 mb-3">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-gray-300 mb-3">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-300">{children}</li>,
                  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                  code: ({ children }) => <code className="bg-gray-800 px-1.5 py-0.5 rounded text-yellow-400 text-sm">{children}</code>,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border border-gray-700">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-gray-800">{children}</thead>,
                  tbody: ({ children }) => <tbody className="divide-y divide-gray-700">{children}</tbody>,
                  tr: ({ children }) => <tr>{children}</tr>,
                  th: ({ children }) => <th className="px-4 py-2 text-left text-white font-semibold">{children}</th>,
                  td: ({ children }) => <td className="px-4 py-2 text-gray-300">{children}</td>,
                }}
              >
                {recommendation}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!recommendation && !error && !loading && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Ready to Optimize Your Dispatch</h3>
              <p className="text-sm text-gray-400 text-center max-w-md">
                Ask Smart Dispatch to analyze your loads, fleet, and carriers to provide intelligent dispatch recommendations.
              </p>
              <div className="space-y-2 text-left w-full max-w-md">
                <p className="text-sm font-semibold text-gray-300">Smart Dispatch can help you:</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Optimize load assignments based on geography
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Match equipment types with requirements
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Maximize margins and minimize costs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Identify scheduling conflicts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Prioritize urgent shipments
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

