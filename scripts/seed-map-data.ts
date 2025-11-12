/**
 * Seed Map Data Script
 * 
 * This script populates the database with test data for map visualization:
 * - Geocodes all existing loads
 * - Generates realistic driver location data
 * 
 * Usage: npx tsx scripts/seed-map-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  process.exit(1)
}

if (!googleApiKey) {
  console.error('❌ Missing Google Maps API key in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Major US cities with coordinates for distributing drivers
const US_CITIES = [
  { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
  { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652 },
  { name: 'San Antonio, TX', lat: 29.4241, lng: -98.4936 },
  { name: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
  { name: 'Atlanta, GA', lat: 33.7490, lng: -84.3880 },
  { name: 'Miami, FL', lat: 25.7617, lng: -80.1918 },
  { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Nashville, TN', lat: 36.1627, lng: -86.7816 },
  { name: 'Detroit, MI', lat: 42.3314, lng: -83.0458 },
  { name: 'Portland, OR', lat: 45.5155, lng: -122.6789 },
]

async function geocodeAddress(address: string) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`
    )
    const data = await response.json()

    if (data.status === 'OK' && data.results?.[0]) {
      return {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
        accuracy: data.results[0].geometry.location_type,
        formatted_address: data.results[0].formatted_address,
      }
    }
    return null
  } catch (error) {
    console.error(`Error geocoding ${address}:`, error)
    return null
  }
}

async function seedDriverLocations() {
  console.log('\n🚛 Seeding driver locations...')

  // Get all drivers
  const { data: drivers, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('role', 'driver')

  if (error || !drivers || drivers.length === 0) {
    console.log('⚠️  No drivers found in database')
    return { success: 0, failed: 0 }
  }

  console.log(`Found ${drivers.length} drivers`)

  let success = 0
  let failed = 0

  for (let i = 0; i < drivers.length; i++) {
    const driver = drivers[i]
    const city = US_CITIES[i % US_CITIES.length]

    // Add some randomness to location (within ~20 miles of city center)
    const latOffset = (Math.random() - 0.5) * 0.3
    const lngOffset = (Math.random() - 0.5) * 0.3

    const location = {
      driver_id: driver.id,
      latitude: city.lat + latOffset,
      longitude: city.lng + lngOffset,
      heading: Math.floor(Math.random() * 360),
      speed: Math.floor(Math.random() * 70) + 30, // 30-100 mph
      accuracy: Math.floor(Math.random() * 50) + 5, // 5-55 meters
      timestamp: new Date().toISOString(),
    }

    const { error: insertError } = await supabase
      .from('driver_locations')
      .insert(location)

    if (insertError) {
      console.log(`❌ Failed to insert location for ${driver.name}: ${insertError.message}`)
      failed++
    } else {
      console.log(`✅ Added location for ${driver.name} near ${city.name}`)
      success++
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { success, failed }
}

async function seedLoadLocations() {
  console.log('\n📦 Geocoding load locations...')

  // Get all loads with addresses
  const { data: loads, error } = await supabase
    .from('loads')
    .select('id, load_number, pickup_location, delivery_location')
    .not('pickup_location', 'is', null)
    .limit(50)

  if (error || !loads || loads.length === 0) {
    console.log('⚠️  No loads found in database')
    return { success: 0, failed: 0, skipped: 0 }
  }

  console.log(`Found ${loads.length} loads to geocode`)

  let success = 0
  let failed = 0
  let skipped = 0

  for (const load of loads) {
    // Check if already geocoded
    const { data: existing } = await supabase
      .from('load_locations')
      .select('id')
      .eq('load_id', load.id)
      .single()

    if (existing) {
      console.log(`⏭️  Skipping ${load.load_number} (already geocoded)`)
      skipped++
      continue
    }

    console.log(`Geocoding ${load.load_number}...`)

    const pickupResult = load.pickup_location 
      ? await geocodeAddress(load.pickup_location)
      : null

    const deliveryResult = load.delivery_location
      ? await geocodeAddress(load.delivery_location)
      : null

    if (!pickupResult && !deliveryResult) {
      console.log(`❌ Failed to geocode ${load.load_number}`)
      failed++
      continue
    }

    const locationData = {
      load_id: load.id,
      pickup_lat: pickupResult?.lat || null,
      pickup_lng: pickupResult?.lng || null,
      delivery_lat: deliveryResult?.lat || null,
      delivery_lng: deliveryResult?.lng || null,
      geocoding_accuracy: pickupResult?.accuracy || deliveryResult?.accuracy || null,
    }

    const { error: insertError } = await supabase
      .from('load_locations')
      .insert(locationData)

    if (insertError) {
      console.log(`❌ Failed to save location for ${load.load_number}: ${insertError.message}`)
      failed++
    } else {
      console.log(`✅ Geocoded ${load.load_number}`)
      success++
    }

    // Delay to avoid rate limiting (Google has 50 req/sec limit)
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return { success, failed, skipped }
}

async function checkTables() {
  console.log('🔍 Checking database tables...')

  const tables = ['driver_locations', 'load_locations', 'route_tracking', 'route_stops']
  const missing = []

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1)
    
    if (error) {
      console.log(`❌ Table '${table}' not found or not accessible`)
      missing.push(table)
    } else {
      console.log(`✅ Table '${table}' exists`)
    }
  }

  if (missing.length > 0) {
    console.log('\n⚠️  Missing tables detected. Please run migrations first:')
    missing.forEach(table => {
      console.log(`   - migrations/${table}.sql`)
    })
    return false
  }

  return true
}

async function main() {
  console.log('🗺️  Map Data Seeder\n')
  console.log('=' .repeat(50))

  // Check tables exist
  const tablesExist = await checkTables()
  if (!tablesExist) {
    console.log('\n❌ Cannot proceed without required tables')
    process.exit(1)
  }

  // Seed driver locations
  const driverResults = await seedDriverLocations()
  
  // Seed load locations
  const loadResults = await seedLoadLocations()

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary:')
  console.log('=' .repeat(50))
  console.log(`Driver Locations: ${driverResults.success} added, ${driverResults.failed} failed`)
  console.log(`Load Locations: ${loadResults.success} geocoded, ${loadResults.failed} failed, ${loadResults.skipped} skipped`)
  console.log('\n✨ Seeding complete!')
}

main().catch(console.error)



