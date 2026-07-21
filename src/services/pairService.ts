export interface PairStatus {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
  active: boolean;
}

// Generate a random ID
export function generatePairId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Send (update) device location to the pairing session
export async function updatePairLocation(id: string, lat: number, lng: number): Promise<boolean> {
  try {
    const payload = {
      lat,
      lng,
      timestamp: Date.now(),
      active: true
    };
    const response = await fetch(`https://ntfy.sh/mobtrack-pair-${id}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  } catch (err) {
    console.error('Failed to update pairing location:', err);
    return false;
  }
}

// Retrieve current status/location for a pairing session
export async function getPairStatus(id: string): Promise<PairStatus | null> {
  try {
    const response = await fetch(`https://ntfy.sh/mobtrack-pair-${id}/json?poll=1`);
    if (!response.ok) return null;

    const text = await response.text();
    if (!text.trim()) {
      return { id, lat: 0, lng: 0, timestamp: 0, active: false };
    }

    // ntfy.sh returns newline-separated JSON messages if there are multiple.
    // We want the most recent message (last line that has event === 'message')
    const lines = text.split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const data = JSON.parse(lines[i]);
        if (data.event === 'message' && data.message) {
          const parsedMsg = JSON.parse(data.message);
          return {
            id,
            lat: parsedMsg.lat,
            lng: parsedMsg.lng,
            timestamp: parsedMsg.timestamp || data.time * 1000,
            active: parsedMsg.active !== false
          };
        }
      } catch (e) {
        // Skip malformed lines
      }
    }

    return { id, lat: 0, lng: 0, timestamp: 0, active: false };
  } catch (err) {
    console.error('Failed to retrieve pairing status:', err);
    return null;
  }
}
