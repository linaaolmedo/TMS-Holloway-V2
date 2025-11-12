'use client'

import { useMap } from '@vis.gl/react-google-maps'
import { useEffect, useRef } from 'react'
import { Coordinates } from '@/lib/types/database.types'

interface PolylineProps {
  path: Coordinates[]
  strokeColor?: string
  strokeOpacity?: number
  strokeWeight?: number
  options?: google.maps.PolylineOptions
}

export function Polyline({
  path,
  strokeColor = '#3b82f6',
  strokeOpacity = 0.6,
  strokeWeight = 3,
  options = {},
}: PolylineProps) {
  const map = useMap()
  const polylineRef = useRef<google.maps.Polyline | null>(null)

  useEffect(() => {
    if (!map) return

    // Create polyline
    const polyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      ...options,
    })

    polyline.setMap(map)
    polylineRef.current = polyline

    // Cleanup
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
      }
    }
  }, [map, path, strokeColor, strokeOpacity, strokeWeight, options])

  // Update polyline when props change
  useEffect(() => {
    if (!polylineRef.current) return

    polylineRef.current.setOptions({
      path,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      ...options,
    })
  }, [path, strokeColor, strokeOpacity, strokeWeight, options])

  return null
}

