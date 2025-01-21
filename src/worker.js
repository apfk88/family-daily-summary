import { getAllEvents } from './services/googleCalendar';
import { generateSummary } from './services/ai';
import { sendSMS } from './services/twilio';
import { handleDebugRequest } from './debug-endpoints';

export default {
  // For manual invocation via HTTPS (optional)
  async fetch(request, env, ctx) {
    return handleDebugRequest(request, env, ctx);
  },

  // For scheduled invocation via Cron Trigger
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDailySummary(env));
  },
};

// This function does the entire workflow: get Google access token, pull events, summarize, and send SMS.
export async function sendDailySummary(env) {
  try {
    const allEvents = await getAllEvents(env);
    const summary = await generateSummary(allEvents, env.AI_API_KEY, env);

    if (summary === "No events today.") {
      console.log("No events to send.");
      return;
    }

    const numbers = env.TO_PHONE_NUMBERS.split(",").map((n) => n.trim());
    await Promise.all(
      numbers.map((number) =>
        sendSMS(
          summary,
          number,
          env.FROM_PHONE_NUMBER,
          env.TWILIO_ACCOUNT_SID,
          env.TWILIO_AUTH_TOKEN
        )
      )
    );
  } catch (err) {
    console.error("Error in daily summary workflow:", err);
  }
}

// This function generates the message without sending it via Twilio
export async function generateMessage(env) {
  try {
    const allEvents = await getAllEvents(env);
    return await generateSummary(allEvents, env.AI_API_KEY, env);
  } catch (err) {
    console.error("Error in message generation workflow:", err);
    return "Error generating message.";
  }
}