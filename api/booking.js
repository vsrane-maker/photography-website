module.exports = async (req, res) => {
  // Helpful browser test
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, hint: "POST to this endpoint" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

  const required = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "FROM_EMAIL",
    "TO_EMAIL",
  ];
  for (const k of required) {
    if (!process.env[k]) return res.status(500).json({ error: `Missing env var: ${k}` });
  }

  const ses = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    const { name, email, partySize, location } = req.body || {};

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim();
    const cleanLocation = String(location || "").trim();
    const cleanPartySize = Number(partySize);

    if (!cleanName || !cleanEmail || !cleanLocation || !Number.isFinite(cleanPartySize) || cleanPartySize < 1) {
      return res.status(400).json({ error: "Invalid form fields." });
    }

    await ses.send(
      new SendEmailCommand({
        Source: process.env.FROM_EMAIL,
        Destination: { ToAddresses: [process.env.TO_EMAIL] },
        ReplyToAddresses: [cleanEmail],
        Message: {
          Subject: { Data: `New Booking Inquiry — ${cleanName}`, Charset: "UTF-8" },
          Body: {
            Text: {
              Data:
`New booking request:

Name: ${cleanName}
Email: ${cleanEmail}
Party size: ${cleanPartySize}
Location: ${cleanLocation}
`,
              Charset: "UTF-8",
            },
          },
        },
      })
    );
    
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("SES send failed:", err);
    return res.status(500).json({ error: "Failed to send email." });
  }
};
