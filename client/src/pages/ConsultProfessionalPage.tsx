/// <reference types="vite/client" />
/// <reference types="google.maps" />
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
  MapPin,
  Navigation,
  Search,
  Phone,
  Globe,
  Star,
  ExternalLink,
  ArrowLeft,
  Shield,
  Scale,
  Clock,
  AlertCircle,
  CheckCircle2,
  Printer,
  Sparkles,
  Loader2,
  Building2,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDiscovery } from '../context/DiscoveryContext';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

let mapsOptionsInitialized = false;

type PracticeCategory = 'all' | 'divorce' | 'mediation' | 'legalaid';

interface LawPractice {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingsTotal?: number;
  isOpenNow?: boolean;
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  categoryLabel: string;
  distanceMiles?: number;
  isFallback?: boolean;
}

const CATEGORY_OPTIONS: Array<{ id: PracticeCategory; label: string; query: string }> = [
  { id: 'all', label: 'All Family Law', query: 'family law attorney divorce lawyer' },
  { id: 'divorce', label: 'Divorce & Custody', query: 'divorce and child custody attorney' },
  { id: 'mediation', label: 'Mediation', query: 'family law mediation divorce mediator' },
  { id: 'legalaid', label: 'Legal Aid / Low-Cost', query: 'family law legal aid clinic' }
];

const RADIUS_OPTIONS = [
  { miles: 5, meters: 8047, label: '5 miles' },
  { miles: 10, meters: 16093, label: '10 miles' },
  { miles: 25, meters: 40234, label: '25 miles' }
];

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildFallbackPractices(
  centerLat: number,
  centerLng: number,
  areaLabel: string,
  category: PracticeCategory
): LawPractice[] {
  const base: Array<Omit<LawPractice, 'distanceMiles'>> = [
    {
      id: 'sample-1',
      name: `Harborview Family Law & Divorce Group`,
      address: `Near ${areaLabel} · 450 Main St, Suite 300`,
      lat: centerLat + 0.012,
      lng: centerLng - 0.015,
      rating: 4.9,
      userRatingsTotal: 84,
      isOpenNow: true,
      phone: '(555) 234-8910',
      categoryLabel: 'Family Law & Asset Division',
      googleMapsUrl: `https://www.google.com/maps/search/family+law+attorney/@${centerLat},${centerLng},13z`,
      isFallback: true
    },
    {
      id: 'sample-2',
      name: `Pacific Coast Divorce Mediation Center`,
      address: `Near ${areaLabel} · 1200 Oakridge Ave, Floor 2`,
      lat: centerLat - 0.018,
      lng: centerLng + 0.014,
      rating: 4.8,
      userRatingsTotal: 52,
      isOpenNow: true,
      phone: '(555) 391-4420',
      categoryLabel: 'Mediation & Collaborative Divorce',
      googleMapsUrl: `https://www.google.com/maps/search/divorce+mediation/@${centerLat},${centerLng},13z`,
      isFallback: true
    },
    {
      id: 'sample-3',
      name: `Women's Legal Advocacy & Family Law Clinic`,
      address: `Near ${areaLabel} · 88 Civic Center Plaza`,
      lat: centerLat + 0.022,
      lng: centerLng + 0.019,
      rating: 4.7,
      userRatingsTotal: 119,
      isOpenNow: true,
      phone: '(555) 800-3100',
      categoryLabel: 'Legal Aid / Sliding Scale',
      googleMapsUrl: `https://www.google.com/maps/search/family+law+legal+aid/@${centerLat},${centerLng},13z`,
      isFallback: true
    },
    {
      id: 'sample-4',
      name: `Chen & Morales Family Law LLP`,
      address: `Near ${areaLabel} · 740 Market Blvd, Suite 510`,
      lat: centerLat - 0.009,
      lng: centerLng - 0.022,
      rating: 4.9,
      userRatingsTotal: 67,
      isOpenNow: false,
      phone: '(555) 612-7740',
      categoryLabel: 'Complex Marital Estates & Custody',
      googleMapsUrl: `https://www.google.com/maps/search/family+law+lawyer/@${centerLat},${centerLng},13z`,
      isFallback: true
    },
    {
      id: 'sample-5',
      name: `Bayshore Custody & Support Counsel`,
      address: `Near ${areaLabel} · 315 Elm St, Suite 104`,
      lat: centerLat + 0.006,
      lng: centerLng + 0.026,
      rating: 4.6,
      userRatingsTotal: 41,
      isOpenNow: true,
      phone: '(555) 478-9205',
      categoryLabel: 'Divorce, Spousal & Child Support',
      googleMapsUrl: `https://www.google.com/maps/search/divorce+attorney/@${centerLat},${centerLng},13z`,
      isFallback: true
    }
  ];

  const withDistance = base.map((p) => ({
    ...p,
    distanceMiles: Number(haversineMiles(centerLat, centerLng, p.lat, p.lng).toFixed(1))
  }));

  if (category === 'mediation') {
    return withDistance.filter((p) => p.categoryLabel.toLowerCase().includes('mediation') || p.id === 'sample-1');
  }
  if (category === 'legalaid') {
    return withDistance.filter((p) => p.categoryLabel.toLowerCase().includes('legal aid') || p.id === 'sample-2');
  }
  if (category === 'divorce') {
    return withDistance.filter((p) => !p.categoryLabel.toLowerCase().includes('legal aid'));
  }
  return withDistance;
}

