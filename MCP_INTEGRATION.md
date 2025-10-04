# MCP (Model Context Protocol) Integration

CareerIQ now supports MCP, allowing AI assistants like Claude Desktop to directly access your career intelligence data!

## What is MCP?

Model Context Protocol (MCP) is an open protocol that lets AI assistants access external data sources and tools. This integration allows Claude (or any MCP-compatible AI) to:

- Search your 5,969+ career opportunities
- View your AI-matched job recommendations
- Browse staffing agencies database
- Get personalized job details

## Setup Guide

### 1. Generate an API Key

1. Log into CareerIQ
2. Navigate to **Dashboard → API Keys**
3. Click "Create New API Key"
4. Give it a name (e.g., "Claude Desktop")
5. **Copy the key immediately** - you won't see it again!

### 2. Configure Claude Desktop

Edit your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "careeriq": {
      "url": "https://ubcghjlfxkamyyefnbkf.supabase.co/functions/v1/mcp-server",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

**Replace `YOUR_API_KEY_HERE`** with your actual API key (starts with `ciq_`)

### 3. Restart Claude Desktop

Close and reopen Claude Desktop to load the new configuration.

## Available Resources

MCP resources are read-only data sources:

### `opportunity://matches`
Your personalized AI-matched opportunities, sorted by match score.

**Example prompt:**
> "Show me my top 5 opportunity matches"

### `opportunity://agencies`
Browse the database of 200+ staffing agencies.

**Example prompt:**
> "Which staffing agencies specialize in healthcare operations?"

## Available Tools

MCP tools are actions Claude can perform:

### `search_opportunities`
Search contract jobs by skills, location, and rate.

**Parameters:**
- `skills` (array): Skills to search for
- `location` (string): Location filter (e.g., "Remote", "New York")
- `rate_min` (number): Minimum hourly rate
- `rate_max` (number): Maximum hourly rate
- `limit` (number): Max results (default: 20)

**Example prompts:**
> "Find remote operations director roles paying over $150/hour"
> "Search for healthcare management positions in Boston"

### `get_match_details`
Get complete information about a specific opportunity match.

**Parameters:**
- `match_id` (string): UUID of the opportunity match

**Example prompt:**
> "Show me full details on match ID abc-123-def"

### `update_match_status`
Update the status of an opportunity match.

**Parameters:**
- `match_id` (string): UUID of the opportunity match
- `status` (string): New status - "new", "reviewing", "applied", "rejected", or "interested"

**Example prompts:**
> "Mark match abc-123 as reviewing"
> "Update match xyz-456 status to interested"

### `apply_to_match`
Mark an opportunity as applied (sets status to "applied" and records the date).

**Parameters:**
- `match_id` (string): UUID of the opportunity match

**Example prompts:**
> "Mark match abc-123 as applied"
> "I applied to this job: xyz-456"

## Example Conversations

### Finding Opportunities
**You:** "I'm looking for remote contract work in supply chain management paying at least $125/hour"

**Claude:** *Uses `search_opportunities` tool with filters*
"I found 12 contract opportunities matching your criteria. Here are the top matches:
1. Supply Chain Transformation Lead at Fortune 500 company ($125-175/hr)
2. Interim VP of Operations at private equity firm ($175-225/hr)
..."

### Reviewing Matches
**You:** "What are my top 3 opportunity matches?"

**Claude:** *Reads `opportunity://matches` resource*
"Based on your resume analysis, here are your top 3 matches:
1. 100% Match - Supply Chain Transformation Lead
2. 100% Match - Interim VP of Operations  
3. 93% Match - Operations Optimization Consultant"

### Agency Research
**You:** "Which agencies work with healthcare clients?"

**Claude:** *Searches `opportunity://agencies` resource*
"I found 15 staffing agencies specializing in healthcare..."

## Security Notes

- **API Keys are personal**: Each key is tied to your user account
- **Keep keys secret**: Never share your API key publicly
- **Revoke if compromised**: Delete and regenerate keys if exposed
- **Monitor usage**: Check "Last Used" dates in the dashboard

## Troubleshooting

### "Invalid API key" error
- Verify you copied the entire key (starts with `ciq_`)
- Check for extra spaces or line breaks
- Ensure the key is still active (not deleted)

### Claude doesn't show MCP tools
- Restart Claude Desktop after config changes
- Verify JSON syntax in config file
- Check Claude's MCP connection status

### No opportunities returned
- Verify you've uploaded a resume
- Run "AI Matching" in the Opportunities page
- Try broader search criteria

## API Endpoint

The MCP server is hosted at:
```
https://ubcghjlfxkamyyefnbkf.supabase.co/functions/v1/mcp-server
```

Uses JSON-RPC 2.0 protocol over HTTPS with Bearer token authentication.

## Support

For issues or questions:
1. Check your API key is valid in Dashboard → API Keys
2. Review Claude Desktop MCP documentation
3. Contact support via the app

## Managing Your Applications

You can now use Claude to track your application status:

**Track applications:**
> "Mark the Supply Chain Lead position as applied"

**Update status:**
> "I'm reviewing the VP of Operations role, update the status"

**Manage pipeline:**
> "Show me all my matches marked as 'interested'"

---

**What's Next?** We're planning to add:
- Saved searches and alerts
- Resume analysis via MCP
- Agency contact tracking
- Application notes and reminders
