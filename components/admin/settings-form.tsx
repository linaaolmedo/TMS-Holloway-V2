'use client'

import { useState } from 'react'
import { updateSystemSetting } from '@/app/actions/admin'
import { useRouter } from 'next/navigation'
import { Settings, Save } from 'lucide-react'

interface SystemSetting {
  id: number
  setting_key: string
  setting_value: any
  setting_type: 'string' | 'number' | 'boolean' | 'json' | 'template'
  category: 'general' | 'notifications' | 'documents' | 'pricing' | 'features' | 'security'
  description: string | null
  is_public: boolean
  updated_by: string | null
  created_at: string
  updated_at: string
}

interface SettingsFormProps {
  settings: SystemSetting[]
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<{ [key: string]: any }>({})

  const categories = ['all', 'general', 'pricing', 'features', 'documents', 'notifications', 'security']

  const filteredSettings = settings.filter((setting) => {
    return selectedCategory === 'all' || setting.category === selectedCategory
  })

  const handleUpdate = async (settingKey: string, newValue: any) => {
    setLoading(settingKey)
    const result = await updateSystemSetting(settingKey, newValue)
    if (result.success) {
      setEditingValues((prev) => {
        const updated = { ...prev }
        delete updated[settingKey]
        return updated
      })
      router.refresh()
    } else {
      alert('error' in result ? result.error : 'Failed to update setting')
    }
    setLoading(null)
  }

  const parseValue = (setting: SystemSetting) => {
    if (typeof setting.setting_value === 'string') {
      try {
        return JSON.parse(setting.setting_value)
      } catch {
        return setting.setting_value
      }
    }
    return setting.setting_value
  }

  const renderInput = (setting: SystemSetting) => {
    const currentValue = editingValues[setting.setting_key] !== undefined
      ? editingValues[setting.setting_key]
      : parseValue(setting)

    const handleChange = (value: any) => {
      setEditingValues((prev) => ({
        ...prev,
        [setting.setting_key]: value,
      }))
    }

    const hasChanges = editingValues[setting.setting_key] !== undefined

    switch (setting.setting_type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentValue === true || currentValue === 'true'}
                onChange={(e) => handleChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
            {hasChanges && (
              <button
                onClick={() => handleUpdate(setting.setting_key, editingValues[setting.setting_key])}
                disabled={loading === setting.setting_key}
                className="flex items-center gap-1 bg-yellow-500 text-navy px-3 py-1 rounded text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                <Save className="h-3 w-3" />
                Save
              </button>
            )}
          </div>
        )
      case 'number':
        return (
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={currentValue}
              onChange={(e) => handleChange(parseFloat(e.target.value))}
              className="flex-1 px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            />
            {hasChanges && (
              <button
                onClick={() => handleUpdate(setting.setting_key, editingValues[setting.setting_key])}
                disabled={loading === setting.setting_key}
                className="flex items-center gap-1 bg-yellow-500 text-navy px-3 py-1 rounded text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                <Save className="h-3 w-3" />
                Save
              </button>
            )}
          </div>
        )
      case 'string':
        return (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={currentValue}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1 px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            />
            {hasChanges && (
              <button
                onClick={() => handleUpdate(setting.setting_key, editingValues[setting.setting_key])}
                disabled={loading === setting.setting_key}
                className="flex items-center gap-1 bg-yellow-500 text-navy px-3 py-1 rounded text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                <Save className="h-3 w-3" />
                Save
              </button>
            )}
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-3">
            <textarea
              value={JSON.stringify(currentValue, null, 2)}
              onChange={(e) => {
                try {
                  handleChange(JSON.parse(e.target.value))
                } catch {
                  // Keep as string if invalid JSON
                }
              }}
              rows={3}
              className="flex-1 px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 font-mono text-xs"
            />
            {hasChanges && (
              <button
                onClick={() => handleUpdate(setting.setting_key, editingValues[setting.setting_key])}
                disabled={loading === setting.setting_key}
                className="flex items-center gap-1 bg-yellow-500 text-navy px-3 py-1 rounded text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                <Save className="h-3 w-3" />
                Save
              </button>
            )}
          </div>
        )
    }
  }

  const settingsByCategory = categories.slice(1).map((category) => {
    const categorySettings = settings.filter((s) => s.category === category)
    return {
      category,
      settings: categorySettings,
      count: categorySettings.length,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">System Settings</h1>
        <p className="text-sm text-gray-400">Configure global system settings and preferences</p>
      </div>

      {/* Category Filter */}
      <div className="bg-darkblue rounded-lg p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-yellow-500 text-navy'
                  : 'bg-navy text-gray-400 hover:text-white'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
              {category !== 'all' && (
                <span className="ml-2 text-xs opacity-75">
                  ({settings.filter((s) => s.category === category).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {settingsByCategory.map(({ category, count }) => (
          <div key={category} className="bg-darkblue rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{count}</div>
            <div className="text-sm text-gray-400 capitalize">{category}</div>
          </div>
        ))}
      </div>

      {/* Settings List */}
      <div className="space-y-4">
        {filteredSettings.map((setting) => (
          <div key={setting.id} className="bg-darkblue rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-semibold">{setting.setting_key}</h3>
                {setting.description && (
                  <p className="text-sm text-gray-400 mt-1">{setting.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 capitalize">
                    {setting.category}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400 capitalize">
                    {setting.setting_type}
                  </span>
                  {setting.is_public && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                      Public
                    </span>
                  )}
                </div>
              </div>
              <Settings className="h-5 w-5 text-gray-400" />
            </div>
            {renderInput(setting)}
            <div className="mt-2 text-xs text-gray-500">
              Last updated: {new Date(setting.updated_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {filteredSettings.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No settings found in this category</p>
        </div>
      )}
    </div>
  )
}