export default function ConsultProfessionalPage() {
  const { currentUser } = useAuth();
  const { exportDiscoveryPacket } = useDiscovery();

  const [zipInput, setZipInput] = useState('');
  const [category, setCategory] = useState<PracticeCategory>('all');
  const [radiusMiles, setRadiusMiles] = useState<number>(10);

  const [locationLabel, setLocationLabel] = useState<string>('');
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [practices, setPractices] = useState<LawPractice[]>([]);
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locationPromptDismissed, setLocationPromptDismissed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usingFallbackMode, setUsingFallbackMode] = useState(!GOOGLE_MAPS_API_KEY);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const centerMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const selectedCategoryObj = useMemo(
    () => CATEGORY_OPTIONS.find((c) => c.id === category) || CATEGORY_OPTIONS[0],
    [category]
  );

  const selectedRadiusObj = useMemo(
    () => RADIUS_OPTIONS.find((r) => r.miles === radiusMiles) || RADIUS_OPTIONS[1],
    [radiusMiles]
  );

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setMap(null);
      centerMarkerRef.current = null;
    }
  }, []);

  const ensureGoogleMapsLoaded = useCallback(async () => {
    if (!GOOGLE_MAPS_API_KEY) {
      setUsingFallbackMode(true);
      return false;
    }

    try {
      if (!mapsOptionsInitialized) {
        setOptions({
          key: GOOGLE_MAPS_API_KEY,
          v: 'weekly'
        });
        mapsOptionsInitialized = true;
      }

      await Promise.all([
        importLibrary('maps'),
        importLibrary('places'),
        importLibrary('geocoding')
      ]);

      setUsingFallbackMode(false);
      return true;
    } catch (err) {
      console.error('Failed to load Google Maps API:', err);
      setUsingFallbackMode(true);
      return false;
    }
  }, []);

  const fetchPlaceDetails = useCallback((placeId: string) => {
    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      {
        placeId,
        fields: ['formatted_phone_number', 'website', 'url', 'opening_hours']
      },
      (details, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && details) {
          setPractices((prev) =>
            prev.map((p) =>
              p.id === placeId
                ? {
                    ...p,
                    phone: details.formatted_phone_number || p.phone,
                    website: details.website || p.website,
                    googleMapsUrl: details.url || p.googleMapsUrl,
                    isOpenNow: details.opening_hours?.isOpen?.() ?? p.isOpenNow
                  }
                : p
            )
          );
        }
      }
    );
  }, []);

  const selectPractice = useCallback(
    (practice: LawPractice, openInfoWindow = true) => {
      setSelectedPracticeId(practice.id);

      if (mapInstanceRef.current && !usingFallbackMode) {
        mapInstanceRef.current.panTo({ lat: practice.lat, lng: practice.lng });
        if ((mapInstanceRef.current.getZoom() || 12) < 13) {
          mapInstanceRef.current.setZoom(13);
        }

        const markerIndex = practices.findIndex((p) => p.id === practice.id);
        const marker = markersRef.current[markerIndex];
        if (openInfoWindow && marker && infoWindowRef.current) {
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            `${practice.name}, ${practice.address}`
          )}`;
          infoWindowRef.current.setContent(`
            <div style="font-family: 'DM Sans', sans-serif; max-width: 240px; padding: 4px;">
              <div style="font-weight: 600; font-size: 13px; color: #261E19; margin-bottom: 4px;">${practice.name}</div>
              <div style="font-size: 11px; color: #5C4E43; margin-bottom: 6px;">${practice.address}</div>
              ${
                practice.rating
                  ? `<div style="font-size: 11px; color: #435C4D; font-weight: 500; margin-bottom: 6px;">★ ${practice.rating} (${practice.userRatingsTotal || 0} reviews)</div>`
                  : ''
              }
              <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: #435C4D; font-weight: 600; text-decoration: underline;">Get Directions →</a>
            </div>
          `);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }

        if (!practice.phone && !practice.website && !practice.isFallback) {
          fetchPlaceDetails(practice.id);
        }
      }

      const cardEl = cardRefs.current[practice.id];
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },
    [fetchPlaceDetails, practices, usingFallbackMode]
  );

  const searchNearbyPractices = useCallback(
    async (center: { lat: number; lng: number }, areaLabel: string) => {
      setIsSearching(true);
      setErrorMsg(null);
      setSearchCenter(center);
      setLocationLabel(areaLabel);
      setLocationPromptDismissed(true);

      const mapsReady = await ensureGoogleMapsLoaded();

      if (!mapsReady || !mapContainerRef.current) {
        const fallback = buildFallbackPractices(center.lat, center.lng, areaLabel, category);
        setPractices(fallback);
        setSelectedPracticeId(fallback[0]?.id || null);
        setIsSearching(false);
        return;
      }

      try {
        const { Map, InfoWindow } = (await importLibrary('maps')) as google.maps.MapsLibrary;
        const { PlacesService } = (await importLibrary('places')) as google.maps.PlacesLibrary;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new Map(mapContainerRef.current, {
            center,
            zoom: radiusMiles <= 5 ? 13 : radiusMiles <= 10 ? 12 : 11,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
          });
        } else {
          mapInstanceRef.current.setCenter(center);
          mapInstanceRef.current.setZoom(radiusMiles <= 5 ? 13 : radiusMiles <= 10 ? 12 : 11);
        }

        if (!infoWindowRef.current) {
          infoWindowRef.current = new InfoWindow();
        }

        if (!placesServiceRef.current) {
          placesServiceRef.current = new PlacesService(mapInstanceRef.current);
        }

        clearMarkers();

        // Search center pin
        centerMarkerRef.current = new google.maps.Marker({
          position: center,
          map: mapInstanceRef.current,
          title: `Search area: ${areaLabel}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#435C4D',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2.5
          }
        });

        const request: google.maps.places.TextSearchRequest = {
          query: selectedCategoryObj.query,
          location: center,
          radius: selectedRadiusObj.meters
        };

        placesServiceRef.current.textSearch(request, (results, status) => {
          setIsSearching(false);

          if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const mapped: LawPractice[] = results
              .filter((r) => r.geometry?.location && r.place_id)
              .slice(0, 15)
              .map((r) => {
                const lat = r.geometry!.location!.lat();
                const lng = r.geometry!.location!.lng();
                return {
                  id: r.place_id!,
                  name: r.name || 'Family Law Office',
                  address: r.formatted_address || 'Address available on Google Maps',
                  lat,
                  lng,
                  rating: r.rating,
                  userRatingsTotal: r.user_ratings_total,
                  isOpenNow: r.opening_hours?.isOpen?.(),
                  categoryLabel: selectedCategoryObj.label,
                  distanceMiles: Number(haversineMiles(center.lat, center.lng, lat, lng).toFixed(1)),
                  googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`
                };
              })
              .sort((a, b) => (a.distanceMiles ?? 99) - (b.distanceMiles ?? 99));

            setPractices(mapped);
            setSelectedPracticeId(mapped[0]?.id || null);

            const bounds = new google.maps.LatLngBounds();
            bounds.extend(center);

            mapped.forEach((practice) => {
              const pos = { lat: practice.lat, lng: practice.lng };
              bounds.extend(pos);

              const marker = new google.maps.Marker({
                position: pos,
                map: mapInstanceRef.current!,
                title: practice.name
              });

              marker.addListener('click', () => {
                selectPractice(practice, true);
              });

              markersRef.current.push(marker);
            });

            if (mapped.length > 1 && mapInstanceRef.current) {
              mapInstanceRef.current.fitBounds(bounds, 48);
            }
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setPractices([]);
            setSelectedPracticeId(null);
            setErrorMsg(`No ${selectedCategoryObj.label.toLowerCase()} offices found within ${radiusMiles} miles of ${areaLabel}. Try expanding your search radius.`);
          } else {
            // API key restriction / billing / quota fallback
            setUsingFallbackMode(true);
            const fallback = buildFallbackPractices(center.lat, center.lng, areaLabel, category);
            setPractices(fallback);
            setSelectedPracticeId(fallback[0]?.id || null);
          }
        });
      } catch (err) {
        console.error('Google Maps search error:', err);
        setIsSearching(false);
        setUsingFallbackMode(true);
        const fallback = buildFallbackPractices(center.lat, center.lng, areaLabel, category);
        setPractices(fallback);
        setSelectedPracticeId(fallback[0]?.id || null);
      }
    },
    [
      category,
      clearMarkers,
      ensureGoogleMapsLoaded,
      radiusMiles,
      selectPractice,
      selectedCategoryObj,
      selectedRadiusObj
    ]
  );

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser. Please enter your 5-digit ZIP code instead.');
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        let areaLabel = 'Your Current Location';
        const mapsReady = await ensureGoogleMapsLoaded();

        if (mapsReady) {
          try {
            const { Geocoder } = (await importLibrary('geocoding')) as google.maps.GeocodingLibrary;
            const geocoder = new Geocoder();
            const geocodeRes = await geocoder.geocode({ location: center });
            const first = geocodeRes.results?.[0];
            if (first) {
              const cityComp = first.address_components?.find((c) => c.types.includes('locality'));
              const stateComp = first.address_components?.find((c) =>
                c.types.includes('administrative_area_level_1')
              );
              const zipComp = first.address_components?.find((c) => c.types.includes('postal_code'));
              if (cityComp && stateComp) {
                areaLabel = `${cityComp.long_name}, ${stateComp.short_name}${zipComp ? ` ${zipComp.long_name}` : ''}`;
              } else if (first.formatted_address) {
                areaLabel = first.formatted_address;
              }
            }
          } catch {
            // Keep default label
          }
        }

        setIsLocating(false);
        searchNearbyPractices(center, areaLabel);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg('Location access was declined. No problem—enter your 5-digit ZIP code above to search nearby family law offices.');
        } else {
          setErrorMsg('Unable to determine your current location. Please enter your 5-digit ZIP code instead.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [ensureGoogleMapsLoaded, searchNearbyPractices]);

  const handleZipSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = zipInput.trim();
    if (!cleaned) {
      setErrorMsg('Please enter a 5-digit ZIP code or click "Use My Location".');
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);

    const mapsReady = await ensureGoogleMapsLoaded();

    if (mapsReady) {
      try {
        const { Geocoder } = (await importLibrary('geocoding')) as google.maps.GeocodingLibrary;
        const geocoder = new Geocoder();
        const res = await geocoder.geocode({
          address: cleaned,
          componentRestrictions: /^\d{5}$/.test(cleaned) ? { country: 'US' } : undefined
        });

        const match = res.results?.[0];
        if (match?.geometry?.location) {
          const center = {
            lat: match.geometry.location.lat(),
            lng: match.geometry.location.lng()
          };
          const label = match.formatted_address || `ZIP ${cleaned}`;
          await searchNearbyPractices(center, label);
          return;
        }
      } catch (err) {
        console.warn('Geocoder fallback triggered:', err);
      }
    }

    // Fallback geocoding for 5-digit US ZIP codes when Google Maps API key is not configured
    if (/^\d{5}$/.test(cleaned)) {
      try {
        const resp = await fetch(`https://api.zippopotam.us/us/${cleaned}`);
        if (resp.ok) {
          const data = await resp.json();
          const place = data.places?.[0];
          if (place) {
            const center = {
              lat: parseFloat(place.latitude),
              lng: parseFloat(place.longitude)
            };
            const label = `${place['place name']}, ${place['state abbreviation']} ${cleaned}`;
            await searchNearbyPractices(center, label);
            return;
          }
        }
      } catch {
        // Fall through to default center
      }
    }

    // Default fallback center (San Francisco, CA) if offline/unknown zip
    await searchNearbyPractices({ lat: 37.7749, lng: -122.4194 }, `ZIP ${cleaned}`);
  };

  // Re-run search when category or radius changes if a center is already active
  useEffect(() => {
    if (searchCenter && locationLabel) {
      searchNearbyPractices(searchCenter, locationLabel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, radiusMiles]);

  // If browser geolocation permission is already granted, auto-locate once on load
  useEffect(() => {
    let mounted = true;
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          if (mounted && status.state === 'granted' && !searchCenter) {
            handleUseMyLocation();
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const osmEmbedUrl = useMemo(() => {
    if (!searchCenter) return '';
    const delta = radiusMiles <= 5 ? 0.06 : radiusMiles <= 10 ? 0.12 : 0.25;
    const bbox = `${searchCenter.lng - delta},${searchCenter.lat - delta},${searchCenter.lng + delta},${searchCenter.lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${searchCenter.lat},${searchCenter.lng}`;
  }, [searchCenter, radiusMiles]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DBD0] pb-6">
        <div className="space-y-1.5">
          <Link
            to={currentUser ? '/dashboard' : '/'}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C4E43] hover:text-[#261E19] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{currentUser ? 'Back to Dashboard' : 'Back to Home'}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#261E19] tracking-tight flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-[#435C4D]" />
            <span>Consult a Family Law Professional</span>
          </h1>
          <p className="text-sm text-[#5C4E43] max-w-2xl">
            Find family law attorneys, divorce mediators, and legal aid offices near you. Bring your Sparrow Discovery Brief to your first consultation so you don&apos;t waste billable hours.
          </p>
        </div>

        {currentUser && (
          <button
            type="button"
            onClick={() => exportDiscoveryPacket('print')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#435C4D] bg-[#E6ECE6] hover:bg-[#d7e2d7] rounded-lg transition self-start md:self-auto"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save Lawyer Brief</span>
          </button>
        )}
      </div>

      {/* Location Permission Prompt Banner (shown before first search) */}
      {!searchCenter && !locationPromptDismissed && (
        <div className="bg-[#FAF9F6] border border-[#E2DBD0] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E6ECE6] text-[#435C4D] flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-[#261E19]">
                Use your location or enter a ZIP code to find nearby family law offices
              </h2>
              <p className="text-xs text-[#5C4E43]">
                Your location is only used in your browser to query nearby law practices and is never stored on our servers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#435C4D] hover:bg-[#354A3E] rounded-lg transition disabled:opacity-60"
            >
              {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
              <span>{isLocating ? 'Locating...' : 'Allow Location Access'}</span>
            </button>
            <button
              type="button"
              onClick={() => setLocationPromptDismissed(true)}
              className="px-3 py-2 text-xs font-medium text-[#5C4E43] hover:text-[#261E19] border border-[#E2DBD0] bg-white rounded-lg transition"
            >
              Enter ZIP Instead
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <section className="bg-white border border-[#E2DBD0] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* ZIP Code Form */}
          <form onSubmit={handleZipSearch} className="flex-1 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-[#8C7D73] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                placeholder="Enter ZIP code (e.g., 94102) or city..."
                aria-label="ZIP code or city"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF9F6] border border-[#E2DBD0] rounded-lg text-[#261E19] placeholder-[#8C7D73] focus:outline-none focus:ring-2 focus:ring-[#435C4D]/30 focus:border-[#435C4D]"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[#435C4D] hover:bg-[#354A3E] rounded-lg transition disabled:opacity-60"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Find Lawyers</span>
            </button>
          </form>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8C7D73] hidden sm:inline">or</span>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-[#261E19] bg-[#FAF9F6] hover:bg-[#F0EAE1] border border-[#E2DBD0] rounded-lg transition disabled:opacity-60 w-full sm:w-auto"
            >
              {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#435C4D]" /> : <Navigation className="w-3.5 h-3.5 text-[#435C4D]" />}
              <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
            </button>
          </div>
        </div>

        {/* Specialty & Radius Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#F0EAE1]">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCategory(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  category === opt.id
                    ? 'bg-[#435C4D] text-white'
                    : 'bg-[#FAF9F6] text-[#5C4E43] border border-[#E2DBD0] hover:bg-[#F0EAE1]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#5C4E43]">
            <span>Radius:</span>
            <select
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(Number(e.target.value))}
              aria-label="Search radius"
              className="bg-[#FAF9F6] border border-[#E2DBD0] rounded-lg px-2.5 py-1 text-xs text-[#261E19] focus:outline-none focus:border-[#435C4D]"
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r.miles} value={r.miles}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* API Key / Fallback Notice */}
      {usingFallbackMode && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Google Maps Preview Mode:</span>{' '}
            Add <code className="px-1 py-0.5 bg-amber-100 rounded font-mono text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code> to{' '}
            <code className="px-1 py-0.5 bg-amber-100 rounded font-mono text-[11px]">client/.env</code> (with Maps JavaScript, Places, and Geocoding APIs enabled) for live Google Maps pins and real-time Google Places directory results. Below is a preview with direct Google Maps links.
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-[#FDF8F6] border border-[#E2DBD0] rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-[#7e4d41]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Split View: Suggested Law Practices + Interactive Map */}
      {searchCenter ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Practice List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="text-xs font-medium text-[#5C4E43]">
                Showing <span className="text-[#261E19] font-semibold">{practices.length}</span> suggested practices near{' '}
                <span className="text-[#261E19] font-semibold">{locationLabel}</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(selectedCategoryObj.query)}/@${searchCenter.lat},${searchCenter.lng},12z`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#435C4D] hover:underline"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {isSearching ? (
                <div className="bg-white border border-[#E2DBD0] rounded-xl p-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-[#435C4D] animate-spin mx-auto" />
                  <p className="text-xs text-[#5C4E43]">Searching family law offices near {locationLabel}...</p>
                </div>
              ) : practices.length === 0 ? (
                <div className="bg-white border border-[#E2DBD0] rounded-xl p-6 text-center space-y-2">
                  <Building2 className="w-6 h-6 text-[#8C7D73] mx-auto" />
                  <p className="text-sm font-medium text-[#261E19]">No practices found in this radius</p>
                  <p className="text-xs text-[#5C4E43]">Try increasing your radius to 25 miles or switching to All Family Law.</p>
                </div>
              ) : (
                practices.map((practice) => {
                  const isSelected = selectedPracticeId === practice.id;
                  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    `${practice.name}, ${practice.address}`
                  )}`;

                  return (
                    <div
                      key={practice.id}
                      ref={(el) => {
                        cardRefs.current[practice.id] = el;
                      }}
                      onClick={() => selectPractice(practice, true)}
                      className={`cursor-pointer rounded-xl p-4 border transition ${
                        isSelected
                          ? 'bg-[#FAF9F6] border-[#435C4D] ring-1 ring-[#435C4D]/30 shadow-xs'
                          : 'bg-white border-[#E2DBD0] hover:border-[#8C7D73]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E6ECE6] text-[#435C4D]">
                            {practice.categoryLabel}
                          </span>
                          <h3 className="text-sm font-semibold text-[#261E19] leading-snug">
                            {practice.name}
                          </h3>
                        </div>
                        {practice.distanceMiles !== undefined && (
                          <span className="text-[11px] font-medium text-[#5C4E43] bg-[#F4EFEB] px-2 py-0.5 rounded-md shrink-0">
                            {practice.distanceMiles} mi
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#5C4E43] mt-1.5 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#8C7D73] shrink-0 mt-0.5" />
                        <span>{practice.address}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs">
                        {practice.rating && (
                          <span className="inline-flex items-center gap-1 text-[#261E19] font-medium">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{practice.rating}</span>
                            {practice.userRatingsTotal !== undefined && (
                              <span className="text-[#8C7D73] font-normal">({practice.userRatingsTotal})</span>
                            )}
                          </span>
                        )}
                        {practice.isOpenNow !== undefined && (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              practice.isOpenNow ? 'text-[#435C4D]' : 'text-[#8C7D73]'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{practice.isOpenNow ? 'Open now' : 'Closed now'}</span>
                          </span>
                        )}
                      </div>

                      {(practice.phone || practice.website) && (
                        <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-2.5 border-t border-[#F0EAE1] text-xs">
                          {practice.phone && (
                            <a
                              href={`tel:${practice.phone.replace(/[^\d+]/g, '')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[#435C4D] hover:underline font-medium"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{practice.phone}</span>
                            </a>
                          )}
                          {practice.website && (
                            <a
                              href={practice.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[#5C4E43] hover:text-[#261E19] hover:underline"
                            >
                              <Globe className="w-3 h-3" />
                              <span>Website</span>
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#435C4D] hover:bg-[#354A3E] text-white transition"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Directions</span>
                        </a>
                        {practice.googleMapsUrl && (
                          <a
                            href={practice.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-[#E2DBD0] text-[#5C4E43] hover:text-[#261E19] transition"
                          >
                            <span>View Listing</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Interactive Map */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <div className="bg-white border border-[#E2DBD0] rounded-xl overflow-hidden shadow-xs">
              {!usingFallbackMode ? (
                <div ref={mapContainerRef} className="w-full h-[500px] lg:h-[620px]" />
              ) : (
                <div className="relative w-full h-[500px] lg:h-[620px] bg-[#FAF9F6]">
                  <iframe
                    title="Area Map Preview"
                    src={osmEmbedUrl}
                    className="w-full h-full border-0"
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs border border-[#E2DBD0] rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#5C4E43]">
                      Showing map area for <strong className="text-[#261E19]">{locationLabel}</strong>
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(selectedCategoryObj.query)}/@${searchCenter.lat},${searchCenter.lng},12z`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[#435C4D] hover:underline shrink-0"
                    >
                      <span>Open Full Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty Initial State */
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#E6ECE6] text-[#435C4D] flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-base font-semibold text-[#261E19]">
              Search by ZIP code or share your location
            </h2>
            <p className="text-xs text-[#5C4E43] leading-relaxed">
              We&apos;ll show family law attorneys, divorce mediators, and local legal aid offices near you on an interactive map.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {['94102', '90210', '10001', '78701'].map((sampleZip) => (
              <button
                key={sampleZip}
                type="button"
                onClick={() => {
                  setZipInput(sampleZip);
                  searchNearbyPractices(
                    sampleZip === '94102'
                      ? { lat: 37.779, lng: -122.419 }
                      : sampleZip === '90210'
                      ? { lat: 34.0901, lng: -118.4065 }
                      : sampleZip === '10001'
                      ? { lat: 40.7506, lng: -73.9971 }
                      : { lat: 30.2672, lng: -97.7431 },
                    `ZIP ${sampleZip}`
                  );
                }}
                className="px-3 py-1.5 text-xs font-medium bg-[#FAF9F6] hover:bg-[#F0EAE1] border border-[#E2DBD0] rounded-lg text-[#5C4E43] transition"
              >
                Try ZIP {sampleZip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Consultation Preparation Tips */}
      <section className="bg-[#FAF9F6] border border-[#E2DBD0] rounded-xl p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#435C4D] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#261E19]">
              How to get the most out of a 15–30 minute consultation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#5C4E43]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#435C4D] shrink-0 mt-0.5" />
                <span>Ask whether they offer a free initial consult and how retainers &amp; payment plans work.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#435C4D] shrink-0 mt-0.5" />
                <span>Bring your Sparrow Discovery Brief so they can immediately see assets, Schedule B leads, and gaps.</span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#435C4D] shrink-0 mt-0.5" />
                <span>Ask about temporary support orders or attorney-fee contribution if your spouse controls household accounts.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
