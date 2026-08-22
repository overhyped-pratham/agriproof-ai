export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[AgriProof SW] Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.warn('[AgriProof SW] Service Worker registration failed:', err);
        });
    });
  }
}
