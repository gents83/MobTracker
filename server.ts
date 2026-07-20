import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import { carrier } from "libphonenumber-geo-carrier";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory store for pair tracking (simplified for prototype)
  const activePairs = new Map<string, { lat: number; lng: number; timestamp: number; active: boolean }>();

  // Create a new pair ID
  app.post("/api/pair/create", (req, res) => {
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    activePairs.set(id, { lat: 0, lng: 0, timestamp: 0, active: false });
    res.json({ id });
  });

  // Update location for a pair ID
  app.post("/api/pair/update", (req, res) => {
    const { id, lat, lng } = req.body;
    if (!id || !activePairs.has(id)) {
      return res.status(404).json({ error: "Pair session not found or expired." });
    }
    activePairs.set(id, { lat, lng, timestamp: Date.now(), active: true });
    res.json({ success: true });
  });

  // Get status of a pair ID
  app.get("/api/pair/status/:id", (req, res) => {
    const { id } = req.params;
    const data = activePairs.get(id);
    if (!data) {
      return res.status(404).json({ error: "Pair session not found." });
    }
    res.json(data);
  });

  // API route for carrier and geolocation
  app.post("/api/lookup", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required." });
      }

      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      
      if (!isValidPhoneNumber(formattedPhone)) {
        return res.status(400).json({ error: "Invalid phone number format." });
      }

      const phoneNumber = parsePhoneNumber(formattedPhone);
      const countryCode = phoneNumber.country;
      
      if (!countryCode) {
        return res.status(400).json({ error: "Could not determine the country." });
      }

      // Identify the telecom carrier
      let carrierName = "Unknown Carrier";
      try {
        const result = await carrier(phoneNumber, 'en');
        if (result) {
          carrierName = result;
        }
      } catch (err) {
        console.warn("Carrier lookup failed:", err);
      }

      let lat = 0;
      let lng = 0;
      let countryName: string = countryCode as string;

      try {
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        countryName = regionNames.of(countryCode as string) || countryCode as string;
      } catch (e) {
        console.warn('Intl.DisplayNames not supported on server');
      }

      try {
        // Fetch country data from open API (Nominatim) server-side
        const response = await fetch(`https://nominatim.openstreetmap.org/search?country=${countryCode}&format=json`, {
          headers: { 'User-Agent': 'NumberRegionLocator/1.0' }
        });
        if (!response.ok) throw new Error('Failed to retrieve region data.');
        
        const data = await response.json();
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        } else {
          throw new Error('Empty response from geolocation provider.');
        }
      } catch (fetchErr) {
        console.warn('Fetch failed, using local fallback:', fetchErr);
        const fallbacks: Record<string, [number, number]> = {
          'IT': [41.8719, 12.5674],
          'US': [37.0902, -95.7129],
          'GB': [55.3781, -3.4360],
          'FR': [46.2276, 2.2137],
          'DE': [51.1657, 10.4515],
          'ES': [40.4637, -3.7492],
          'CA': [56.1304, -106.3468],
          'AU': [-25.2744, 133.7751],
          'JP': [36.2048, 138.2529],
          'CN': [35.8617, 104.1954],
          'IN': [20.5937, 78.9629],
          'BR': [-14.2350, -51.9253],
          'RU': [61.5240, 105.3188],
          'ZA': [-30.5595, 22.9375],
          'MX': [23.6345, -102.5528]
        };
        if (fallbacks[countryCode]) {
          [lat, lng] = fallbacks[countryCode];
        } else {
          // If totally unknown, default to 0,0 but still return
          lat = 0;
          lng = 0;
        }
      }

      res.json({ carrierName, countryCode, lat, lng, countryName });
    } catch (err) {
      console.error("Lookup error:", err);
      res.status(500).json({ error: "Internal server error." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support Express v4 SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
