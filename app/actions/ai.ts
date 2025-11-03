'use server'

import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'

// AI Gateway is automatically used when AI_GATEWAY_API_KEY is set in environment variables
// No additional configuration needed - the AI SDK detects and uses the gateway automatically

export async function getSmartDispatchRecommendations(query: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Fetch available loads
    const { data: loads, error: loadsError } = await supabase
      .from('loads')
      .select(`
        *,
        customer:companies!loads_customer_id_fkey(name),
        carrier:companies!loads_carrier_id_fkey(name),
        driver:users!loads_driver_id_fkey(name)
      `)
      .in('status', ['draft', 'pending', 'posted'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (loadsError) {
      console.error('Error fetching loads:', loadsError)
      return { success: false, error: 'Failed to fetch loads' }
    }

    // Fetch available drivers/trucks
    const { data: fleet, error: fleetError } = await supabase
      .from('fleet')
      .select('*')
      .eq('status', 'available')
      .limit(50)

    if (fleetError) {
      console.error('Error fetching fleet:', fleetError)
    }

    // Fetch available carriers
    const { data: carriers, error: carriersError } = await supabase
      .from('companies')
      .select('*')
      .eq('type', 'carrier')
      .limit(50)

    if (carriersError) {
      console.error('Error fetching carriers:', carriersError)
    }

    // Prepare context for AI
    const context = {
      loads: loads?.map(load => ({
        id: load.load_number,
        origin: load.pickup_location,
        destination: load.delivery_location,
        pickup_date: load.pickup_time,
        delivery_date: load.delivery_time,
        commodity: load.commodity,
        equipment: load.equipment_type,
        weight: load.weight,
        customer: load.customer?.name,
        carrier: load.carrier?.name,
        driver: load.driver?.name,
        status: load.status,
        customer_rate: load.customer_rate,
        carrier_rate: load.carrier_rate,
        margin: load.customer_rate && load.carrier_rate 
          ? ((load.customer_rate - load.carrier_rate) / load.customer_rate * 100).toFixed(2)
          : null
      })),
      fleet: fleet?.map(truck => ({
        unit_number: truck.unit_number,
        make: truck.make,
        model: truck.model,
        year: truck.year,
        status: truck.status,
        assigned_driver: truck.assigned_driver_id,
      })),
      carriers: carriers?.map(carrier => ({
        name: carrier.name,
        mc_number: carrier.mc_number,
      }))
    }

    // Call AI using Vercel AI SDK via AI Gateway
    const { text } = await generateText({
      model: 'google/gemini-2.5-flash-lite',
      system: `You are a smart dispatch AI assistant for a Transportation Management System (TMS). 
Your role is to analyze loads, available fleet, and carriers to provide intelligent dispatch recommendations.

Consider factors like:
- Geographic efficiency (matching origin/destination with driver locations)
- Equipment availability and requirements
- Pickup and delivery time windows
- Margin optimization (revenue vs carrier cost)
- Driver hours and availability
- Equipment type matching
- Load urgency based on pickup dates

Provide clear, actionable recommendations with reasoning. Format your response with:
1. Key insights and priorities
2. Specific load-to-resource recommendations
3. Reasoning for each recommendation
4. Potential issues or conflicts to be aware of

Current data context:
- Available loads: ${context.loads?.length || 0}
- Available fleet: ${context.fleet?.length || 0}
- Available carriers: ${context.carriers?.length || 0}

Use markdown formatting for clarity.`,
      prompt: `${query}\n\nCurrent system data:\n${JSON.stringify(context, null, 2)}`,
      temperature: 0.7,
    })

    const recommendation = text || 'No recommendations available.'

    return { 
      success: true, 
      recommendation,
      loads_analyzed: context.loads?.length || 0,
      fleet_analyzed: context.fleet?.length || 0,
      carriers_analyzed: context.carriers?.length || 0
    }
  } catch (error) {
    console.error('Error in getSmartDispatchRecommendations:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function generateNaturalLanguageReport(query: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Fetch all relevant data
    const { data: loads, error: loadsError } = await supabase
      .from('loads')
      .select(`
        *,
        customer:companies!loads_customer_id_fkey(name),
        carrier:companies!loads_carrier_id_fkey(name),
        driver:users!loads_driver_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (loadsError) {
      console.error('Error fetching loads:', loadsError)
      const errorDetails = loadsError.message || 'Unknown error'
      const errorHint = loadsError.hint || ''
      const errorCode = loadsError.code || ''
      return { 
        success: false, 
        error: `Failed to fetch loads data: ${errorDetails}${errorHint ? ` (${errorHint})` : ''}${errorCode ? ` [Code: ${errorCode}]` : ''}`
      }
    }

    // Fetch carriers
    const { data: carriers } = await supabase
      .from('companies')
      .select('*')
      .eq('type', 'carrier')

    // Fetch customers
    const { data: customers } = await supabase
      .from('companies')
      .select('*')
      .eq('type', 'shipper')

    // Fetch fleet
    const { data: fleet } = await supabase
      .from('fleet')
      .select('*')

    // Prepare context for AI
    const context = {
      loads: loads?.map(load => ({
        id: load.load_number,
        origin: load.pickup_location,
        destination: load.delivery_location,
        pickup_date: load.pickup_time,
        delivery_date: load.delivery_time,
        commodity: load.commodity,
        equipment: load.equipment_type,
        weight: load.weight,
        customer: load.customer?.name,
        carrier: load.carrier?.name,
        driver: load.driver?.name,
        status: load.status,
        customer_rate: load.customer_rate,
        carrier_rate: load.carrier_rate,
        margin: load.customer_rate && load.carrier_rate 
          ? ((load.customer_rate - load.carrier_rate) / load.customer_rate * 100).toFixed(2)
          : null,
        created_at: load.created_at,
      })),
      carriers: carriers?.map(c => ({
        name: c.name,
        mc_number: c.mc_number,
        contact: c.primary_contact,
      })),
      customers: customers?.map(c => ({
        name: c.name,
        contact: c.primary_contact,
      })),
      fleet: fleet?.map(f => ({
        unit_number: f.unit_number,
        make: f.make,
        model: f.model,
        year: f.year,
        status: f.status,
      }))
    }

    // Call AI using Vercel AI SDK via AI Gateway
    const { text } = await generateText({
      model: 'google/gemini-2.5-flash-lite',
      system: `You are a data analysis AI assistant for a Transportation Management System (TMS).
Your role is to interpret natural language queries and generate insightful reports from the data.

You have access to:
- Loads data (shipments with origin, destination, dates, revenue, costs, margins)
- Carrier data
- Customer data
- Fleet data (trucks, trailers)

When a user asks a question:
1. Analyze the relevant data
2. Provide a clear summary answer
3. Include key statistics and metrics
4. Present findings in a well-formatted markdown table when appropriate
5. Highlight important insights and trends
6. Suggest actionable recommendations if relevant

Current data available:
- Total loads: ${context.loads?.length || 0}
- Total carriers: ${context.carriers?.length || 0}
- Total customers: ${context.customers?.length || 0}
- Total fleet: ${context.fleet?.length || 0}

Use markdown formatting with tables, headers, and bullet points for clarity.`,
      prompt: `${query}\n\nSystem data:\n${JSON.stringify(context, null, 2)}`,
      temperature: 0.7,
    })

    const report = text || 'No report generated.'

    // Extract data for potential CSV export
    let reportData = null
    
    // Try to parse if the report contains specific load data
    if (query.toLowerCase().includes('load') || query.toLowerCase().includes('shipment')) {
      reportData = loads
    }

    return { 
      success: true, 
      report,
      reportData,
      query,
      timestamp: new Date().toISOString(),
      records_analyzed: context.loads?.length || 0
    }
  } catch (error) {
    console.error('Error in generateNaturalLanguageReport:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function exportReportData(reportData: any[], format: 'csv' | 'json') {
  try {
    if (format === 'json') {
      return {
        success: true,
        data: JSON.stringify(reportData, null, 2),
        filename: `report_${Date.now()}.json`,
        mimeType: 'application/json'
      }
    }

    // CSV export
    if (!reportData || reportData.length === 0) {
      return { success: false, error: 'No data to export' }
    }

    // Get all unique keys from all objects
    const allKeys = new Set<string>()
    reportData.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key))
    })
    const headers = Array.from(allKeys)

    // Generate CSV
    const csvRows = [
      headers.join(','), // Header row
      ...reportData.map(row => 
        headers.map(header => {
          const value = row[header]
          // Handle nested objects
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          }
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value || '')
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(',')
      )
    ]

    return {
      success: true,
      data: csvRows.join('\n'),
      filename: `report_${Date.now()}.csv`,
      mimeType: 'text/csv'
    }
  } catch (error) {
    console.error('Error exporting report data:', error)
    return { success: false, error: 'Failed to export data' }
  }
}

