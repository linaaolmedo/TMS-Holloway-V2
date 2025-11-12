'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap, Send, Loader2, TrendingUp, AlertCircle, Map as MapIcon } from 'lucide-react'
import { getSmartDispatchRecommendations } from '@/app/actions/ai'
import { getOptimizedAssignments } from '@/app/actions/route-optimization'
import { geocodeLoad, getMultipleDriverLocations } from '@/app/actions/locations'
import { DispatchOptimizationMap } from '@/components/maps/dispatch-optimization-map'
import { SourceCitations } from '@/components/smart-dispatch/source-citations'
import { DispatchChat } from '@/components/smart-dispatch/dispatch-chat'
import { LoadDetailsModal } from '@/components/loads/load-details-modal'
import ReactMarkdown from 'react-markdown'
import { Coordinates } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'

interface Load {
  id: number
  load_number: string
  pickup_location: string
  delivery_location: string
  pickup_coords?: Coordinates
  delivery_coords?: Coordinates
  status: string
  equipment_type?: string
}

interface Driver {
  id: string
  name: string
  location?: Coordinates
  available: boolean
}

export default function SmartDispatchWithMap({ loads: initialLoads, drivers: initialDrivers }: {
  loads: Load[]
  drivers: Driver[]
}) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    loads_analyzed: number
    fleet_analyzed: number
    carriers_analyzed: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sources, setSources] = useState<{
    loads: any[]
    fleet: any[]
    carriers: any[]
    rawLoads: any[]
  } | null>(null)
  const [currentQuery, setCurrentQuery] = useState<string>('')
  const [showMap, setShowMap] = useState(true)
  const [loads, setLoads] = useState<Load[]>(initialLoads)
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers)
  const [selectedLoadId, setSelectedLoadId] = useState<number>()
  const [selectedDriverId, setSelectedDriverId] = useState<string>()
  const [loadingOptimizations, setLoadingOptimizations] = useState(false)
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0, isLoading: false })
  const [locationStats, setLocationStats] = useState({ drivers: 0, loads: 0 })
  const [selectedLoadDetails, setSelectedLoadDetails] = useState<any | null>(null)
  const [loadingLoadDetails, setLoadingLoadDetails] = useState(false)

  const quickQueries = [
    'Optimize dispatch for today\'s pending loads',
    'Which loads should I prioritize based on pickup times?',
    'Suggest best carrier-load matches for maximum margin',
    'Show me potential scheduling conflicts',
    'Recommend assignments for loads with tight delivery windows'
  ]

  // Load geocoded coordinates and driver locations
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get driver locations
        console.log('Fetching driver locations...')
        const driverIds = drivers.map(d => d.id)
        const locationsResult = await getMultipleDriverLocations(driverIds)
        
        let driversWithLocations = 0
        if (locationsResult.success && locationsResult.data) {
          const updatedDrivers = drivers.map(driver => {
            const location = locationsResult.data.find((l: any) => l.driver_id === driver.id)
            if (location) {
              driversWithLocations++
              return {
                ...driver,
                location: {
                  lat: location.latitude,
                  lng: location.longitude,
                },
              }
            }
            return driver
          })
          setDrivers(updatedDrivers)
          console.log(`✅ Found locations for ${driversWithLocations}/${drivers.length} drivers`)
        } else {
          console.warn('⚠️ Failed to fetch driver locations:', locationsResult.error)
        }

        // Geocode loads - process all loads
        console.log(`Geocoding ${loads.length} loads...`)
        setGeocodingProgress({ current: 0, total: loads.length, isLoading: true })
        
        const updatedLoads = [...loads]
        let loadsWithCoords = 0
        
        for (let i = 0; i < loads.length; i++) {
          const load = loads[i]
          setGeocodingProgress({ current: i + 1, total: loads.length, isLoading: true })
          
          const result = await geocodeLoad(load.id)
          if (result.success && result.data) {
            if (result.data.pickup?.coordinates) {
              updatedLoads[i] = {
                ...updatedLoads[i],
                pickup_coords: result.data.pickup.coordinates,
              }
              loadsWithCoords++
            }
            if (result.data.delivery?.coordinates) {
              updatedLoads[i] = {
                ...updatedLoads[i],
                delivery_coords: result.data.delivery.coordinates,
              }
            }
          }
          
          // Delay to avoid rate limiting
          if (i < loads.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 250))
          }
        }
        
        setLoads(updatedLoads)
        setGeocodingProgress({ current: loads.length, total: loads.length, isLoading: false })
        setLocationStats({ drivers: driversWithLocations, loads: loadsWithCoords })
        
        console.log(`✅ Geocoded ${loadsWithCoords}/${loads.length} loads successfully`)
      } catch (error) {
        console.error('❌ Error loading map data:', error)
        setGeocodingProgress({ current: 0, total: 0, isLoading: false })
      }
    }

    if (drivers.length > 0 || loads.length > 0) {
      loadData()
    }
  }, []) // Only run once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setError(null)
    setCurrentQuery(query)
    
    const result = await getSmartDispatchRecommendations(query)
    
    if (result.success) {
      setRecommendation(result.recommendation || null)
      setStats({
        loads_analyzed: result.loads_analyzed || 0,
        fleet_analyzed: result.fleet_analyzed || 0,
        carriers_analyzed: result.carriers_analyzed || 0
      })
      // Store the sources for display
      if (result.sources) {
        setSources(result.sources)
      }
    } else {
      setError(result.error || 'Failed to get recommendations')
    }
    
    setLoading(false)
  }

  const handleFollowUpMessage = async (message: string): Promise<string> => {
    try {
      const result = await getSmartDispatchRecommendations(message)
      if (result.success && result.recommendation) {
        return result.recommendation
      }
      return 'I apologize, but I was unable to process your question. Please try rephrasing it.'
    } catch (error) {
      console.error('Error in follow-up message:', error)
      return 'An error occurred while processing your question.'
    }
  }

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery)
  }

  const handleLoadClick = async (loadId: number) => {
    setSelectedLoadId(loadId)
    setLoadingLoadDetails(true)
    
    try {
      const supabase = createClient()
      const { data: loadDetails, error } = await supabase
        .from('loads')
        .select(`
          *,
          customer:companies!loads_customer_id_fkey(name),
          carrier:companies!loads_carrier_id_fkey(name)
        `)
        .eq('id', loadId)
        .single()

      if (error) {
        console.error('Error fetching load details:', error)
        return
      }

      setSelectedLoadDetails(loadDetails)
    } catch (error) {
      console.error('Error fetching load details:', error)
    } finally {
      setLoadingLoadDetails(false)
    }
  }

  const handleCloseLoadDetails = () => {
    setSelectedLoadDetails(null)
    setSelectedLoadId(undefined)
  }

  const handleLoadOptimization = async () => {
    setLoadingOptimizations(true)
    setError(null)
    
    console.log('Running optimization...')
    const result = await getOptimizedAssignments()
    setLoadingOptimizations(false)
    
    if (result.success && result.data && result.data.length > 0) {
      const optimizationText = result.data
        .slice(0, 10)
        .map((opt: any, i: number) => 
          `${i + 1}. **${opt.driver_name}** → **${opt.load_number}**\n   - Distance: ${opt.distance_miles} miles\n   - Duration: ${opt.duration_minutes} minutes\n   - Score: ${opt.score.toFixed(1)}`
        )
        .join('\n\n')
      
      setRecommendation(`# Top Dispatch Recommendations\n\nBased on current driver locations and available loads:\n\n${optimizationText}`)
      console.log(`✅ Generated ${result.data.length} recommendations`)
    } else if (result.success && result.data && result.data.length === 0) {
      setError(result.message || 'No optimization results available. Make sure drivers have location data and loads are geocoded.')
    } else {
      setError(result.error || 'Failed to calculate optimizations')
      console.error('Optimization error:', result.error)
    }
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMap(!showMap)}
          className="gap-2"
        >
          <MapIcon className="h-4 w-4" />
          {showMap ? 'Hide Map' : 'Show Map'}
        </Button>
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

      {/* Map Visualization */}
      {showMap && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Dispatch Overview</span>
                {geocodingProgress.isLoading && (
                  <span className="text-sm text-gray-400 font-normal">
                    Loading locations... ({geocodingProgress.current}/{geocodingProgress.total})
                  </span>
                )}
                {!geocodingProgress.isLoading && locationStats.loads > 0 && (
                  <span className="text-sm text-gray-400 font-normal">
                    {locationStats.drivers} drivers · {locationStats.loads} loads
                  </span>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleLoadOptimization}
                disabled={loadingOptimizations || geocodingProgress.isLoading}
                className="gap-2"
              >
                {loadingOptimizations ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Optimize
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DispatchOptimizationMap
              loads={loads}
              drivers={drivers}
              selectedLoadId={selectedLoadId}
              selectedDriverId={selectedDriverId}
              onLoadClick={handleLoadClick}
              onDriverClick={setSelectedDriverId}
              className="h-[500px] w-full"
            />
          </CardContent>
        </Card>
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
              <ReactMarkdown>
                {recommendation}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Citations - Show data the AI analyzed */}
      {sources && (
        <SourceCitations sources={sources} />
      )}

      {/* Chat Interface - Ask follow-up questions */}
      {recommendation && sources && (
        <DispatchChat
          initialQuery={currentQuery}
          initialResponse={recommendation}
          sources={sources}
          onSendMessage={handleFollowUpMessage}
        />
      )}

      {/* Load Details Modal */}
      {selectedLoadDetails && !loadingLoadDetails && (
        <LoadDetailsModal
          load={selectedLoadDetails}
          onClose={handleCloseLoadDetails}
        />
      )}

      {/* Loading Indicator for Load Details */}
      {loadingLoadDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-navy-light border border-gray-700 rounded-lg p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-white text-lg">Loading load details...</p>
          </div>
        </div>
      )}
    </div>
  )
}

