// "Talk to Jack" — a live in-browser call to the Fade & Co. Barbers AI receptionist on Vapi.
// The public key is Vapi's browser-safe key (Vapi dashboard → API Keys → Public Key).
// Never put the PRIVATE key here.
const VAPI_PUBLIC_KEY = "8b9a9bec-e742-4a0e-a929-163aac211771"; // restricted to plompee.github.io + Jack only
const ASSISTANT_ID = "d99524b0-28ce-4c5d-8c18-fa8dcd2c6c20"; // Fade & Co. Barbers receptionist

const btn = document.getElementById("talk-jack");
const status = document.getElementById("talk-jack-status");

if (btn && status) {
  let vapi = null;
  let live = false;

  const setState = (state, text) => {
    btn.dataset.state = state;
    btn.querySelector(".tj-label").textContent =
      state === "live" ? "End call" : state === "connecting" ? "Connecting…" : "Talk to Jack";
    btn.setAttribute("aria-pressed", state === "live" ? "true" : "false");
    status.textContent = text;
  };

  const loadVapi = async () => {
    if (vapi) return vapi;
    const mod = await import("https://cdn.jsdelivr.net/npm/@vapi-ai/web@2/+esm");
    const Vapi = mod.default?.default ?? mod.default ?? mod.Vapi;
    vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapi.on("call-start", () => { live = true; setState("live", "Live — say hi and try booking a haircut."); });
    vapi.on("call-end", () => { live = false; setState("idle", "Call ended. Thanks for trying Jack!"); });
    vapi.on("speech-start", () => { if (live) status.textContent = "Jack is speaking…"; });
    vapi.on("speech-end", () => { if (live) status.textContent = "Your turn — Jack is listening."; });
    vapi.on("error", (e) => {
      console.error("Vapi error", e);
      live = false;
      setState("idle", "Couldn't connect. Check your microphone permission and try again.");
    });
    return vapi;
  };

  btn.addEventListener("click", async () => {
    if (VAPI_PUBLIC_KEY.startsWith("PASTE_")) {
      setState("idle", "Demo not configured yet.");
      return;
    }
    try {
      if (live) { vapi.stop(); setState("idle", "Ending call…"); return; }
      setState("connecting", "Allow the microphone when your browser asks.");
      const v = await loadVapi();
      // Cap every website call at 3 minutes to protect Vapi credit; fall back to a plain start if the key refuses overrides.
      try { await v.start(ASSISTANT_ID, { maxDurationSeconds: 180 }); }
      catch (e) { console.warn("Override refused, starting without it", e); await v.start(ASSISTANT_ID); }
    } catch (e) {
      console.error(e);
      live = false;
      setState("idle", "Couldn't start the call. Please try again.");
    }
  });
}
