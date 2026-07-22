import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';
import { deserialize } from 'bson';

// Local fallbacks dictionary for country coordinates (fallback if nominatim is slow/offline)
export const countryFallbacks: Record<string, { name: string; coords: [number, number] }> = {
  'AF': { name: 'Afghanistan', coords: [33.9391, 67.7100] },
  'AL': { name: 'Albania', coords: [41.1533, 20.1683] },
  'DZ': { name: 'Algeria', coords: [28.0339, 1.6596] },
  'AD': { name: 'Andorra', coords: [42.5063, 1.5218] },
  'AO': { name: 'Angola', coords: [-11.2027, 17.8739] },
  'AR': { name: 'Argentina', coords: [-38.4161, -63.6167] },
  'AM': { name: 'Armenia', coords: [40.0691, 45.0382] },
  'AU': { name: 'Australia', coords: [-25.2744, 133.7751] },
  'AT': { name: 'Austria', coords: [47.5162, 14.5501] },
  'AZ': { name: 'Azerbaijan', coords: [40.1431, 47.5769] },
  'BS': { name: 'Bahamas', coords: [25.0343, -77.3963] },
  'BH': { name: 'Bahrain', coords: [25.9304, 50.6377] },
  'BD': { name: 'Bangladesh', coords: [23.6850, 90.3563] },
  'BY': { name: 'Belarus', coords: [53.7098, 27.9534] },
  'BE': { name: 'Belgium', coords: [50.5039, 4.4699] },
  'BO': { name: 'Bolivia', coords: [-16.2902, -63.5887] },
  'BA': { name: 'Bosnia and Herzegovina', coords: [43.9159, 17.6791] },
  'BW': { name: 'Botswana', coords: [-22.3285, 24.6849] },
  'BR': { name: 'Brazil', coords: [-14.2350, -51.9253] },
  'BG': { name: 'Bulgaria', coords: [42.7339, 25.4858] },
  'KH': { name: 'Cambodia', coords: [12.5657, 104.9910] },
  'CM': { name: 'Cameroon', coords: [7.3697, 12.3547] },
  'CA': { name: 'Canada', coords: [56.1304, -106.3468] },
  'CL': { name: 'Chile', coords: [-35.6751, -71.5430] },
  'CN': { name: 'China', coords: [35.8617, 104.1954] },
  'CO': { name: 'Colombia', coords: [4.5709, -74.2973] },
  'CR': { name: 'Costa Rica', coords: [9.7489, -83.7534] },
  'HR': { name: 'Croatia', coords: [45.1000, 15.2000] },
  'CU': { name: 'Cuba', coords: [21.5218, -77.7812] },
  'CY': { name: 'Cyprus', coords: [35.1264, 33.4299] },
  'CZ': { name: 'Czechia', coords: [49.8175, 15.4730] },
  'DK': { name: 'Denmark', coords: [56.2639, 9.5018] },
  'DO': { name: 'Dominican Republic', coords: [18.7357, -70.1627] },
  'EC': { name: 'Ecuador', coords: [-1.8312, -78.1834] },
  'EG': { name: 'Egypt', coords: [26.8206, 30.8025] },
  'SV': { name: 'El Salvador', coords: [13.7942, -88.8965] },
  'EE': { name: 'Estonia', coords: [58.5953, 25.0136] },
  'ET': { name: 'Ethiopia', coords: [9.1450, 40.4897] },
  'FI': { name: 'Finland', coords: [61.9241, 25.7482] },
  'FR': { name: 'France', coords: [46.2276, 2.2137] },
  'GE': { name: 'Georgia', coords: [42.3154, 43.3569] },
  'DE': { name: 'Germany', coords: [51.1657, 10.4515] },
  'GH': { name: 'Ghana', coords: [7.9465, -1.0232] },
  'GR': { name: 'Greece', coords: [39.0742, 21.8243] },
  'GT': { name: 'Guatemala', coords: [15.7835, -90.2308] },
  'HN': { name: 'Honduras', coords: [15.2000, -86.2419] },
  'HU': { name: 'Hungary', coords: [47.1625, 19.5033] },
  'IS': { name: 'Iceland', coords: [64.9631, -19.0208] },
  'IN': { name: 'India', coords: [20.5937, 78.9629] },
  'ID': { name: 'Indonesia', coords: [-0.7893, 113.9213] },
  'IR': { name: 'Iran', coords: [32.4279, 53.6880] },
  'IQ': { name: 'Iraq', coords: [33.2232, 43.6793] },
  'IE': { name: 'Ireland', coords: [53.4129, -8.2439] },
  'IL': { name: 'Israel', coords: [31.0461, 34.8516] },
  'IT': { name: 'Italy', coords: [41.8719, 12.5674] },
  'JM': { name: 'Jamaica', coords: [18.1096, -77.2975] },
  'JP': { name: 'Japan', coords: [36.2048, 138.2529] },
  'JO': { name: 'Jordan', coords: [30.5852, 36.2384] },
  'KZ': { name: 'Kazakhstan', coords: [48.0196, 66.9237] },
  'KE': { name: 'Kenya', coords: [-0.0236, 37.9062] },
  'KR': { name: 'South Korea', coords: [35.9078, 127.7669] },
  'KW': { name: 'Kuwait', coords: [29.3759, 47.9774] },
  'LV': { name: 'Latvia', coords: [56.8796, 24.6032] },
  'LB': { name: 'Lebanon', coords: [33.8547, 35.8623] },
  'LY': { name: 'Libya', coords: [26.3351, 17.2283] },
  'LT': { name: 'Lithuania', coords: [55.1694, 23.8813] },
  'LU': { name: 'Luxembourg', coords: [49.8153, 6.1296] },
  'MK': { name: 'North Macedonia', coords: [41.6086, 21.7453] },
  'MY': { name: 'Malaysia', coords: [4.2105, 101.9758] },
  'MT': { name: 'Malta', coords: [35.9375, 14.3754] },
  'MX': { name: 'Mexico', coords: [23.6345, -102.5528] },
  'MD': { name: 'Moldova', coords: [47.4116, 28.3699] },
  'MC': { name: 'Monaco', coords: [43.7384, 7.4246] },
  'ME': { name: 'Montenegro', coords: [42.7087, 19.3744] },
  'MA': { name: 'Morocco', coords: [31.7917, -7.0926] },
  'NP': { name: 'Nepal', coords: [28.3949, 84.1240] },
  'NL': { name: 'Netherlands', coords: [52.1326, 5.2913] },
  'NZ': { name: 'New Zealand', coords: [-40.9006, 174.8860] },
  'NI': { name: 'Nicaragua', coords: [12.8654, -85.2072] },
  'NG': { name: 'Nigeria', coords: [9.0820, 8.6753] },
  'NO': { name: 'Norway', coords: [60.4720, 8.4689] },
  'OM': { name: 'Oman', coords: [21.5126, 55.9233] },
  'PK': { name: 'Pakistan', coords: [30.3753, 69.3451] },
  'PA': { name: 'Panama', coords: [8.5380, -80.7821] },
  'PY': { name: 'Paraguay', coords: [-23.4425, -58.4438] },
  'PE': { name: 'Peru', coords: [-9.1900, -75.0152] },
  'PH': { name: 'Philippines', coords: [12.8797, 121.7740] },
  'PL': { name: 'Poland', coords: [51.9194, 19.1451] },
  'PT': { name: 'Portugal', coords: [39.3999, -8.2245] },
  'QA': { name: 'Qatar', coords: [25.3548, 51.1839] },
  'RO': { name: 'Romania', coords: [45.9432, 24.9668] },
  'RU': { name: 'Russia', coords: [61.5240, 105.3188] },
  'SA': { name: 'Saudi Arabia', coords: [23.8859, 45.0792] },
  'RS': { name: 'Serbia', coords: [44.0165, 21.0059] },
  'SG': { name: 'Singapore', coords: [1.3521, 103.8198] },
  'SK': { name: 'Slovakia', coords: [48.6690, 19.6990] },
  'SI': { name: 'Slovenia', coords: [46.1512, 14.9955] },
  'ZA': { name: 'South Africa', coords: [-30.5595, 22.9375] },
  'ES': { name: 'Spain', coords: [40.4637, -3.7492] },
  'LK': { name: 'Sri Lanka', coords: [7.8731, 80.7718] },
  'SE': { name: 'Sweden', coords: [60.1282, 18.6435] },
  'CH': { name: 'Switzerland', coords: [46.8182, 8.2275] },
  'SY': { name: 'Syria', coords: [34.8021, 38.9968] },
  'TW': { name: 'Taiwan', coords: [23.6978, 120.9605] },
  'TH': { name: 'Thailand', coords: [15.8700, 100.9925] },
  'TN': { name: 'Tunisia', coords: [33.8869, 9.5375] },
  'TR': { name: 'Turkey', coords: [38.9637, 35.2433] },
  'UA': { name: 'Ukraine', coords: [48.3794, 31.1656] },
  'AE': { name: 'United Arab Emirates', coords: [23.4241, 53.8478] },
  'GB': { name: 'United Kingdom', coords: [55.3781, -3.4360] },
  'US': { name: 'United States', coords: [37.0902, -95.7129] },
  'UY': { name: 'Uruguay', coords: [-32.5228, -55.7658] },
  'UZ': { name: 'Uzbekistan', coords: [41.3775, 64.5853] },
  'VE': { name: 'Venezuela', coords: [6.4238, -66.5897] },
  'VN': { name: 'Vietnam', coords: [14.0583, 108.2772] },
  'YE': { name: 'Yemen', coords: [15.5527, 48.5164] },
  'ZW': { name: 'Zimbabwe', coords: [-19.0154, 29.1549] }
};

