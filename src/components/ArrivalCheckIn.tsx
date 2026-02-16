import { useState, useEffect, useCallback } from "react";
import { MapPin, Navigation, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

// TESLAND Nagytarcsa coordinates
const SERVICE_LOCATIONS: Record<string, { lat: number; lng: number; name: string }> = {
  default: { lat: 47.5339, lng: 19.1864, name: "TESLAND Nagytarcsa" },
};

const GEOFENCE_RADIUS_METERS = 300;

interface ArrivalCheckInProps {
  reservationId: number;
  locationName?: string;
  compact?: boolean;
  onArrival?: () => void;
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ArrivalCheckIn = ({ reservationId, locationName, compact, onArrival }: ArrivalCheckInProps) => {
  const { language } = useLanguage();
  const [isNearby, setIsNearby] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [watchingLocation, setWatchingLocation] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  const serviceLocation = SERVICE_LOCATIONS.default;

  const notifyArrival = useCallback(async () => {
    if (checkedIn) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error(
          language === "hu" ? "Kérjük, jelentkezzen be." : "Please sign in first."
        );
        setLoading(false);
        return;
      }
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const res = await fetch(`${supabaseUrl}/functions/v1/notify-customer-arrival`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          arrival_type: isNearby ? "geofence" : "manual",
          language,
        }),
      });

      if (res.ok) {
        setCheckedIn(true);
        toast.success(
          language === "hu"
            ? "Érkezés jelezve! A szerviz értesítve lett."
            : "Arrival notified! The service has been informed."
        );
        onArrival?.();
      } else {
        toast.error(
          language === "hu" ? "Nem sikerült jelezni az érkezést." : "Failed to notify arrival."
        );
      }
    } catch {
      toast.error(
        language === "hu" ? "Hiba történt." : "An error occurred."
      );
    } finally {
      setLoading(false);
    }
  }, [reservationId, isNearby, checkedIn, language, onArrival]);

  // Geofencing: watch position
  useEffect(() => {
    let watchId: number | null = null;

    const startWatching = () => {
      if (!("geolocation" in navigator)) return;

      setWatchingLocation(true);
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const d = getDistanceMeters(
            pos.coords.latitude,
            pos.coords.longitude,
            serviceLocation.lat,
            serviceLocation.lng
          );
          setDistance(Math.round(d));
          if (d <= GEOFENCE_RADIUS_METERS && !checkedIn) {
            setIsNearby(true);
          }
        },
        () => {
          setWatchingLocation(false);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    };

    // Only auto-watch on native platforms
    if (Capacitor.isNativePlatform()) {
      startWatching();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [checkedIn, serviceLocation]);

  // Auto check-in when geofence triggered
  useEffect(() => {
    if (isNearby && !checkedIn) {
      notifyArrival();
    }
  }, [isNearby, checkedIn, notifyArrival]);

  const handleManualCheckIn = () => {
    // On web, try to get location first for context
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const d = getDistanceMeters(
            pos.coords.latitude,
            pos.coords.longitude,
            serviceLocation.lat,
            serviceLocation.lng
          );
          setDistance(Math.round(d));
          if (d <= GEOFENCE_RADIUS_METERS) {
            setIsNearby(true);
          }
          notifyArrival();
        },
        () => {
          // No location available, still allow manual check-in
          notifyArrival();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      notifyArrival();
    }
  };

  if (checkedIn) {
    return (
      <div className={`flex items-center gap-2 ${compact ? "" : "p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"}`}>
        <Check className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-700 dark:text-green-400">
          {language === "hu" ? "Érkezés jelezve ✓" : "Arrival notified ✓"}
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <Button
        size="sm"
        variant="default"
        onClick={handleManualCheckIn}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          <Navigation className="h-3.5 w-3.5 mr-1" />
        )}
        {language === "hu" ? "Megérkeztem" : "I've arrived"}
      </Button>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {language === "hu" ? "Érkezés jelzése" : "Check-in"}
          </span>
        </div>
        {distance !== null && (
          <Badge variant="outline" className="text-xs">
            {distance < 1000
              ? `${distance}m`
              : `${(distance / 1000).toFixed(1)}km`}
          </Badge>
        )}
      </div>

      {isNearby && !checkedIn && (
        <p className="text-xs text-green-600 dark:text-green-400">
          {language === "hu"
            ? "A közelben vagy! Automatikus értesítés..."
            : "You're nearby! Auto-notifying..."}
        </p>
      )}

      <Button
        onClick={handleManualCheckIn}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Navigation className="h-4 w-4 mr-2" />
        )}
        {language === "hu" ? "Megérkeztem" : "I've arrived"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        {language === "hu"
          ? "Nyomd meg, ha megérkeztél a szervizbe"
          : "Press when you arrive at the service center"}
      </p>
    </div>
  );
};

export default ArrivalCheckIn;
