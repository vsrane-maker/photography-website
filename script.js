document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bookingForm");
  const status = document.getElementById("status");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Sending…";

    const data = Object.fromEntries(new FormData(form).entries());
    data.partySize = Number(data.partySize);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed");

      status.textContent = "Sent! I’ll get back to you soon.";
      form.reset();
    } catch (err) {
      status.textContent = "Could not send. Please try again.";
    }
  });
});
