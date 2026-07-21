/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { parsePhoneNumber, isValidPhoneNumber, getCountryCallingCode, CountryCode } from 'libphonenumber-js';
import { Search, ShieldAlert, Crosshair, MapPin, AlertTriangle, Info, Terminal, Sun, Moon, Link, Users, Share2, Check, Clock, Send, MessageSquare, X, Eye, EyeOff, History, RefreshCw, Download, BookmarkPlus, Trash2, ChevronRight, BellRing, BellOff } from 'lucide-react';
import Radar from './components/Radar';
import RegionMap from './components/RegionMap';

interface LocationResult {
  lat: number;
  lng: number;
  countryName: string;
  countryCode: string;
  carrierName?: string;
}

interface LocationHistoryEntry {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
}

import { QRCodeSVG } from 'qrcode.react';

export default function App() {
  const [theme, setTheme] = useState<'terminal' | 'blueprint'>('terminal');
  const [mode, setMode] = useState<'locator' | 'pair' | 'history'>('locator');
  
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Locator State
  const [phone, setPhone] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LocationResult | null>(null);
  const [statusText, setStatusText] = useState('');
  const [locateElapsedMs, setLocateElapsedMs] = useState(0);
  
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToRecentSearches = (searchedPhone: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(p => p !== searchedPhone);
      const updated = [searchedPhone, ...filtered].slice(0, 3);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromRecentSearches = (e: React.MouseEvent, phoneToRemove: string) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(p => p !== phoneToRemove);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  // Pair Tracking Sender State
  const [pairId, setPairId] = useState<string | null>(null);
  const [pairLink, setPairLink] = useState<string | null>(null);
  const [pairResult, setPairResult] = useState<{lat: number, lng: number} | null>(null);
  const [isPairPolling, setIsPairPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(5000);

  // Pair Tracking Receiver State
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const initialPairId = searchParams.get('pair');
  const [isReceiver] = useState(!!initialPairId);
  const [receiverPairId] = useState(initialPairId);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  
  // Custom message for pair tracking
  const [customMessage, setCustomMessage] = useState('I invite you to share your live location via MobTrack. Tap here to accept:');
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [geofenceRadius, setGeofenceRadius] = useState(100);
  const [geofenceAlert, setGeofenceAlert] = useState(false);

  useEffect(() => {
    if (geofenceEnabled && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [geofenceEnabled]);



  // Location History State
  const [savedPairs, setSavedPairs] = useState<{id: string, name: string, date: string}[]>(() => {
    const saved = localStorage.getItem('savedPairs');
    return saved ? JSON.parse(saved) : [];
  });

  const saveCurrentPair = () => {
    if (!pairId) return;
    if (savedPairs.some(p => p.id === pairId)) {
      alert('This pair is already saved.');
      return;
    }
    const name = prompt("Enter a name for this persistent pair:");
    if (!name) return;
    const updated = [...savedPairs, { id: pairId, name, date: new Date().toISOString() }];
    setSavedPairs(updated);
    localStorage.setItem('savedPairs', JSON.stringify(updated));
  };

  const connectSavedPair = (id: string) => {
    setPairId(id);
    const link = `${window.location.origin}/?pair=${id}`;
    setPairLink(link);
    setIsPairPolling(true);
  };
  
  const removeSavedPair = (id: string) => {
    const updated = savedPairs.filter(p => p.id !== id);
    setSavedPairs(updated);
    localStorage.setItem('savedPairs', JSON.stringify(updated));
  };

  const [locationHistory, setLocationHistory] = useState<LocationHistoryEntry[]>(() => {
    const saved = localStorage.getItem('locationHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  useEffect(() => {
    if (!geofenceEnabled || !pairResult || !pairId || locationHistory.length === 0) {
      setGeofenceAlert(false);
      return;
    }
    
    // Find the first location in this session
    const sessionLocs = locationHistory.filter(l => l.id === pairId);
    if (sessionLocs.length === 0) return;
    
    const startLoc = sessionLocs[sessionLocs.length - 1]; // last element is the first entry because we unshift
    
    // Calculate distance between startLoc and pairResult
    const R = 6371e3; // meters
    const dLat = (pairResult.lat - startLoc.lat) * Math.PI / 180;
    const dLon = (pairResult.lng - startLoc.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(startLoc.lat * Math.PI / 180) * Math.cos(pairResult.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c;
    
    if (distance > geofenceRadius) {
      if (!geofenceAlert) {
        setGeofenceAlert(true);
        if (Notification.permission === 'granted') {
          new Notification('MobTrack Geofence Alert', {
            body: `Device has moved outside the ${geofenceRadius}m radius (${distance.toFixed(0)}m away).`,
          });
        }
      }
    } else {
      setGeofenceAlert(false);
    }
  }, [pairResult, geofenceEnabled, geofenceRadius, pairId, locationHistory, geofenceAlert]);

  const addToHistory = React.useCallback((id: string, lat: number, lng: number) => {
    setLocationHistory(prev => {
      // Avoid duplicate consecutive entries for the same ID
      if (prev.length > 0 && prev[0].id === id && prev[0].lat === lat && prev[0].lng === lng) {
        return prev;
      }
      const updated = [{ id, lat, lng, timestamp: Date.now() }, ...prev];
      localStorage.setItem('locationHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = () => {
    setLocationHistory([]);
    localStorage.removeItem('locationHistory');
  };

  const exportCSV = () => {
    if (locationHistory.length === 0) return;
    
    const headers = ['Session ID', 'Latitude', 'Longitude', 'Timestamp'];
    const rows = locationHistory.map(entry => [
      entry.id,
      entry.lat,
      entry.lng,
      new Date(entry.timestamp).toISOString()
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mobtrack_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (navigator.geolocation && !phone) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          if (res.ok) {
            const data = await res.json();
            if (data.countryCode) {
              const callingCode = getCountryCallingCode(data.countryCode as CountryCode);
              if (callingCode) {
                setPhone(prev => prev ? prev : `+${callingCode} `);
              }
            }
          }
        } catch (error) {
          console.warn("Failed to detect country calling code", error);
        }
      }, (err) => {
        console.warn("Geolocation permission denied or failed", err);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  
  useEffect(() => {
    let intervalId: number;
    if (isLocating) {
      setLocateElapsedMs(0);
      const startTime = Date.now();
      intervalId = window.setInterval(() => {
        setLocateElapsedMs(Date.now() - startTime);
      }, 50);
    }
    return () => clearInterval(intervalId);
  }, [isLocating]);

  const isDark = theme === 'terminal';

  const handleLocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(50);
    setError(null);
    setResult(null);

    if (!phone) {
      setError('Please enter a phone number.');
      return;
    }

    // Ensure it starts with a plus if missing for international parsing
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    try {
      if (!isValidPhoneNumber(formattedPhone)) {
        setError('Invalid phone number format. Please include the country code (e.g., +39).');
        return;
      }

      const phoneNumber = parsePhoneNumber(formattedPhone);
      const countryCode = phoneNumber.country;

      if (!countryCode) {
        setError('Could not determine the country from this phone number prefix.');
        return;
      }

      setIsLocating(true);
      
      // Simulate hacker/tactical locating sequence
      setStatusText('INITIALIZING UPLINK...');
      await new Promise(r => setTimeout(r, 800));
      
      setStatusText(`ANALYZING PREFIX...`);
      await new Promise(r => setTimeout(r, 1000));
      
      setStatusText('QUERYING GLOBAL REGISTRY...');
      
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: formattedPhone })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve region data.');
      }

      setStatusText('TRIANGULATION COMPLETE. REGION LOCKED.');
      await new Promise(r => setTimeout(r, 800));

      setResult({
        lat: data.lat,
        lng: data.lng,
        countryName: data.countryName,
        countryCode: data.countryCode,
        carrierName: data.carrierName
      });
      addToRecentSearches(formattedPhone);
    } catch (err) {
      console.error(err);
      setError('An error occurred during triangulation simulation.');
    } finally {
      setIsLocating(false);
      setStatusText('');
    }
  };

  // --- Pair Tracking Sender Logic ---
  const generatePairLink = async () => {
    try {
      setError(null);
      const res = await fetch('/api/pair/create', { method: 'POST' });
      const data = await res.json();
      if (data.id) {
        setPairId(data.id);
        const link = `${window.location.origin}/?pair=${data.id}`;
        setPairLink(link);
        if (navigator.vibrate) navigator.vibrate(50);
        setIsPairPolling(true);
      }
    } catch (err) {
      setError('Failed to generate pairing link.');
    }
  };

  // Safe polling with useEffect
  useEffect(() => {
    let timeoutId: number;
    let isMounted = true;

    const poll = async () => {
      if (!pairId || !isPairPolling) return;
      
      try {
        const res = await fetch(`/api/pair/status/${pairId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.active && data.lat && data.lng) {
            if (isMounted) {
              setPairResult({ lat: data.lat, lng: data.lng });
              addToHistory(pairId, data.lat, data.lng);
            }
          }
        }
      } catch (err) {
        // Ignore polling errors
      }
      
      if (isMounted && isPairPolling) {
        timeoutId = window.setTimeout(poll, pollingInterval);
      }
    };

    if (isPairPolling) {
      poll();
    }

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [pairId, isPairPolling, addToHistory, pollingInterval]);

  const shareText = `${customMessage} ${pairLink}`;

  const openWhatsApp = () => {
    if (pairLink) {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  const openTelegram = () => {
    if (pairLink) {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(pairLink!)}&text=${encodeURIComponent(customMessage)}`, '_blank');
    }
  };

  const openSMS = () => {
    if (pairLink) {
      window.open(`sms:?&body=${encodeURIComponent(shareText)}`, '_self');
    }
  };

  const nativeShare = async () => {
    if (pairLink) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'MobTrack Location Request',
            text: customMessage,
            url: pairLink
          });
        } catch (err) {
          // User canceled or failed, fallback to copy
          console.error("Share failed", err);
        }
      } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
        alert('Link copied to clipboard!');
      }
    }
  };

  // --- Pair Tracking Receiver Logic ---
  const handleAcceptShare = () => {
    setShareError(null);
    if (!navigator.geolocation) {
      setShareError('Geolocation is not supported by your browser.');
      return;
    }

    setIsSharing(true);
    
    navigator.geolocation.watchPosition(
      (position) => {
        fetch('/api/pair/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: receiverPairId,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        }).catch(err => console.error("Failed to update location:", err));
      },
      (error) => {
        setShareError(error.message || 'Failed to access location.');
        setIsSharing(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className={`min-h-screen font-mono flex justify-center p-4 sm:p-6 lg:p-8 transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-300' : 'blueprint-grid text-blue-900'}`}>
      
      {/* Theme Toggle & Privacy Mode */}
      <div className="absolute top-4 right-4 flex gap-2 z-50">
        <button 
          onClick={() => {
            setIsPrivacyMode(!isPrivacyMode);
            setIsRevealed(false);
          }}
          className={`p-2 rounded-lg border transition-all ${isPrivacyMode ? (isDark ? 'bg-red-950/50 border-red-500/50 text-red-400' : 'bg-red-100 border-red-400 text-red-600') : (isDark ? 'bg-slate-900 border-slate-700 text-slate-500 hover:text-emerald-400' : 'bg-white/50 border-blue-200 text-blue-400 hover:text-blue-600')}`}
          title="Toggle Privacy Mode"
        >
          {isPrivacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
        <button 
          onClick={() => setTheme('terminal')}
          className={`p-2 rounded-lg border transition-all ${isDark ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400' : 'bg-white/50 border-blue-200 text-blue-400 hover:text-blue-600'}`}
          title="Terminal Dark Theme"
        >
          <Moon className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setTheme('blueprint')}
          className={`p-2 rounded-lg border transition-all ${!isDark ? 'bg-blue-100 border-blue-400 text-blue-600' : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-emerald-400'}`}
          title="Blueprint Light Theme"
        >
          <Sun className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile App Frame Constraint */}
      <div className={`w-full max-w-md shadow-2xl rounded-3xl overflow-hidden border flex flex-col relative transition-colors duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-300'}`}>
        
        {/* Header Bar */}
        <header className={`border-b p-4 flex items-center justify-between z-10 transition-colors ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-blue-50 border-blue-200'}`}>
          <div className={`flex items-center gap-2 ${isDark ? 'text-emerald-500' : 'text-blue-700'}`}>
            <Crosshair className="w-5 h-5" />
            <h1 className="font-bold tracking-widest text-sm">MOBTRACK_OS</h1>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-emerald-500' : 'bg-blue-600'}`} />
            <span className={`text-[10px] ${isDark ? 'text-emerald-500/80' : 'text-blue-600/80'}`}>SECURE</span>
          </div>
        </header>

        {!isReceiver && (
          <div className={`flex border-b overflow-x-auto whitespace-nowrap transition-colors ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-blue-200 bg-white/50'}`}>
            <button
              onClick={() => setMode('locator')}
              className={`flex-1 p-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-colors min-w-[120px] ${mode === 'locator' ? (isDark ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-blue-600 border-b-2 border-blue-500') : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-blue-400')}`}
            >
              <Search className="w-4 h-4" /> REGION
            </button>
            <button
              onClick={() => setMode('pair')}
              className={`flex-1 relative p-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-colors min-w-[120px] ${mode === 'pair' ? (isDark ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-blue-600 border-b-2 border-blue-500') : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-blue-400')}`}
            >
              <Users className="w-4 h-4" /> PAIR
              {pairId && (
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 right-2 w-2 h-2 rounded-full ${
                    pairResult 
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' 
                      : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse'
                  }`} 
                  title={pairResult ? 'Connected' : 'Waiting for connection'}
                />
              )}
            </button>
            <button
              onClick={() => setMode('history')}
              className={`flex-1 p-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-colors min-w-[120px] ${mode === 'history' ? (isDark ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-blue-600 border-b-2 border-blue-500') : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-blue-400')}`}
            >
              <History className="w-4 h-4" /> HISTORY
            </button>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 no-scrollbar">
          
          {isReceiver ? (
            <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-500">
              <div className={`border rounded-xl p-6 flex flex-col items-center text-center gap-4 transition-colors ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
                <div className={`p-4 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-600'}`}>
                  <Link className="w-8 h-8" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Pairing Request</h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Someone has invited you to share your live location via MobTrack.
                  </p>
                </div>
              </div>

              {shareError && (
                <div className={`border rounded-lg p-3 flex items-start gap-2 text-sm transition-colors ${isDark ? 'bg-red-950/50 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{shareError}</p>
                </div>
              )}

              {!isSharing ? (
                <button
                  onClick={handleAcceptShare}
                  className={`w-full font-bold tracking-widest py-4 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                  <Check className="w-5 h-5" />
                  ACCEPT & SHARE LOCATION
                </button>
              ) : (
                <div className={`border rounded-xl p-6 flex flex-col items-center text-center gap-4 transition-colors ${isDark ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-blue-50 border-blue-200'}`}>
                  <Radar theme={theme} />
                  <p className={`text-sm font-bold tracking-widest animate-pulse ${isDark ? 'text-emerald-400' : 'text-blue-600'}`}>
                    BROADCASTING LOCATION...
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-blue-400'}`}>
                    You can close this window to stop sharing at any time.
                  </p>
                </div>
              )}
            </div>
          ) : mode === 'locator' ? (
            <>
              {/* Notice Panel */}
              <div className={`border rounded-xl p-4 flex gap-3 text-xs leading-relaxed transition-colors ${isDark ? 'bg-amber-950/30 border-amber-500/20 text-amber-500/90' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <ShieldAlert className={`w-5 h-5 shrink-0 ${isDark ? 'text-amber-500' : 'text-amber-600'}`} />
                <p>
                  <strong>LEGAL NOTICE:</strong> Real-time device tracking via arbitrary phone numbers is technically impossible using open APIs and illegal without carrier consent. This utility uses open-source parsing to visualize the registered country/region of the provided prefix.
                </p>
              </div>

              <form onSubmit={handleLocate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className={`text-xs font-semibold tracking-wider transition-colors ${isDark ? 'text-slate-500' : 'text-blue-600/70'}`}>
                    TARGET IDENTIFIER (INTL FORMAT)
                  </label>
                  <div className="relative">
                    <Terminal className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDark ? 'text-emerald-500/50' : 'text-blue-400'}`} />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+39 333 123 4567"
                      disabled={isLocating}
                      className={`w-full border rounded-lg py-3 pl-10 pr-4 transition-all disabled:opacity-50 focus:outline-none focus:ring-1 ${isDark ? 'bg-slate-950 border-slate-700 text-emerald-400 placeholder:text-slate-700 focus:border-emerald-500 focus:ring-emerald-500' : 'bg-blue-50/50 border-blue-200 text-blue-900 placeholder:text-blue-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLocating || !phone}
                  className={`w-full font-bold tracking-widest py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                  {isLocating ? (
                    <>
                      <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-slate-950' : 'border-white'}`} />
                      PROCESSING
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      INITIATE LOCATOR
                    </>
                  )}
                </button>
              </form>

              {recentSearches.length > 0 && !isLocating && (
                <div className="flex flex-col gap-2 mt-2">
                  <h3 className={`text-xs font-semibold tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-blue-500'}`}>
                    <Clock className="w-3 h-3" /> RECENT SEARCHES
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <div
                        key={search}
                        className={`flex items-center rounded-full border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-blue-200 text-blue-700'}`}
                      >
                        <button
                          onClick={() => setPhone(search)}
                          className={`text-xs px-3 py-1.5 transition-colors rounded-l-full ${isDark ? 'hover:text-emerald-400 hover:bg-slate-800' : 'hover:text-blue-600 hover:bg-blue-50'}`}
                        >
                          {search}
                        </button>
                        <button
                          onClick={(e) => removeFromRecentSearches(e, search)}
                          className={`p-1.5 transition-colors rounded-r-full ${isDark ? 'hover:text-red-400 hover:bg-slate-800' : 'hover:text-red-500 hover:bg-red-50'}`}
                          title="Remove from history"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className={`border rounded-lg p-3 flex items-start gap-2 text-sm transition-colors ${isDark ? 'bg-red-950/50 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {isLocating && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Radar theme={theme} />
                  <div className={`mt-6 h-6 flex items-center justify-center gap-3 transition-colors ${isDark ? 'text-emerald-400' : 'text-blue-600'}`}>
                    <p className="text-sm font-bold tracking-widest animate-pulse">
                      {statusText}
                    </p>
                    <span className="font-mono text-xs opacity-70">
                      {(locateElapsedMs / 1000).toFixed(2)}s
                    </span>
                  </div>
                </div>
              )}

              {result && !isLocating && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={`rounded-xl p-4 border flex flex-col gap-2 transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
                    <h3 className={`text-xs font-semibold tracking-wider flex items-center gap-2 transition-colors ${isDark ? 'text-slate-500' : 'text-blue-500'}`}>
                      <MapPin className="w-3 h-3" /> LOCATION DATA ACQUIRED
                    </h3>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className={`text-2xl font-bold transition-colors ${isDark ? 'text-emerald-400' : 'text-blue-700'}`}>{result.countryName}</p>
                        <p className={`text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-blue-500'}`}>Prefix Region: {result.countryCode}</p>
                        {result.carrierName && result.carrierName !== 'Unknown Carrier' && (
                          <p className={`text-sm mt-1 transition-colors ${isDark ? 'text-emerald-500/80' : 'text-blue-600/80'}`}>
                            Carrier Match: <span className={`font-bold transition-colors ${isDark ? 'text-emerald-400' : 'text-blue-700'}`}>{result.carrierName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`mt-2 p-3 rounded-lg border font-mono text-sm flex items-center justify-between transition-colors ${isDark ? 'bg-slate-900 border-slate-700/50 text-slate-400' : 'bg-white border-blue-200 text-blue-800'}`}>
                      <div>
                        <div>LAT: {isPrivacyMode && !isRevealed ? 'REDACTED' : result.lat.toFixed(4)}</div>
                        <div>LNG: {isPrivacyMode && !isRevealed ? 'REDACTED' : result.lng.toFixed(4)}</div>
                      </div>
                      {isPrivacyMode && !isRevealed && (
                        <button 
                          onClick={() => setIsRevealed(true)}
                          className={`px-3 py-1 text-xs rounded border transition-colors ${isDark ? 'border-emerald-500/50 text-emerald-400 hover:bg-slate-800' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
                        >
                          REVEAL
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`h-[300px] w-full rounded-xl overflow-hidden border relative transition-colors ${isDark ? 'border-slate-700' : 'border-blue-300'}`}>
                    <RegionMap key={`${result.lat}-${result.lng}-${theme}`} lat={result.lat} lng={result.lng} countryName={result.countryName} theme={theme} privacyMode={isPrivacyMode && !isRevealed} />
                  </div>
                  
                  <div className={`flex gap-2 items-start text-xs p-3 rounded-lg border transition-colors ${isDark ? 'text-slate-500 bg-slate-950/50 border-slate-800/50' : 'text-blue-600/80 bg-blue-50/50 border-blue-200/50'}`}>
                    <Info className={`w-4 h-4 shrink-0 transition-colors ${isDark ? 'text-slate-400' : 'text-blue-400'}`} />
                    <p>Coordinates represent the geographic center of the registered country prefix. Pinpoint device tracking requires carrier-level SS7 access.</p>
                  </div>
                </div>
              )}
            </>
          ) : mode === 'pair' ? (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className={`border rounded-xl p-4 flex gap-3 text-xs leading-relaxed transition-colors ${isDark ? 'text-slate-300 bg-slate-800/50 border-slate-700' : 'text-blue-800 bg-blue-50/50 border-blue-200'}`}>
                <Info className={`w-5 h-5 shrink-0 ${isDark ? 'text-slate-400' : 'text-blue-500'}`} />
                <p>
                  Voluntary pair tracking generates a secure, one-time link. When the recipient opens the link and accepts, their browser will share its location directly to your map session.
                </p>
              </div>

              {!pairId ? (
                <div className="flex flex-col gap-6">
                  <button
                    onClick={generatePairLink}
                    className={`w-full font-bold tracking-widest py-4 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700' : 'bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'}`}
                  >
                    <Link className="w-4 h-4" />
                    GENERATE PAIRING LINK
                  </button>
                  
                  {savedPairs.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h3 className={`text-xs font-bold tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        SAVED PAIRS
                      </h3>
                      <div className="flex flex-col gap-2">
                        {savedPairs.map(pair => (
                          <div key={pair.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
                            <div className="flex flex-col gap-1">
                              <span className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-blue-800'}`}>{pair.name}</span>
                              <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-blue-500/70'}`}>{pair.id.substring(0,8)}... • {new Date(pair.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => connectSavedPair(pair.id)}
                                className={`p-2 rounded-full transition-colors ${isDark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                                title="Connect"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeSavedPair(pair.id)}
                                className={`p-2 rounded-full transition-colors ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`border rounded-xl p-6 flex flex-col gap-4 transition-colors ${isDark ? 'bg-slate-800/50 border-emerald-500/30' : 'bg-white border-blue-300 shadow-md'}`}>
                  <h3 className={`text-sm font-bold tracking-widest text-center ${isDark ? 'text-emerald-400' : 'text-blue-600'}`}>
                    AWAITING UPLINK...
                  </h3>
                  
                  <div className={`p-3 rounded-lg border text-center break-all font-mono text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-blue-50 border-blue-200 text-blue-600/80'}`}>
                    {pairLink}
                  </div>

                  <div className="flex flex-col items-center gap-4 my-2">
                    <div className={`p-3 bg-white rounded-xl ${isDark ? '' : 'border border-blue-200 shadow-sm'}`}>
                      <QRCodeSVG value={pairLink || ''} size={150} level="M" />
                    </div>
                    <button
                      onClick={saveCurrentPair}
                      className={`px-4 py-2 text-xs font-bold tracking-widest rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm ${
                        savedPairs.some(p => p.id === pairId)
                          ? (isDark ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed')
                          : (isDark ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-900/60' : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200')
                      }`}
                      disabled={savedPairs.some(p => p.id === pairId)}
                    >
                      <BookmarkPlus className="w-4 h-4" />
                      {savedPairs.some(p => p.id === pairId) ? 'PAIR SAVED' : 'SAVE PAIR'}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={`text-xs font-semibold tracking-wider ${isDark ? 'text-slate-500' : 'text-blue-600/70'}`}>CUSTOMIZE MESSAGE</label>
                    <textarea 
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={2}
                      className={`w-full rounded-lg p-2 text-sm border focus:outline-none focus:ring-1 ${isDark ? 'bg-slate-900 border-slate-700 text-emerald-400 focus:border-emerald-500 focus:ring-emerald-500' : 'bg-white border-blue-200 text-blue-900 focus:border-blue-500 focus:ring-blue-500'}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={openWhatsApp}
                      className="w-full font-bold text-xs tracking-widest py-3 px-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WHATSAPP
                    </button>
                    <button
                      onClick={openTelegram}
                      className="w-full font-bold text-xs tracking-widest py-3 px-2 rounded-lg bg-[#229ED9] hover:bg-[#1e8abf] text-white transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      TELEGRAM
                    </button>
                    <button
                      onClick={openSMS}
                      className={`w-full font-bold text-xs tracking-widest py-3 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      SMS
                    </button>
                    <button
                      onClick={nativeShare}
                      className={`w-full font-bold text-xs tracking-widest py-3 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      OTHER...
                    </button>
                  </div>
                  
                  <div className={`mt-2 pt-4 border-t flex flex-col gap-4 ${isDark ? 'border-slate-700' : 'border-blue-200'}`}>
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-semibold tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        <RefreshCw className={`w-3.5 h-3.5 ${isPairPolling ? 'animate-spin text-emerald-500' : ''}`} />
                        AUTO-REFRESH
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={isPairPolling}
                          onChange={(e) => setIsPairPolling(e.target.checked)}
                        />
                        <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 transition-colors ${
                          isDark 
                            ? 'bg-slate-700 peer-focus:ring-emerald-500/50 peer-checked:bg-emerald-500' 
                            : 'bg-slate-200 peer-focus:ring-blue-500/50 peer-checked:bg-blue-500'
                        } after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white`}></div>
                      </label>
                    </div>
                    {isPairPolling && (
                      <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Polling Interval</span>
                        <div className="flex gap-2">
                          {[5000, 10000, 30000].map(interval => (
                            <button
                              key={interval}
                              onClick={() => setPollingInterval(interval)}
                              className={`px-2 py-1 text-xs rounded border transition-colors ${
                                pollingInterval === interval
                                  ? (isDark ? 'bg-slate-700 border-slate-500 text-white' : 'bg-blue-100 border-blue-400 text-blue-800')
                                  : (isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50')
                              }`}
                            >
                              {interval / 1000}s
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-center pt-2">
                      <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-emerald-500' : 'border-blue-500'}`} style={{ display: isPairPolling ? 'block' : 'none' }} />
                    </div>
                  </div>
                </div>
              )}

              {pairResult && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={`rounded-xl p-4 border flex flex-col gap-2 transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-200'} ${geofenceAlert ? (isDark ? 'ring-2 ring-red-500/50' : 'ring-2 ring-red-500') : ''}`}>
                    <div className="flex justify-between items-start">
                      <h3 className={`text-xs font-semibold tracking-wider flex items-center gap-2 transition-colors ${isDark ? 'text-slate-500' : 'text-blue-500'}`}>
                        <MapPin className="w-3 h-3" /> PAIR LOCATION DATA ACQUIRED
                      </h3>
                      <button 
                        onClick={() => setGeofenceEnabled(!geofenceEnabled)}
                        className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs font-bold ${geofenceEnabled ? (isDark ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : 'bg-blue-100 border-blue-400 text-blue-700') : (isDark ? 'bg-slate-900 border-slate-700 text-slate-500' : 'bg-white border-blue-200 text-blue-400')}`}
                        title="Toggle Geofence Alert"
                      >
                        {geofenceEnabled ? <BellRing className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                        GEOFENCE
                      </button>
                    </div>
                    {geofenceEnabled && (
                      <div className="flex items-center gap-2 mt-1">
                        <label className={`text-[10px] font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-blue-400'}`}>RADIUS (m):</label>
                        <input 
                          type="number" 
                          min="10" 
                          step="10"
                          value={geofenceRadius} 
                          onChange={(e) => setGeofenceRadius(Number(e.target.value) || 100)}
                          className={`w-20 text-xs p-1 rounded border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-blue-200 text-blue-800'}`}
                        />
                        {geofenceAlert && <span className="text-[10px] font-bold text-red-500 animate-pulse ml-auto">ALERT: OUTSIDE RADIUS</span>}
                      </div>
                    )}
                    <div className={`mt-2 p-3 rounded-lg border font-mono text-sm flex items-center justify-between transition-colors ${isDark ? 'bg-slate-900 border-slate-700/50 text-slate-400' : 'bg-white border-blue-200 text-blue-800'}`}>
                      <div>
                        <div>LAT: {isPrivacyMode && !isRevealed ? 'REDACTED' : pairResult.lat.toFixed(4)}</div>
                        <div>LNG: {isPrivacyMode && !isRevealed ? 'REDACTED' : pairResult.lng.toFixed(4)}</div>
                      </div>
                      {isPrivacyMode && !isRevealed && (
                        <button 
                          onClick={() => setIsRevealed(true)}
                          className={`px-3 py-1 text-xs rounded border transition-colors ${isDark ? 'border-emerald-500/50 text-emerald-400 hover:bg-slate-800' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
                        >
                          REVEAL
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`h-[300px] w-full rounded-xl overflow-hidden border relative transition-colors ${isDark ? 'border-slate-700' : 'border-blue-300'}`}>
                    <RegionMap key={`pair-${pairResult.lat}-${pairResult.lng}-${theme}`} lat={pairResult.lat} lng={pairResult.lng} countryName="Paired Device" theme={theme} privacyMode={isPrivacyMode && !isRevealed} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold tracking-widest ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  LOCATION HISTORY
                </h2>
                {locationHistory.length > 0 && (
                  <div className="flex gap-2">
                    <button 
                      onClick={exportCSV}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-colors ${isDark ? 'border-emerald-500/50 text-emerald-400 hover:bg-slate-800' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                      title="Export CSV"
                    >
                      <Download className="w-3.5 h-3.5" /> EXPORT
                    </button>
                    <button 
                      onClick={clearHistory}
                      className={`text-xs px-3 py-1.5 rounded border transition-colors ${isDark ? 'border-red-500/50 text-red-400 hover:bg-slate-800' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                    >
                      CLEAR
                    </button>
                  </div>
                )}
              </div>

              {locationHistory.length === 0 ? (
                <div className={`border rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2 transition-colors ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-blue-50/50 border-blue-200'}`}>
                  <History className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-blue-300'}`} />
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No history recorded yet.</p>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Pairing session locations will appear here.</p>
                </div>
              ) : selectedSessionId ? (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <button 
                      onClick={() => setSelectedSessionId(null)}
                      className={`text-xs px-3 py-1.5 rounded border flex items-center gap-2 transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                    >
                      <X className="w-3 h-3" /> BACK TO LIST
                    </button>
                    <div className={`text-xs font-mono font-bold ${isDark ? 'text-slate-500' : 'text-blue-400'}`}>
                      SESSION: {selectedSessionId.substring(0, 8)}...
                    </div>
                  </div>
                  {(() => {
                    const sessionLocs = locationHistory.filter(l => l.id === selectedSessionId);
                    if (sessionLocs.length === 0) return null;
                    
                    const latest = sessionLocs[0];
                    const first = sessionLocs[sessionLocs.length - 1];
                    let distance = 0;
                    if (sessionLocs.length > 1) {
                      const R = 6371; // km
                      const dLat = (latest.lat - first.lat) * Math.PI / 180;
                      const dLon = (latest.lng - first.lng) * Math.PI / 180;
                      const a = 
                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(first.lat * Math.PI / 180) * Math.cos(latest.lat * Math.PI / 180) * 
                        Math.sin(dLon/2) * Math.sin(dLon/2); 
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                      distance = R * c;
                    }

                    return (
                      <div className="flex flex-col gap-4">
                        {sessionLocs.length > 1 && (
                          <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
                            <div className={`text-xs font-semibold tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-blue-600'}`}>
                              <Crosshair className="w-4 h-4" /> STRAIGHT-LINE DISTANCE
                            </div>
                            <div className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-blue-700'}`}>
                              {isPrivacyMode && !isRevealed ? 'REDACTED' : `${distance.toFixed(2)} km`}
                            </div>
                          </div>
                        )}
                        <div className={`h-[400px] w-full rounded-xl overflow-hidden border relative transition-colors ${isDark ? 'border-slate-700' : 'border-blue-300'}`}>
                          <RegionMap key={`history-${selectedSessionId}-${theme}`} lat={latest.lat} lng={latest.lng} locations={sessionLocs} theme={theme} privacyMode={isPrivacyMode && !isRevealed} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-blue-400'}`} />
                    <input
                      type="text"
                      placeholder="Search Session ID or Time..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors ${
                        isDark 
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-emerald-500/50' 
                          : 'bg-white border-blue-200 text-slate-800 placeholder-slate-400 focus:ring-blue-500/50'
                      }`}
                    />
                    {historySearchQuery && (
                      <button 
                        onClick={() => setHistorySearchQuery('')}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-blue-400 hover:text-blue-600'}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    {Object.entries(locationHistory.reduce((acc, entry) => {
                      if (!acc[entry.id]) acc[entry.id] = [];
                      acc[entry.id].push(entry);
                      return acc;
                    }, {} as Record<string, LocationHistoryEntry[]>))
                    .filter(([id, entriesRaw]) => {
                      if (!historySearchQuery) return true;
                      const q = historySearchQuery.toLowerCase();
                      if (id.toLowerCase().includes(q)) return true;
                      const entries = entriesRaw as LocationHistoryEntry[];
                      const timeStr = new Date(entries[0].timestamp).toLocaleTimeString().toLowerCase();
                      return timeStr.includes(q);
                    })
                    .map(([id, entriesRaw]) => {
                    const entries = entriesRaw as LocationHistoryEntry[];
                    return (
                    <div key={id} className={`border rounded-xl p-4 flex flex-col gap-3 transition-colors ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-blue-200 shadow-sm'}`}>
                      <div className="flex justify-between items-start">
                        <div className={`text-xs font-semibold ${isDark ? 'text-emerald-400' : 'text-blue-600'}`}>
                          SESSION ID: {id.substring(0, 8)}...
                        </div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {entries.length} RECORD{entries.length > 1 ? 'S' : ''}
                        </div>
                      </div>
                      <div className={`font-mono text-xs flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        LATEST: {new Date(entries[0].timestamp).toLocaleTimeString()}
                      </div>
                      <button 
                        onClick={() => setSelectedSessionId(id)}
                        className={`mt-2 w-full font-bold text-xs tracking-widest py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                      >
                        <MapPin className="w-3.5 h-3.5" /> VIEW ALL MAP
                      </button>
                    </div>
                  )})}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
