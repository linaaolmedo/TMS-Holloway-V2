# Quick Start - Map Integration

## 3-Step Setup (5-10 minutes)

### Step 1: Run Database Migrations (2 minutes)

Open Supabase Dashboard → SQL Editor → New Query

Copy and paste each file, then click "Run":

1. `migrations/001_driver_locations.sql` → Run
2. `migrations/002_load_locations.sql` → Run
3. `migrations/003_route_tracking.sql` → Run
4. `migrations/004_route_stops.sql` → Run

**Expected:** "Success. No rows returned" for each

### Step 2: Set Google Maps API Key (1 minute)

Add to `.env.local` (create if it doesn't exist):

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your_key_here
```

**Don't have a key?** Get one at https://console.cloud.google.com/google/maps-apis
- Enable: Maps JavaScript API, Geocoding API, Distance Matrix API, Directions API
- Free tier: 40,000 requests/month (plenty for testing)

Restart your dev server after adding the key!

### Step 3: Seed Test Data (2-5 minutes)

```bash
npm install -D tsx
npx tsx scripts/seed-map-data.ts
```

**Expected output:**
```
✅ Found locations for 5/5 drivers
✅ Geocoded 18/20 loads successfully
```

## Verify It Works

### Smart Dispatch (`/dashboard/smart-dispatch`)
- [ ] Map shows markers (yellow/blue circles = loads, green arrows = drivers)
- [ ] Status shows: "5 drivers · 18 loads"
- [ ] Click "Optimize" → Shows recommendations with distances
- [ ] Check browser console for debug logs

### Loads Page (`/dashboard/loads`)
- [ ] Toggle between "Table" and "Map" views in header
- [ ] Map shows color-coded load markers
- [ ] Click marker → Info popup appears
- [ ] Legend shows status counts

### Load Details Modal
- [ ] Click any load in table
- [ ] Map shows pickup (green) → delivery (red) route
- [ ] Already working from previous implementation

## Troubleshooting

**No markers showing:**
```bash
# Check if tables have data
# Open Supabase SQL Editor and run:
SELECT COUNT(*) FROM driver_locations;
SELECT COUNT(*) FROM load_locations;

# Both should return > 0
# If 0, run the seeder script again
```

**"API key not configured" message:**
1. Check `.env.local` has the key
2. Key must start with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=`
3. Restart dev server: Stop and run `npm run dev` again

**Optimize button does nothing:**
1. Open browser console (F12)
2. Look for error messages
3. Common cause: Tables empty (run seeder) or API key issue

## That's It!

You should now have:
- ✅ Working Smart Dispatch with markers
- ✅ Loads page with map view  
- ✅ Optimize button calculating distances
- ✅ Test data for 5 drivers and ~18 loads

## Next Steps (Optional)

- Read [MAP_SETUP_GUIDE.md](./MAP_SETUP_GUIDE.md) for detailed docs
- Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for what was built
- Customize map styling in Google Cloud Console
- Add more test data by running seeder again

## Need Help?

1. Check browser console (F12) for errors
2. Read [MAP_SETUP_GUIDE.md](./MAP_SETUP_GUIDE.md) troubleshooting section
3. Verify all environment variables are set
4. Ensure migrations completed successfully



