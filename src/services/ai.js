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
Today: {list events}
Tomorrow: {list events}

Example:
Today: Flag Football (3-4pm), Soccer (4-5pm)
Tomorrow: President's Day

If there are no events for a particular day, write "No events" for that day.
If there are duplicate events, only mention them once.

Do NOT use ** to style, this is a text message. Output nothing else.

${additionalContext ? `Additional Context: ${additionalContext}\n\n` : ''}

Today's Events:
${todayEvents || "None"}

Tomorrow's Events:
${tomorrowEvents || "None"}
`;

  try {
    const resp = await fetch(env.AI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 100
      }),
    });

    const data = await resp.json();
    console.log("AI Generated Message:", data?.choices?.[0]?.message?.content);

    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    } else {
      console.error("Unexpected response format:", data);
      return "No summary available.";
    }
  } catch (error) {
    console.error("Error calling AI API:", error);
    return "No summary available.";
  }
} 