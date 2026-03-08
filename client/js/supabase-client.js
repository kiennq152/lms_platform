
// Initialize Supabase Client
// TODO: Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://vrrykekdxaunaawwjzeo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7hQH3zZManvI3GMX3HajGA_twzEup_P';

let supabase;

function showConfigWarning() {
  const banner = document.createElement('div');
  banner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #ef4444;
        color: white;
        text-align: center;
        padding: 1rem;
        z-index: 9999;
        font-family: system-ui, sans-serif;
    `;
  banner.innerHTML = `
        <strong>⚠️ Supabase Not Configured</strong><br/>
        Please update <code>client/js/supabase-client.js</code> with your Supabase URL and Anon Key.
    `;
  document.body.appendChild(banner);
}

if (typeof createClient !== 'undefined') {
  if (SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
    console.warn('⚠️ Supabase credentials not set');
    // Wait for body to be ready
    if (document.body) {
      showConfigWarning();
    } else {
      window.addEventListener('DOMContentLoaded', showConfigWarning);
    }
  } else {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabase = supabase; // Make it available globally
    console.log('✅ Supabase client initialized');
  }
} else {
  console.error('❌ Supabase SDK not loaded. Make sure to include the CDN script in index.html');
}

// Export for modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabase };
}
