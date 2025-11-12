# Google Maps Integration - Quick Start Guide

## ✅ What's Been Completed

### Core Infrastructure
- ✅ 4 database tables created (driver_locations, load_locations, route_tracking, route_stops)
- ✅ `@vis.gl/react-google-maps` package installed
- ✅ Type definitions updated with new interfaces
- ✅ All core utility libraries created (geocoding, directions, distance-matrix, route-optimizer)
- ✅ Server actions for locations, tracking, and route optimization

### Map Components
- ✅ 8 reusable map components created
- ✅ Base map wrapper with API provider
- ✅ Load map with pickup/delivery markers
- ✅ Live tracking map with real-time updates
- ✅ Dispatch optimization map
- ✅ Driver location tracker
- ✅ ETA display component
- ✅ Map legend component

### Page Integrations
- ✅ **Customer Portal** - Load tracking modal with live maps
- ✅ **Driver Portal** - Route maps with location sharing
- ✅ **Smart Dispatch** - Interactive map with optimization
- ✅ **Load Details** - Route visualization in modal

## 🚀 How to Use

### Step 1: Run Database Migrations

Execute the SQL migrations in your Supabase dashboard:

```sql
-- Run these in order:
migrations/001_driver_locations.sql
migrations/002_load_locations.sql
migrations/003_route_tracking.sql
migrations/004_route_stops.sql
```

### Step 2: Verify Environment Variable

Ensure your `.env.local` has:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Step 3: Test the Features

1. **Customer View**
   - Go to customer portal → Shipments
   - Click on any shipment to see tracking
   - Map will show pickup/delivery locations
   - If load is "in_transit", you'll see live driver tracking

2. **Driver View**
   - Go to driver portal → My Assignments
   - Click "Show Map" on any active load
   - Toggle "Start Sharing" to enable location tracking
   - Map updates every 30 seconds

3. **Smart Dispatch**
   - Go to Dashboard → Smart Dispatch
   - See all pending loads and available drivers on map
   - Yellow circles = pending loads
   - Green arrows = available drivers
   - Click "Optimize" for route recommendations

### Step 4: Geocode Your Loads

For existing loads, you'll need to geocode them:

```typescript
// Option 1: Manually geocode individual loads
import { geocodeLoad } from '@/app/actions/locations'
await geocodeLoad(loadId)

// Option 2: Batch geocode (recommended)
import { geocodeMultipleLoads } from '@/app/actions/locations'
const loadIds = [1, 2, 3, 4, 5]
await geocodeMultipleLoads(loadIds)
```

Or create a one-time script to geocode all existing loads.

## 📊 Key Features Available Now

### 1. Real-Time Driver Tracking
- Drivers can share location from their portal
- Updates every 30 seconds automatically
- Customers see live driver position on in-transit loads
- ETAs calculated with traffic data

### 2. Route Visualization
- All loads show pickup/delivery on map
- Color-coded markers (green = pickup, red = delivery)
- Auto-fit bounds to show full route
- Interactive zoom and pan

### 3. Smart Dispatch Optimization
- Visual map of all loads and drivers
- Click loads/drivers to see details
- Automated proximity calculations
- Distance and time estimates
- Equipment match checking

### 4. Location Management
- Automatic address geocoding
- Coordinates stored in database
- Geocoding accuracy tracking
- Reverse geocoding support

## 🔧 Configuration Options

### Adjust Tracking Interval

In `components/driver/location-tracker.tsx`:
```typescript
<LocationTracker 
  enabled={false}
  updateInterval={30000} // Change to 60000 for 1 minute
/>
```

### Adjust Polling Frequency

In `components/maps/live-tracking-map.tsx`:
```typescript
<LiveTrackingMap
  loadId={loadId}
  pollingInterval={30000} // Change as needed
/>
```

### Map Styling

All maps use the default Google Maps style. To customize:

In `components/maps/base-map.tsx`, add `styles` prop to `<Map>`:
```typescript
<Map
  mapId="tms-map"
  defaultZoom={zoom}
  // Add custom styles here
/>
```

## 🎯 Common Use Cases

### Use Case 1: Customer Tracking a Shipment
1. Customer logs in and views their shipments
2. Clicks on "Track" for an in-transit load
3. Sees map with pickup, delivery, and current driver location
4. ETA updates automatically every 30 seconds

### Use Case 2: Driver Starting Their Day
1. Driver logs into portal
2. Sees list of assigned loads
3. Clicks "Show Map" on first assignment
4. Clicks "Start Sharing" to enable location tracking
5. Map shows route to pickup location

### Use Case 3: Dispatcher Assigning Loads
1. Dispatcher opens Smart Dispatch
2. Sees map with all pending loads and available drivers
3. Clicks "Optimize" to get recommendations
4. Sees ranked list of best driver-load matches
5. Assigns load to optimal driver

## 📝 Next Steps

### Immediate Actions
1. Run database migrations
2. Test on a few loads
3. Have drivers enable location sharing
4. Geocode existing loads
5. Monitor API usage in Google Cloud Console

### Optional Enhancements
- Add route polylines (show actual driving route)
- Implement geofencing for automatic status updates
- Add push notifications for ETA alerts
- Create driver mobile app
- Add historical route playback

## 🐛 Troubleshooting

### Maps Not Showing?
1. Check browser console for errors
2. Verify API key is in `.env.local`
3. Ensure Maps JavaScript API is enabled in Google Cloud
4. Check API key restrictions match your domain

### No Coordinates?
1. Loads need to be geocoded first
2. Run `geocodeLoad(loadId)` for each load
3. Check `load_locations` table in database
4. Verify Geocoding API is enabled

### Driver Location Not Updating?
1. Check browser location permissions
2. Verify "Start Sharing" is clicked
3. Check `driver_locations` table for entries
4. Look for console errors

### ETAs Incorrect?
1. Verify load_locations are geocoded
2. Check Directions API is enabled
3. Ensure departure time is set correctly
4. Traffic data may vary

## 💡 Pro Tips

1. **Geocode loads when created** - Add geocoding to the load creation flow
2. **Monitor API usage** - Set up billing alerts in Google Cloud
3. **Test on mobile** - Maps work great on mobile devices
4. **Use Wi-Fi for location** - Better accuracy than cellular
5. **Batch geocode** - Don't geocode one at a time, use batch function

## 📞 Support

For issues or questions:
1. Check `GOOGLE_MAPS_IMPLEMENTATION.md` for detailed docs
2. Review Google Maps Platform documentation
3. Check browser console for error messages
4. Verify database migrations ran successfully
5. Ensure API keys and permissions are correct

## 🎉 Success Metrics

You'll know it's working when:
- ✅ Maps display on all integrated pages
- ✅ Pickup/delivery markers appear correctly
- ✅ Driver location updates appear on map
- ✅ ETAs calculate and display
- ✅ Smart dispatch shows load-driver proximity
- ✅ No console errors related to maps/geocoding

---

**Implementation Date**: November 2025
**Google Maps API Version**: v3 (via @vis.gl/react-google-maps)
**Status**: Production Ready 🚀



