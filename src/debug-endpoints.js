import { getAllEvents } from './services/googleCalendar';
import { generateSummary } from './services/ai';
import { sendDailySummary, generateMessage } from './worker';
import { sendSMS } from './services/twilio';

export async function handleDebugRequest(request, env, ctx) {
  const url = new URL(request.url);
  
  if (url.pathname === "/send") {
    console.log("Status: Getting events");
    const allEvents = await getAllEvents(env);
    
    console.log("Status: Generating message");
    const summary = await generateSummary(allEvents, env.AI_API_KEY, env);
    
    if (summary === "No events today.") {
      console.log("No events to send.");
      return new Response("No events to send.");
    }
    
    console.log("Status: Sending message");
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
    
    console.log("Message sent to numbers:", numbers);
    return new Response(`Summary sent to numbers: ${numbers.join(", ")}\n\nMessage sent: ${summary}`);
  } 
  
  if (url.pathname === "/get-message") {
    console.log("Status: Getting events");
    const message = await generateMessage(env);
    console.log("Generated Message:", message);
    return new Response(message);
  } 
  
  if (url.pathname === "/get-events") {
    console.log("Status: Getting events");
    const events = await getAllEvents(env);
    const simplifiedEvents = events.map(event => ({
      summary: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      calendarName: event.calendarName
    }));
    console.log("Events:", simplifiedEvents);
    return new Response(JSON.stringify(simplifiedEvents), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Invalid endpoint", { status: 404 });
} 