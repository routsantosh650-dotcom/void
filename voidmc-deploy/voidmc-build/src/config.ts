// Site-wide constants. Everything here is public by design — it ships in the browser bundle.
//
// SERVER_IP is intentionally empty: the Join card hides the copy-IP chip until a real address is
// set (here or in the console's Site config tab), so the site never invites a failed connection.

export const BRAND = 'VOIDMC';
export const BRAND_TAG = 'Enter The Void';

export const DISCORD_URL = 'https://discord.gg/K69Kx8y9Z';
export const YOUTUBE_URL = 'https://youtube.com/@voidsmp-r7i';
export const SERVER_IP = '';

// Current origin, so the same bundle works on workers.dev, onrender.com or a custom domain.
export const SITE_ORIGIN =
  typeof window === 'undefined' ? 'https://voidmc.routsantosh650.workers.dev' : window.location.origin;

export const IST_LABEL = 'IST (UTC+5:30)';
