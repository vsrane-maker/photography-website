module.exports = async (req, res) => {
  // Helpful browser test
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, hint: "POST to this endpoint" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
  const { Resend } = require("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { name, sessionType, email, partySize, location } = req.body || {};

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim();
    const cleanLocation = String(location || "").trim();
    const cleanPartySize = Number(partySize);
    const cleansessionType = String(sessionType || "").trim();

    if (!cleanName || !cleansessionType || !cleanEmail || !cleanLocation || !Number.isFinite(cleanPartySize) || cleanPartySize < 1) {
      return res.status(400).json({ error: "Invalid form fields." });
    }

    // Email sent to myself notifying of new booking request
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
Session Type: ${cleansessionType}
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


    // Confirmation email to user requesting booking
    await resend.emails.send({
      from: "VJs Visuals <bookings@viraajrane.com>",
      to: cleanEmail,
      reply_to: "viraajrane@gmail.com",
      subject: "Booking Request Confirmation - VJ's Visuals",
      text: `Hi ${cleanName},

Thanks for reaching out! Ive received your booking request and will get back to you shortly.
Here are the details you submitted: 

Name: ${cleanName}
Email: ${cleanEmail}
Session Type: ${cleansessionType}
Party size: ${cleanPartySize}
Location: ${cleanLocation}


If you have any additional information to share, please email me at viraajrane@gmail.com

 Best regards
 Viraaj Rane
 VJ's Visuals`,
    });


    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("SES send failed:", err);
    return res.status(500).json({ error: "Failed to send email." });
  }
};
