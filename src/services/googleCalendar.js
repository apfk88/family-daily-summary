import { DateTime } from 'luxon';
import { toBase64Url, arrayBufferToBase64Url, pemToArrayBuffer } from '../utils';

export async function getGoogleAccessToken(serviceEmail, privateKey) {
  // Convert escaped newlines to actual newlines
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  
  // JWT header and claim set
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceEmail,
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: nowInSeconds,
    exp: nowInSeconds + 3600, // 1 hour
  };

  // Encode JSON to base64url
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedClaim = toBase64Url(JSON.stringify(claim));
  const unsignedJWT = `${encodedHeader}.${encodedClaim}`;

  // Sign the JWT using RSASSA-PKCS1-v1_5 with SHA-256
  const keyData = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(formattedKey),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    keyData,
    new TextEncoder().encode(unsignedJWT)
  );
  const signedJWT = `${unsignedJWT}.${arrayBufferToBase64Url(signature)}`;

  // Exchange JWT for an access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${signedJWT}`,
  });
  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    throw new Error(`Failed to get Google access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

export async function fetchEvents(accessToken, calendarId) {
  // Get the current date in Pacific Time
  const now = DateTime.now().setZone('America/Los_Angeles');
  const startOfToday = now.startOf('day');
  const endOfTomorrow = now.plus({ days: 1 }).endOf('day');

  const timeMin = startOfToday.toISO();
  const timeMax = endOfTomorrow.toISO();

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const resp = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await resp.json();
  console.log("Google Calendar API response:", data);

  if (!data.items) {
    console.error("No items found in the response:", data);
    return [];
  }

  return data.items;
}

// Function to fetch events from multiple calendars
export async function getAllEvents(env) {
  console.log("Getting Google access token...");
  const googleAccessToken = await getGoogleAccessToken(
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    env.GOOGLE_PRIVATE_KEY
  );

  console.log("Fetching events from calendars...");
  const eventsFamily = await fetchEvents(
    googleAccessToken,
    env.FAMILY_CALENDAR_ID
  );
  const eventsSchool = await fetchEvents(
    googleAccessToken,
    env.SCHOOL_CALENDAR_ID
  );

  const eventsFamilyWithCalendar = eventsFamily.map(event => ({
    ...event,
    calendarName: "Family Calendar"
  }));
  const eventsSchoolWithCalendar = eventsSchool.map(event => ({
    ...event,
    calendarName: "School Calendar"
  }));

  const allEvents = [...eventsFamilyWithCalendar, ...eventsSchoolWithCalendar];
  
  // Sort events into today and tomorrow
  const now = DateTime.now().setZone('America/Los_Angeles');
  const startOfTomorrow = now.plus({ days: 1 }).startOf('day');
  const endOfTomorrow = startOfTomorrow.endOf('day');

  return {
    today: allEvents.filter(event => {
      const eventDate = DateTime.fromISO(event.start?.dateTime || event.start?.date);
      return eventDate < startOfTomorrow;
    }),
    tomorrow: allEvents.filter(event => {
      const eventDate = DateTime.fromISO(event.start?.dateTime || event.start?.date);
      return eventDate >= startOfTomorrow && eventDate <= endOfTomorrow;
    })
  };
} 