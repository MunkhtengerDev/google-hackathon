let mapsPromise = null;

export function loadGoogleMaps(apiKey) {
  if (!apiKey) return Promise.resolve(null);
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.google?.maps?.places) return Promise.resolve(window.google);

  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-maps="1"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.google));
        existing.addEventListener("error", reject);
        return;
      }

      const s = document.createElement("script");
      s.dataset.googleMaps = "1";
      s.async = true;
      s.defer = true;
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        apiKey
      )}&libraries=places`;
      s.onload = () => resolve(window.google);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  return mapsPromise;
}
