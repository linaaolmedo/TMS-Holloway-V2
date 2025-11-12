'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Database, Truck, Building2, Package } from 'lucide-react'

interface SourceCitationsProps {
  sources: {
    loads: any[]
    fleet: any[]
    carriers: any[]
    rawLoads: any[]
  }
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <Card className="border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-400" />
          Data Sources
          <span className="text-sm text-gray-400 font-normal">
            - View what data the AI analyzed
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Loads Section */}
        {sources.loads.length > 0 && (
          <div className="border border-gray-700 rounded-lg">
            <button
              onClick={() => toggleSection('loads')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-blue-400" />
                <div className="text-left">
                  <p className="font-semibold text-white">Loads</p>
                  <p className="text-xs text-gray-400">{sources.loads.length} records analyzed</p>
                </div>
              </div>
              {expandedSection === 'loads' ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSection === 'loads' && (
              <div className="px-4 pb-4 max-h-96 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Load #</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Origin</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Destination</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Status</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Equipment</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Pickup</th>
                        <th className="text-right py-2 px-2 text-gray-400 font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sources.loads.map((load, idx) => (
                        <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                          <td className="py-2 px-2 text-white font-mono text-xs">{load.id}</td>
                          <td className="py-2 px-2 text-gray-300 text-xs">{load.origin || 'N/A'}</td>
                          <td className="py-2 px-2 text-gray-300 text-xs">{load.destination || 'N/A'}</td>
                          <td className="py-2 px-2">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
                              {load.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-300 text-xs">{load.equipment || 'N/A'}</td>
                          <td className="py-2 px-2 text-gray-300 text-xs">
                            {load.pickup_date ? new Date(load.pickup_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-2 px-2 text-right text-green-400 text-xs font-medium">
                            {load.customer_rate ? `$${Number(load.customer_rate).toFixed(2)}` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fleet Section */}
        {sources.fleet.length > 0 && (
          <div className="border border-gray-700 rounded-lg">
            <button
              onClick={() => toggleSection('fleet')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-green-400" />
                <div className="text-left">
                  <p className="font-semibold text-white">Fleet</p>
                  <p className="text-xs text-gray-400">{sources.fleet.length} trucks/trailers analyzed</p>
                </div>
              </div>
              {expandedSection === 'fleet' ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSection === 'fleet' && (
              <div className="px-4 pb-4 max-h-96 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Unit #</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Vehicle</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Year</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Status</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Driver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sources.fleet.map((truck, idx) => (
                        <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                          <td className="py-2 px-2 text-white font-mono text-xs">{truck.unit_number}</td>
                          <td className="py-2 px-2 text-gray-300 text-xs">
                            {truck.make} {truck.model}
                          </td>
                          <td className="py-2 px-2 text-gray-300 text-xs">{truck.year || 'N/A'}</td>
                          <td className="py-2 px-2">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                              {truck.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-300 text-xs">
                            {truck.assigned_driver || 'Unassigned'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Carriers Section */}
        {sources.carriers.length > 0 && (
          <div className="border border-gray-700 rounded-lg">
            <button
              onClick={() => toggleSection('carriers')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-purple-400" />
                <div className="text-left">
                  <p className="font-semibold text-white">Carriers</p>
                  <p className="text-xs text-gray-400">{sources.carriers.length} carriers analyzed</p>
                </div>
              </div>
              {expandedSection === 'carriers' ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSection === 'carriers' && (
              <div className="px-4 pb-4 max-h-96 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Carrier Name</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">MC Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sources.carriers.map((carrier, idx) => (
                        <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                          <td className="py-2 px-2 text-white text-xs">{carrier.name}</td>
                          <td className="py-2 px-2 text-gray-300 font-mono text-xs">
                            {carrier.mc_number || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-400 pt-2 px-2">
          💡 The AI model analyzed this data to generate recommendations. You can ask follow-up questions to explore specific details.
        </div>
      </CardContent>
    </Card>
  )
}


