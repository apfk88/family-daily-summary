# Family Daily Calendar Summary

A Cloudflare Worker that sends daily calendar summaries via SMS. It fetches events from both family and school Google Calendars, summarizes them using OpenAI's GPT-4, and sends the summary through Twilio.

## Features

- Fetches events from multiple Google Calendars
- Summarizes events using OpenAI's GPT-4o
- Sends SMS notifications via Twilio
- Runs on a daily schedule using Cloudflare Workers
- Supports manual triggering via HTTP endpoints

## Setup

### Prerequisites

- Node.js and npm installed
- Cloudflare Wrangler (auth'd into Cloudflare Workers account)
- Google Calendar API access and Service Account
- OpenAI API key
- Twilio account

```bash
npm install -g wrangler
wrangler login
```

### Environment Variables

For local development, create a `.dev.vars` file in your project root:

```env
GOOGLE_PRIVATE_KEY="your-private-key"
OPENAI_API_KEY="your-openai-key"
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account-email"
FAMILY_CALENDAR_ID="your-family-calendar-id"
SCHOOL_CALENDAR_ID="your-school-calendar-id"
TO_PHONE_NUMBERS="+15555555555,+15555555555"
FROM_PHONE_NUMBER="+18005555555"
AI_API_ENDPOINT="https://api.openai.com/v1/chat/completions"
AI_MODEL="gpt-4"
ADDITIONAL_CONTEXT="Additional personal context you'd like the model to know."
```

Other configuration variables are stored in `wrangler.json`.

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

To run the worker locally:

```bash
wrangler dev
```

### Deployment

To deploy to Cloudflare Workers:

```bash
wrangler deploy
```

## API Endpoints

- `/send` - Manually trigger the daily summary
- `/get-message` - Get the summary message without sending SMS
- `/get-events` - Get today's events from both calendars

## Schedule

The worker runs automatically at 6 AM US/Pacific daily (configured in `wrangler.json`).

## Security Notes

- Never commit `.dev.vars` or any files containing sensitive information
- Use Cloudflare Workers Secrets for production environment variables
- Ensure Google Service Account has minimal required permissions 