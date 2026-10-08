/* ================================================================
   Chat — service worker  +  ★ OWNER CONFIG ★
   ----------------------------------------------------------------
   THIS is the one file you edit. Paste your Supabase keys below and
   you never have to touch index.html again — it reads them from here.

   This file is loaded twice:
     1. as a normal <script> in the page (it just hands over the config)
     2. as the real service worker that shows push notifications
   The service-worker part at the bottom only runs inside the worker,
   so loading it in the page is completely harmless.
   ================================================================ */

var SW_CONFIG = {
  /* ---- Supabase dashboard → Project Settings → API ---- */
  SUPABASE_URL :"https://eakxuykolvzogiosadik.supabase.co",
  SUPABASE_KEY :"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVha3h1eWtvbHZ6b2dpb3NhZGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MDE3NDUsImV4cCI6MjEwNjk3Nzc0NX0.eiPul927PjYWy87WGll4rmNGIlhOLxLXetQ2jmt8-tw",

  /* ---- Push: leave these blank — keys are made automatically ---- */
  VAPID_PUBLIC_KEY: "",
  VAPID_PRIVATE_KEY: "",
  VAPID_CONTACT: "mailto:you@example.com",

  /* ---- Locked rooms re-ask for the password after this many
          minutes away (checked on entry, never mid-chat) ---- */
  ROOM_LOCK_MINUTES: 3
};

/* In the page: publish the config so index.html can read it. */
if (typeof window !== "undefined") {
  try { window.SW_CONFIG = SW_CONFIG; } catch (e) { /* ignore */ }
}

/* ================================================================
   Everything below runs only inside the service worker.
   ================================================================ */
var isServiceWorker =
  typeof self !== "undefined" &&
  typeof window === "undefined" &&
  (typeof ServiceWorkerGlobalScope === "function"
    ? self instanceof ServiceWorkerGlobalScope
    : typeof self.registration !== "undefined");

if (isServiceWorker) {

  self.addEventListener("push", (e) => {
    let d = {};
    try { d = e.data ? e.data.json() : {}; } catch (_) { /* plain ping */ }
    const room = d.room || "";
    const title = d.title || "New message";
    const options = {
      body: d.body || "You have a new message",
      tag: "chat-" + (room || "msg"),
      renotify: true,
      icon: "icon-192.png",
      badge: "icon-192.png",
      data: { url: d.url || null, room },
    };
    e.waitUntil(self.registration.showNotification(title, options));
  });

  self.addEventListener("notificationclick", (e) => {
    e.notification.close();
    const data = e.notification.data || {};
    e.waitUntil((async () => {
      const wins = await clients.matchAll({ type: "window", includeUncontrolled: true });
      // Prefer a tab already open in this room.
      if (data.room) {
        const match = wins.find((w) => w.url.includes("room=" + data.room));
        if (match) { await match.focus(); return; }
      }
      // Else focus any open Chat tab…
      if (wins.length) { await wins[0].focus(); return; }
      // …else open the room link.
      if (data.url) { await clients.openWindow(data.url); }
    })());
  });

}
