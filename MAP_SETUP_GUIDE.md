# Map Integration Setup Guide

This guide will help you set up and populate map data for the TMS application.

## Prerequisites

1. **Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
   - Create a new project or select existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Geocoding API
     - Directions API
     - Distance Matrix API
   - Create API key and restrict it to your domain
   - Add the key to your `.env.local` file:
     ```
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
     ```

2. **Supabase Setup**
   - Ensure your Supabase project is configured
   - Have your Supabase URL and anon key in `.env.local`

## Step 1: Run Database Migrations

The map features require 4 new database tables. Run these migrations in your Supabase SQL editor:

```bash
# In Supabase Dashboard → SQL Editor, run each file in order:

1. migrations/001_driver_locations.sql
2. migrations/002_load_locations.sql  
3. migrations/003_route_tracking.sql
4. migrations/004_route_stops.sql
```

**What these tables do:**
- `driver_locations` - Stores real-time GPS data for drivers
- `load_locations` - Stores geocoded coordinates for load addresses
- `route_tracking` - Tracks active routes and ETAs
- `route_stops` - Manages multi-stop route sequences

## Step 2: Populate Test Data

Run the seeder script to populate your database with test map data:

```bash
# Install tsx if you haven't already
npm install -D tsx

# Run the seeder
npx tsx scripts/seed-map-data.ts
```

**What the seeder does:**
1. Distributes drivers across major US cities with realistic GPS coordinates
2. Geocodes all existing loads using Google Geocoding API
3. Creates recent timestamps for driver locations
4. Provides a summary of what was created

**Expected output:**
```
🗺️  Map Data Seeder
==================================================
🔍 Checking database tables...
✅ Table 'driver_locations' exists
✅ Table 'load_locations' exists
✅ Table 'route_tracking' exists
✅ Table 'route_stops' exists

🚛 Seeding driver locations...
Found 5 drivers
✅ Added location for John Driver near New York, NY
...

📦 Geocoding load locations...
Found 20 loads to geocode
✅ Geocoded LOAD-001
...

==================================================
📊 Summary:
==================================================
Driver Locations: 5 added, 0 failed
Load Locations: 18 geocoded, 2 failed, 0 skipped

✨ Seeding complete!
```

## Step 3: Verify the Integration

1. **Smart Dispatch Page** (`/dashboard/smart-dispatch`)
   - You should see markers on the map:
     - 🟡 Yellow circles = Pending loads
     - 🔵 Blue circles = Posted loads
     - 🟢 Green arrows = Available drivers
   - Click "Optimize" to see distance-based recommendations
   - Click markers to select them

2. **Loads Page** (`/dashboard/loads`)
   - Toggle between "Table" and "Map" views
   - Map view shows all loads with geocoded addresses
   - Click on markers to see load details in popup

3. **Load Details Modal**
   - Click any load in the table
   - Modal now includes a map showing pickup → delivery route
   - Map updates automatically when load addresses change

## Troubleshooting

### No markers showing on map

**Problem:** Map displays but no markers appear

**Solutions:**
1. Check browser console for errors
2. Verify tables exist: `SELECT * FROM driver_locations LIMIT 1;`
3. Run the seeder script if tables are empty
4. Check that Google Maps API key is set and valid

### Geocoding fails

**Problem:** Seeder shows geocoding errors

**Solutions:**
1. Verify Google Geocoding API is enabled
2. Check API key restrictions allow geocoding
3. Check if you've exceeded free tier quota (unlikely with <100 loads)
4. Ensure load addresses are in a valid format

### Optimize button does nothing

**Problem:** Clicking optimize shows no recommendations

**Solutions:**
1. Open browser console to see error messages
2. Verify both drivers and loads have location data:
   ```sql
   -- Check driver locations
   SELECT COUNT(*) FROM driver_locations;
   
   -- Check load locations  
   SELECT COUNT(*) FROM load_locations;
   ```
3. Ensure Distance Matrix API is enabled
4. Check API key quota (free tier: 40,000 requests/month)

### Map shows "API key not configured"

**Problem:** Map area shows error message

**Solutions:**
1. Verify `.env.local` has `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. Restart your development server after adding the key
3. Check that the key starts with `AIza...`
4. Verify the key is not restricted to a different domain

## Manual Testing Checklist

- [ ] Smart Dispatch map shows driver and load markers
- [ ] Markers are color-coded correctly by status
- [ ] Clicking markers highlights them with white border
- [ ] Optimize button generates recommendations
- [ ] Recommendations show realistic distances
- [ ] Loads page has Table/Map toggle buttons
- [ ] Map view displays loads with status colors
- [ ] Clicking load marker shows info popup
- [ ] Load details modal includes route map
- [ ] Map auto-zooms to fit all markers

## API Usage & Costs

With seeded test data, typical usage:
- **Maps JavaScript API**: ~10 loads/day = 300/month (Free tier: 28,000)
- **Geocoding API**: One-time for existing loads (Free tier: 40,000)  
- **Distance Matrix API**: ~20 optimizations/day = 600/month (Free tier: 40,000)

**Expected monthly cost**: $0 (well within free tier)

## Next Steps

Once everything is working:

1. **Add more test data** - Run seeder again after adding more loads/drivers
2. **Set up driver mobile app** - Implement real GPS tracking from drivers
3. **Enable real-time updates** - Consider WebSocket for live tracking
4. **Customize map styling** - Add custom map theme in Google Cloud Console
5. **Add geofencing** - Automatic notifications when driver reaches location

## Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [TMS Map Implementation Guide](./GOOGLE_MAPS_IMPLEMENTATION.md)

## Support

If you encounter issues not covered here:

1. Check browser console for JavaScript errors
2. Check Supabase logs for database errors  
3. Verify all environment variables are set
4. Review the main implementation docs: `GOOGLE_MAPS_IMPLEMENTATION.md`



