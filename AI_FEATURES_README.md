# BulkFlow TMS - AI Features

This document provides information about the AI-powered features in BulkFlow TMS.

## Features Overview

### 1. Smart Dispatch (AI-Powered Load Assignment)

**Location:** `/dashboard/smart-dispatch`

Smart Dispatch uses AI to analyze your loads, fleet, and carriers to provide intelligent dispatch recommendations.

#### Capabilities:
- **Geographic Optimization**: Matches loads with drivers/carriers based on location efficiency
- **Equipment Matching**: Ensures equipment type requirements are met
- **Margin Optimization**: Recommends assignments that maximize profitability
- **Time Window Analysis**: Considers pickup and delivery schedules
- **Conflict Detection**: Identifies potential scheduling conflicts
- **Priority Management**: Helps prioritize urgent shipments

#### Usage:
1. Navigate to Smart Dispatch from the dashboard
2. Enter a natural language query describing your dispatch needs
3. Review AI-generated recommendations with reasoning
4. Use quick query buttons for common scenarios

**Example Queries:**
- "Optimize dispatch for today's pending loads"
- "Which loads should I prioritize based on pickup times?"
- "Suggest best carrier-load matches for maximum margin"
- "Show me potential scheduling conflicts"

### 2. Natural Language Reporting

**Location:** `/dashboard/reporting`

Generate custom reports and insights by asking questions in plain English about your TMS data.

#### Capabilities:
- **Natural Language Queries**: Ask questions in plain English
- **Instant Analysis**: Get immediate insights from your data
- **Data Visualization**: Results formatted in clear tables and summaries
- **Export Options**: Download reports as CSV or JSON
- **Historical Reports**: View all previously generated reports
- **Multi-Source Data**: Analyzes loads, carriers, customers, and fleet data

#### Usage:
1. Navigate to Reporting from the dashboard
2. Type your question in natural language
3. Review the AI-generated report with statistics and insights
4. Export data if needed (CSV or JSON format)
5. Access report history for previously generated reports

**Example Queries:**
- "Show me all loads from last month with margin below 10%"
- "What are the top 5 customers by revenue this year?"
- "List all pending loads with pickup dates in the next 3 days"
- "Show me carrier performance summary for the last quarter"
- "Which loads are currently in transit?"
- "What is the average margin across all delivered loads?"

## Setup Instructions

### Prerequisites

1. **Vercel AI Gateway API Key**: You need a Vercel AI Gateway API key to use these features.
   - Sign up at [Vercel](https://vercel.com/)
   - Navigate to your project settings
   - Go to the AI Gateway section
   - Create an API key
   - The features use Google Gemini 2.5 Flash Lite via Vercel AI Gateway

### Environment Configuration

Add the following to your `.env.local` file:

```bash
AI_GATEWAY_API_KEY=your_ai_gateway_api_key_here
```

⚠️ **Important**: Never commit your `.env.local` file to version control. The `.gitignore` file should already exclude it.

### Cost Considerations

These AI features use Vercel AI Gateway which provides:
- **Model Used**: Google Gemini 2.5 Flash Lite
- **Gateway Benefits**: Unified API, automatic retries, spend monitoring, load balancing
- **Approximate Cost**: ~$0.01-0.05 per query (varies based on data size)
- **Tips to Minimize Costs**:
  - Use specific queries rather than broad ones
  - Limit the amount of data fetched (the system already limits to recent records)
  - Monitor your usage in the Vercel dashboard

## Technical Details

### Technology Stack

**AI Framework:** Vercel AI SDK (`ai` package) with AI Gateway
- Unified API to access multiple AI models through a single endpoint
- Built-in streaming support and error handling
- Automatic retries and fallback support
- Spend monitoring and budget controls
- Better TypeScript integration

### Smart Dispatch Implementation

**Server Action:** `app/actions/ai.ts` - `getSmartDispatchRecommendations()`

**Data Analyzed:**
- Up to 50 most recent loads with status: draft, pending, or posted
- Up to 50 active fleet units (trucks/trailers)
- Up to 50 carrier companies

**AI Prompt**: The system provides context about geographic efficiency, equipment matching, time windows, margin optimization, and driver availability to generate recommendations.

### Natural Language Reporting Implementation

**Server Action:** `app/actions/ai.ts` - `generateNaturalLanguageReport()`

**Data Analyzed:**
- Up to 1,000 most recent loads with full details
- All carriers with contact information
- All customers with contact information
- All fleet data

**Export Functionality:** Reports can be exported in CSV or JSON format for further analysis.

## Error Handling

### Common Errors and Solutions

1. **"Missing API Key" Error**
   - **Cause**: AI_GATEWAY_API_KEY not set in environment variables
   - **Solution**: Add the API key to your `.env.local` file and restart the dev server

2. **"Failed to fetch data" Error**
   - **Cause**: Database connection issue
   - **Solution**: Verify Supabase connection and RLS policies

3. **"Rate limit exceeded" Error**
   - **Cause**: Too many API requests through the gateway
   - **Solution**: Wait a moment and try again, or check your Vercel AI Gateway limits

4. **"Insufficient quota" Error**
   - **Cause**: AI Gateway account has exceeded spending limits
   - **Solution**: Review your usage in the Vercel dashboard and adjust limits if needed

## Security Considerations

- API keys are stored securely in environment variables (server-side only)
- User authentication is verified before processing AI requests
- RLS policies ensure users only access data they're authorized to see
- Sensitive financial information is included in AI context but never exposed to unauthorized users

## Future Enhancements

Potential future improvements:
- Custom AI models trained on TMS-specific data
- Real-time dispatch optimization with live traffic data
- Predictive analytics for load profitability
- Automated carrier selection and bidding
- Natural language load creation
- Voice-activated queries and commands

## Support

For issues or questions about AI features:
1. Check the error message and this documentation
2. Verify your AI Gateway API key is valid
3. Check the browser console for detailed error logs
4. Review the server logs for backend errors
5. Monitor usage in the Vercel AI Gateway dashboard

---

**Note**: These AI features require an active internet connection and a valid Vercel AI Gateway API key to function.

