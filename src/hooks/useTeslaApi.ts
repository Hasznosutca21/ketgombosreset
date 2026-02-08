import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TeslaVehicle {
  vin: string;
  display_name: string;
  state?: string;
}

interface TeslaVehicleData {
  vin: string;
  display_name: string;
  vehicle_state?: {
    odometer?: number;
    car_version?: string;
    locked?: boolean;
  };
  charge_state?: {
    battery_level?: number;
    battery_range?: number;
    charging_state?: string;
    charge_limit_soc?: number;
    time_to_full_charge?: number;
  };
  drive_state?: {
    latitude?: number;
    longitude?: number;
    speed?: number;
  };
  climate_state?: {
    inside_temp?: number;
    outside_temp?: number;
    is_climate_on?: boolean;
  };
}

interface UseTeslaApiReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  vehicles: TeslaVehicle[];
  vehicleData: TeslaVehicleData | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  listVehicles: () => Promise<void>;
  getVehicleData: (vin: string) => Promise<void>;
  wakeUp: (vin: string) => Promise<boolean>;
  sendCommand: (vin: string, command: string) => Promise<boolean>;
  checkConnection: () => Promise<void>;
}

export function useTeslaApi(): UseTeslaApiReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<TeslaVehicle[]>([]);
  const [vehicleData, setVehicleData] = useState<TeslaVehicleData | null>(null);

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }
    return `Bearer ${session.access_token}`;
  };

  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      const authorization = await getAuthHeader();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tesla-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorization,
          },
          body: JSON.stringify({ action: "status" }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
      }
    } catch (err) {
      console.error("Error checking Tesla connection:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const storedState = localStorage.getItem("tesla_oauth_state");

      if (code && state && storedState === state) {
        try {
          setIsLoading(true);
          setError(null);
          
          const authorization = await getAuthHeader();
          const redirectUri = `${window.location.origin}/profile`;

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tesla-auth`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authorization,
              },
              body: JSON.stringify({
                action: "exchange_code",
                code,
                redirect_uri: redirectUri,
              }),
            }
          );

          if (response.ok) {
            setIsConnected(true);
            // Clean up URL and localStorage
            localStorage.removeItem("tesla_oauth_state");
            window.history.replaceState({}, "", window.location.pathname);
          } else {
            const data = await response.json();
            setError(data.error || "Failed to connect Tesla account");
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to connect");
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, []);

  const connect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authorization = await getAuthHeader();
      const redirectUri = `${window.location.origin}/profile`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tesla-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorization,
          },
          body: JSON.stringify({
            action: "get_auth_url",
            redirect_uri: redirectUri,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Store state for verification
        localStorage.setItem("tesla_oauth_state", data.state);
        // Redirect to Tesla OAuth
        window.location.href = data.auth_url;
      } else {
        const data = await response.json();
        setError(data.error || "Failed to initiate Tesla login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authorization = await getAuthHeader();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tesla-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorization,
          },
          body: JSON.stringify({ action: "disconnect" }),
        }
      );

      if (response.ok) {
        setIsConnected(false);
        setVehicles([]);
        setVehicleData(null);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to disconnect");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setIsLoading(false);
    }
  };

  const listVehicles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authorization = await getAuthHeader();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tesla-api`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorization,
          },
          body: JSON.stringify({ action: "list_vehicles" }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to list vehicles");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to list vehicles");
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleData = async (vin: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authorization = await getAuthHeader();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tesla-api`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorization,
          },
          body: JSON.stringify({ action: "vehicle_data", vin }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVehicleData(data.vehicle);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to get vehicle data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get vehicle data");
    } finally {
      setIsLoading(false);
    }
  };

  const wakeUp = async (vin: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authorization = await getAuthHeader();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tesla-api`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorization,
          },
          body: JSON.stringify({ action: "wake_up", vin }),
        }
      );

      if (response.ok) {
        return true;
      } else {
        const data = await response.json();
        setError(data.error || "Failed to wake up vehicle");
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to wake up vehicle");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendCommand = async (vin: string, command: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authorization = await getAuthHeader();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tesla-api`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorization,
          },
          body: JSON.stringify({ action: "command", vin, command }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.success;
      } else {
        const data = await response.json();
        setError(data.error || "Command failed");
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Command failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    isLoading,
    error,
    vehicles,
    vehicleData,
    connect,
    disconnect,
    listVehicles,
    getVehicleData,
    wakeUp,
    sendCommand,
    checkConnection,
  };
}
