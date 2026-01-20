console.log("✅ script.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOMContentLoaded fired");

  const form = document.getElementById("bookingForm");
  const statusEl = document.getElementById("status");

  console.log("form:", form);
  console.log("statusEl:", statusEl);

  if (!form || !statusEl) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("✅ submit handler ran");

    statusEl.textContent = "Sending…";

    const data = Object.fromEntries(new FormData(form).entries());
    data.partySize = Number(data.partySize);

    console.log("payload:", data);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const out = await res.json().catch(() => ({}));
      console.log("response status:", res.status, "body:", out);

      if (!res.ok) throw new Error(out.error || "Request failed");

      statusEl.textContent = "Sent! I’ll get back to you soon.";
      form.reset();
    } catch (err) {
      console.error("❌ submit error:", err);
      statusEl.textContent = "Could not send. Please try again.";
    }
  });
});
