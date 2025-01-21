export async function sendSMS(message, toNumber, fromNumber, accountSid, authToken) {
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams();
  body.append("To", toNumber);
  body.append("From", fromNumber);
  body.append("Body", message);

  const authHeader = "Basic " + btoa(`${accountSid}:${authToken}`);

  const resp = await fetch(twilioUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!resp.ok) {
    const errorTxt = await resp.text();
    console.error("Twilio SMS failed:", errorTxt);
    throw new Error("Twilio SMS send failed");
  } else {
    console.log(`SMS sent to ${toNumber}`);
  }
} 