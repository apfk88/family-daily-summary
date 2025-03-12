# Family Daily Summary Guidelines

## Project Overview
A Cloudflare Worker that sends daily calendar summaries via SMS from Google Calendars using OpenAI and Twilio.

## Commands
- `npm install`: Install dependencies
- `npm run dev`: Run local development server
- `npm run deploy`: Deploy to Cloudflare
- `npm test`: Run tests with Vitest
- `npx vitest path/to/test.js`: Run a single test

## Code Style
- Formatting: Uses implicit Prettier defaults with single quotes and semicolons
- JS: Modern ES modules with import/export syntax
- Naming: camelCase for variables/functions, PascalCase for classes
- Error handling: Try/catch blocks with detailed error logging
- Async/await pattern for asynchronous operations
- Environment variables for configuration

## Project Structure
- `src/`: Main source code
  - `services/`: API integrations (Google Calendar, OpenAI, Twilio)
  - `worker.js`: Main entry point
- Configuration in `wrangler.json` for Cloudflare deployment