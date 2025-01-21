export async function generateSummary(events, openaiApiKey, env, additionalContext) {
  if (!events.length) {
    return "No events today.";
  }

  const rawEventsText = events.map((e) => {
    const start = e.start?.dateTime || e.start?.date || "Unknown Start";
    const title = e.summary || "No Title";
    return `Event: ${title}, Start: ${start}`;
  }).join("\n");

  const prompt = `
These are the day's events for our child's school and our family calendar. Take these events and summarize into a short summary that will be sent as a text message to myself and his mom to give us an overview and make sure we're aware of any important events.

If there are no events on either calendar, don't mention it. If there are duplicate events, only mention them once.

Do NOT use ** to style, this is a text message. Output nothing else.

Output as such:

School: {event 1}, {event 2}
Family: {event 1}, {event 2}

${additionalContext ? `Additional Context: ${additionalContext}\n\n` : ''}

Raw Events:
${rawEventsText}
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