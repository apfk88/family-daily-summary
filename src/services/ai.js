export async function generateSummary(events, openaiApiKey, env, additionalContext) {
  if (!events.today.length && !events.tomorrow.length) {
    return "No events today or tomorrow.";
  }

  const formatEvents = (eventList) => {
    return eventList.map((e) => {
      const start = e.start?.dateTime || e.start?.date || "Unknown Start";
      const title = e.summary || "No Title";
      return `Event: ${title}, Start: ${start}`;
    }).join("\n");
  };

  const todayEvents = formatEvents(events.today);
  const tomorrowEvents = formatEvents(events.tomorrow);

  const prompt = `
These are the events for today and tomorrow from our child's school calendar and family calendar. Take these events and summarize into a short summary that will be sent as a text message to their parents to give them an overview and make sure they're aware of any important events.

Format the output as follows:
Today: {list events in chronological order}

Tomorrow: {list events in chronological order}

On this day: {a very brief, fun fact about this day in american history}

Example:
Today: Flag Football (3-4pm), Soccer (4-5pm)

Tomorrow: President's Day

On this day: JFK was assassinated.

---

If there are no events for a particular day, write "No events" for that day.
If there are duplicate events, only mention them once.

Do NOT use ** to style, this is a text message. Output nothing else. Use /n to break lines.

${additionalContext ? `Additional Context: ${additionalContext}\n\n` : ''}

Today's Events:
${todayEvents || "None"}

Tomorrow's Events:
${tomorrowEvents || "None"}
`;

  try {
    const requestBody = {
      model: env.AI_MODEL,
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 100
    };
    
    console.log("Calling AI API with endpoint:", env.AI_API_ENDPOINT);
    console.log("Using model:", env.AI_MODEL);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const resp = await fetch(env.AI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("AI API error response:", {
        status: resp.status,
        statusText: resp.statusText,
        headers: Object.fromEntries(resp.headers.entries()),
        body: errorText
      });
      throw new Error(`API request failed: ${resp.status} ${resp.statusText} - ${errorText}`);
    }

    let responseText;
    try {
      responseText = await resp.text();
      console.log("Raw API response:", responseText);
      const data = JSON.parse(responseText);
      
      console.log("Parsed API response:", data);

      if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      } else {
        console.error("Unexpected response format:", data);
        return "No summary available - invalid response format.";
      }
    } catch (parseError) {
      console.error("Failed to parse API response:", {
        error: parseError,
        responseText: responseText
      });
      throw new Error(`Failed to parse API response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error in generateSummary:", {
      error: error,
      message: error.message,
      stack: error.stack
    });
    return `No summary available - ${error.message}`;
  }
} 