'use client'

import { useEffect, useState } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import { Coordinates } from '@/lib/types/database.types'
import { getDirections } from '@/lib/maps/directions'

interface DirectionsPolylineProps {
  origin: Coordinates
  destination: Coordinates
  strokeColor?: string
  strokeOpacity?: number
  strokeWeight?: number
}

/**
 * Component that draws a route following actual roads using Google Directions API
 */
export function DirectionsPolyline({
  origin,
  destination,
  strokeColor = '#8b5cf6',
  strokeOpacity = 0.6,
  strokeWeight = 3,
}: DirectionsPolylineProps) {
  const map = useMap()
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null)

  useEffect(() => {
    if (!map || typeof google === 'undefined') return

    // Create a new directions renderer
    const renderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true, // We'll use our own markers
      polylineOptions: {
        strokeColor,
        strokeOpacity,
        strokeWeight,
      },
    })

    setDirectionsRenderer(renderer)

    return () => {
      renderer.setMap(null)
    }
  }, [map, strokeColor, strokeOpacity, strokeWeight])

  useEffect(() => {
    if (!directionsRenderer || !origin || !destination) return

    // Get and display directions
    const fetchDirections = async () => {
      try {
        const directionsService = new google.maps.DirectionsService()
        
        const request: google.maps.DirectionsRequest = {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode: google.maps.TravelMode.DRIVING,
        }

        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result)
          } else {
            console.warn('Directions request failed:', status)
          }
        })
      } catch (error) {
        console.error('Error fetching directions:', error)
      }
    }

    fetchDirections()
  }, [directionsRenderer, origin, destination])

  return null
}