const getBsonData = async (url: string, prefix: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const bData = new Uint8Array(arrayBuffer);
    const data = deserialize(bData);

    let currentPrefix = prefix;
    while (currentPrefix.length > 0) {
      const value = data[currentPrefix];
      if (value) {
        return value;
      }
      currentPrefix = currentPrefix.substring(0, currentPrefix.length - 1);
    }
  } catch (err) {
    console.warn('Could not parse/fetch BSON:', err);
  }
  return null;
};

export interface LookupResult {
  carrierName: string;
  countryCode: string;
  countryName: string;
  lat: number;
  lng: number;
}

export async function localLookup(phone: string): Promise<LookupResult> {
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  if (!isValidPhoneNumber(formattedPhone)) {
    throw new Error('Invalid phone number format.');
  }

  const phoneNumber = parsePhoneNumber(formattedPhone);
  const countryCode = phoneNumber.country;
  if (!countryCode) {
    throw new Error('Could not determine the country.');
  }

  const countryCallingCode = phoneNumber.countryCallingCode.toString();
  const nationalNumber = phoneNumber.nationalNumber.toString();

  // 1. Get Country Name
  let countryName = countryCode as string;
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    countryName = regionNames.of(countryCode as string) || (countryFallbacks[countryCode]?.name || countryCode as string);
  } catch (e) {
    countryName = countryFallbacks[countryCode]?.name || countryCode as string;
  }

  // 2. Fetch Carrier Name from BSON
  let carrierName = 'Unknown Carrier';
  try {
    const baseUrl = (import.meta as any).env?.BASE_URL || '/';
    const carrierUrl = `${baseUrl}resources/carrier/en/${countryCallingCode}.bson`;
    const carrierMatch = await getBsonData(carrierUrl, nationalNumber);
    if (carrierMatch) {
      carrierName = carrierMatch;
    }
  } catch (err) {
    console.warn('Carrier lookup failed:', err);
  }

  // 3. Geocode lookup: try Nominatim first, fallback to robust offline dictionary
  let lat = 0;
  let lng = 0;

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(countryName)}&format=json`, {
      headers: { 'User-Agent': 'MobTracker/1.0' }
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);
      } else {
        throw new Error('Empty response from Nominatim');
      }
    } else {
      throw new Error('Nominatim returned error response');
    }
  } catch (err) {
    console.warn('Nominatim geocoder failed, using offline fallback:', err);
    const fallback = countryFallbacks[countryCode];
    if (fallback) {
      [lat, lng] = fallback.coords;
    } else {
      lat = 0;
      lng = 0;
    }
  }

  return {
    carrierName,
    countryCode,
    countryName,
    lat,
    lng
  };
}
