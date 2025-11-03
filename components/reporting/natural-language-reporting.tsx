'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Brain, Send, Loader2, FileText, Download, AlertCircle, Clock } from 'lucide-react'
import { generateNaturalLanguageReport, exportReportData } from '@/app/actions/ai'
import ReactMarkdown from 'react-markdown'

type Report = {
  id: string
  query: string
  report: string
  timestamp: string
  records_analyzed: number
  reportData?: any[]
}

export default function NaturalLanguageReporting() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const quickQueries = [
    'Show me all loads from last month with margin below 10%',
    'What are the top 5 customers by revenue this year?',
    'List all pending loads with pickup dates in the next 3 days',
    'Show me carrier performance summary for the last quarter',
    'Which loads are currently in transit?',
    'What is the average margin across all delivered loads?'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setError(null)
    
    const result = await generateNaturalLanguageReport(query)
    
    if (result.success) {
      const newReport: Report = {
        id: Date.now().toString(),
        query: result.query || query,
        report: result.report || '',
        timestamp: result.timestamp || new Date().toISOString(),
        records_analyzed: result.records_analyzed || 0,
        reportData: result.reportData
      }
      setReports([newReport, ...reports])
      setQuery('') // Clear the query after successful submission
    } else {
      setError(result.error || 'Failed to generate report')
    }
    
    setLoading(false)
  }

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery)
  }

  const handleExport = async (report: Report, format: 'csv' | 'json') => {
    if (!report.reportData) {
      alert('No data available to export for this report')
      return
    }

    setExporting(true)
    const result = await exportReportData(report.reportData, format)
    
    if (result.success) {
      // Create a download link
      const blob = new Blob([result.data], { type: result.mimeType })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } else {
      alert(result.error || 'Failed to export data')
    }
    
    setExporting(false)
  }

  const handleClearReports = () => {
    if (reports.length > 0 && confirm('Are you sure you want to clear all reports?')) {
      setReports([])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
              <Brain className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Reporting Tool</h1>
              <p className="text-sm text-gray-400">Ask questions about your data and get instant insights</p>
            </div>
          </div>
        </div>
        {reports.length > 0 && (
          <Button variant="outline" onClick={handleClearReports}>
            Clear Reports
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {reports.length > 0 && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Reports</p>
                  <p className="text-3xl font-bold text-white">{reports.length}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Records</p>
                  <p className="text-3xl font-bold text-white">
                    {reports.reduce((sum, r) => sum + r.records_analyzed, 0)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <FileText className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">With Export Data</p>
                  <p className="text-3xl font-bold text-white">
                    {reports.filter(r => r.reportData).length}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                  <Download className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Last Generated</p>
                  <p className="text-sm font-bold text-white">
                    {new Date(reports[0]?.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Ask a Question</CardTitle>
          <p className="text-sm text-gray-400">
            Ask natural language questions about your loads, carriers, customers, and fleet
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g., 'Show me all loads from last week with margin above 15%'"
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
                  Generate Report
                </>
              )}
            </Button>
          </form>

          {/* Quick Queries */}
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Example queries:</p>
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

      {/* Reports */}
      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  {report.query}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-xs text-gray-400">
                    Generated: {new Date(report.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    Records analyzed: {report.records_analyzed}
                  </p>
                </div>
              </div>
              {report.reportData && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport(report, 'csv')}
                    disabled={exporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport(report, 'json')}
                    disabled={exporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              )}
            </div>
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
                  pre: ({ children }) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto my-4">{children}</pre>,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border border-gray-700">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-gray-800">{children}</thead>,
                  tbody: ({ children }) => <tbody className="divide-y divide-gray-700">{children}</tbody>,
                  tr: ({ children }) => <tr>{children}</tr>,
                  th: ({ children }) => <th className="px-4 py-2 text-left text-white font-semibold border border-gray-700">{children}</th>,
                  td: ({ children }) => <td className="px-4 py-2 text-gray-300 border border-gray-700">{children}</td>,
                }}
              >
                {report.report}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Initial State */}
      {reports.length === 0 && !error && !loading && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
                <Brain className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Ask Questions About Your Data</h3>
              <p className="text-sm text-gray-400 text-center max-w-md">
                Use natural language to query your TMS data and get instant insights, analysis, and reports.
              </p>
              <div className="space-y-2 text-left w-full max-w-md">
                <p className="text-sm font-semibold text-gray-300">You can ask about:</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-500">✓</span> Load performance and margins
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-500">✓</span> Customer and carrier analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-500">✓</span> Fleet utilization and status
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-500">✓</span> Time-based trends and comparisons
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-500">✓</span> Custom filtered data views
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

