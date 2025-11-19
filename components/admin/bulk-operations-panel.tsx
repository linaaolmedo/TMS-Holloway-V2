'use client'

import { useState } from 'react'
import { Database, Upload, Archive, AlertTriangle, CheckCircle } from 'lucide-react'

export function BulkOperationsPanel() {
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null)

  const operations = [
    {
      id: 'bulk-rates',
      title: 'Bulk Rate Updates',
      description: 'Upload CSV to update carrier or customer rates for multiple loads',
      icon: Upload,
      color: 'blue',
    },
    {
      id: 'archive-loads',
      title: 'Archive Old Loads',
      description: 'Soft delete loads older than specified date',
      icon: Archive,
      color: 'yellow',
    },
    {
      id: 'data-integrity',
      title: 'Data Integrity Check',
      description: 'Run diagnostics to identify orphaned records and inconsistencies',
      icon: Database,
      color: 'green',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Data Tools</h1>
        <p className="text-sm text-gray-400">
          Perform bulk operations and data maintenance tasks
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
        <div>
          <p className="text-red-400 font-semibold">Caution: Powerful Operations</p>
          <p className="text-sm text-gray-400 mt-1">
            These tools can modify large amounts of data. Always backup before proceeding and
            test with small datasets first.
          </p>
        </div>
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {operations.map((operation) => {
          const Icon = operation.icon
          return (
            <button
              key={operation.id}
              onClick={() => setSelectedOperation(operation.id)}
              className="bg-darkblue rounded-lg p-6 text-left hover:bg-navy transition-colors"
            >
              <Icon className={`h-8 w-8 text-${operation.color}-500 mb-3`} />
              <h3 className="text-white font-semibold mb-2">{operation.title}</h3>
              <p className="text-sm text-gray-400">{operation.description}</p>
            </button>
          )
        })}
      </div>

      {/* Operation Details */}
      {selectedOperation === 'bulk-rates' && (
        <div className="bg-darkblue rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Bulk Rate Updates</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Upload CSV File
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="file"
                accept=".csv"
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-yellow-500 file:text-navy
                  hover:file:bg-yellow-400
                  cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-2">
                CSV format: load_id, rate_type (customer/carrier), new_rate
              </p>
            </div>
            <div className="flex gap-3">
              <button className="bg-yellow-500 text-navy px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-semibold">
                Process Upload
              </button>
              <button
                onClick={() => setSelectedOperation(null)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOperation === 'archive-loads' && (
        <div className="bg-darkblue rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Archive Old Loads</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Archive loads older than
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Only closed loads will be archived (soft delete)
              </p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                This operation will mark loads as deleted but won't remove them from the
                database. They can be recovered if needed.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="bg-yellow-500 text-navy px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-semibold">
                Preview Archive
              </button>
              <button
                onClick={() => setSelectedOperation(null)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOperation === 'data-integrity' && (
        <div className="bg-darkblue rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Data Integrity Check</h2>
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
              <p className="text-blue-400 text-sm mb-2">This check will scan for:</p>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                <li>Loads with missing customer or carrier references</li>
                <li>Users without company associations (external roles)</li>
                <li>Orphaned documents or invoices</li>
                <li>Duplicate load numbers</li>
                <li>Invalid status transitions</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button className="bg-yellow-500 text-navy px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-semibold">
                Run Integrity Check
              </button>
              <button
                onClick={() => setSelectedOperation(null)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Stats */}
      <div className="bg-darkblue rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">-</div>
            <div className="text-sm text-gray-400">Total Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">-</div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">-</div>
            <div className="text-sm text-gray-400">Archived</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">-</div>
            <div className="text-sm text-gray-400">Storage Used</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Statistics are updated daily at midnight
        </p>
      </div>

      {/* Best Practices */}
      <div className="bg-darkblue rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Best Practices</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-white font-medium">Always backup before bulk operations</p>
              <p className="text-sm text-gray-400">
                Contact your database administrator to create a backup snapshot
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-white font-medium">Test with small datasets first</p>
              <p className="text-sm text-gray-400">
                Validate CSV format and data with 5-10 records before full upload
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-white font-medium">Run integrity checks monthly</p>
              <p className="text-sm text-gray-400">
                Regular checks help identify and fix data issues early
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

