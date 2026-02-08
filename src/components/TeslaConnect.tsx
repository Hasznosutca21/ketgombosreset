import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTeslaApi } from "@/hooks/useTeslaApi";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import {
  Car,
  Battery,
  Thermometer,
  Lock,
  Unlock,
  Zap,
  RefreshCw,
  Loader2,
  AlertCircle,
  MapPin,
  Gauge,
  Sun,
  Snowflake,
  PlugZap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function TeslaConnect() {
  const { language } = useLanguage();
  const {
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
  } = useTeslaApi();

  const [selectedVin, setSelectedVin] = useState<string | null>(null);
  const [commandLoading, setCommandLoading] = useState<string | null>(null);

  const t = {
    hu: {
      title: "Tesla Fiók",
      connect: "Tesla Fiók Összekapcsolása",
      disconnect: "Lecsatlakoztatás",
      connected: "Összekapcsolva",
      notConnected: "Nincs összekapcsolva",
      loadVehicles: "Járművek Betöltése",
      refreshData: "Adatok Frissítése",
      wakeUp: "Ébresztés",
      lock: "Zárás",
      unlock: "Nyitás",
      flashLights: "Villogtatás",
      honk: "Dudálás",
      climateOn: "Klíma Be",
      climateOff: "Klíma Ki",
      chargeStart: "Töltés Indítása",
      chargeStop: "Töltés Leállítása",
      openChargePort: "Töltőport Nyitás",
      closeChargePort: "Töltőport Zárás",
      battery: "Akkumulátor",
      range: "Hatótáv",
      charging: "Töltés",
      temperature: "Hőmérséklet",
      inside: "Belső",
      outside: "Külső",
      odometer: "Kilométeróra",
      software: "Szoftver",
      locked: "Zárolva",
      unlocked: "Nyitva",
      climate: "Klíma",
      on: "Bekapcsolva",
      off: "Kikapcsolva",
      commandSuccess: "Parancs sikeresen végrehajtva",
      commandFailed: "Parancs végrehajtása sikertelen",
      noVehicles: "Nincs elérhető jármű",
      selectVehicle: "Válassz járművet",
    },
    en: {
      title: "Tesla Account",
      connect: "Connect Tesla Account",
      disconnect: "Disconnect",
      connected: "Connected",
      notConnected: "Not connected",
      loadVehicles: "Load Vehicles",
      refreshData: "Refresh Data",
      wakeUp: "Wake Up",
      lock: "Lock",
      unlock: "Unlock",
      flashLights: "Flash Lights",
      honk: "Honk",
      climateOn: "Climate On",
      climateOff: "Climate Off",
      chargeStart: "Start Charging",
      chargeStop: "Stop Charging",
      openChargePort: "Open Charge Port",
      closeChargePort: "Close Charge Port",
      battery: "Battery",
      range: "Range",
      charging: "Charging",
      temperature: "Temperature",
      inside: "Inside",
      outside: "Outside",
      odometer: "Odometer",
      software: "Software",
      locked: "Locked",
      unlocked: "Unlocked",
      climate: "Climate",
      on: "On",
      off: "Off",
      commandSuccess: "Command executed successfully",
      commandFailed: "Command execution failed",
      noVehicles: "No vehicles available",
      selectVehicle: "Select a vehicle",
    },
  }[language];

  const handleCommand = async (command: string) => {
    if (!selectedVin) return;
    setCommandLoading(command);
    const success = await sendCommand(selectedVin, command);
    if (success) {
      toast.success(t.commandSuccess);
    } else {
      toast.error(t.commandFailed);
    }
    setCommandLoading(null);
  };

  const handleWakeUp = async () => {
    if (!selectedVin) return;
    setCommandLoading("wake_up");
    const success = await wakeUp(selectedVin);
    if (success) {
      toast.success(t.commandSuccess);
      // Refresh data after wake up
      setTimeout(() => getVehicleData(selectedVin), 2000);
    } else {
      toast.error(t.commandFailed);
    }
    setCommandLoading(null);
  };

  const handleSelectVehicle = async (vin: string) => {
    setSelectedVin(vin);
    await getVehicleData(vin);
  };

  if (!isConnected) {
    return (
      <Card className="tesla-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t.notConnected}</Badge>
          </div>
          <Button
            onClick={connect}
            disabled={isLoading}
            className="w-full"
            variant="tesla"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            {t.connect}
          </Button>
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="tesla-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            {t.title}
          </CardTitle>
          <Badge variant="default" className="bg-green-600">
            {t.connected}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vehicle selector */}
        {vehicles.length === 0 ? (
          <Button
            onClick={listVehicles}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {t.loadVehicles}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t.selectVehicle}</p>
            <div className="grid grid-cols-1 gap-2">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.vin}
                  onClick={() => handleSelectVehicle(vehicle.vin)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                    selectedVin === vehicle.vin
                      ? "border-foreground bg-muted"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  <Car className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{vehicle.display_name}</div>
                    <div className="text-xs text-muted-foreground">{vehicle.vin}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vehicle data */}
        {vehicleData && selectedVin && (
          <>
            <Separator />
            
            {/* Status cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Battery */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Battery className="w-3 h-3" />
                  {t.battery}
                </div>
                <div className="text-2xl font-light">
                  {vehicleData.charge_state?.battery_level ?? "--"}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round((vehicleData.charge_state?.battery_range ?? 0) * 1.609)} km {t.range}
                </div>
              </div>

              {/* Charging */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <PlugZap className="w-3 h-3" />
                  {t.charging}
                </div>
                <div className="text-lg font-light">
                  {vehicleData.charge_state?.charging_state ?? "--"}
                </div>
                {vehicleData.charge_state?.time_to_full_charge ? (
                  <div className="text-xs text-muted-foreground">
                    {Math.round(vehicleData.charge_state.time_to_full_charge * 60)} min
                  </div>
                ) : null}
              </div>

              {/* Temperature */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Thermometer className="w-3 h-3" />
                  {t.temperature}
                </div>
                <div className="text-lg font-light">
                  {vehicleData.climate_state?.inside_temp ?? "--"}°C
                </div>
                <div className="text-xs text-muted-foreground">
                  {t.outside}: {vehicleData.climate_state?.outside_temp ?? "--"}°C
                </div>
              </div>

              {/* Lock status */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  {vehicleData.vehicle_state?.locked ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <Unlock className="w-3 h-3" />
                  )}
                  Status
                </div>
                <div className="text-lg font-light">
                  {vehicleData.vehicle_state?.locked ? t.locked : t.unlocked}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t.climate}: {vehicleData.climate_state?.is_climate_on ? t.on : t.off}
                </div>
              </div>
            </div>

            {/* Odometer */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Gauge className="w-4 h-4" />
                {t.odometer}:
              </div>
              <span>
                {vehicleData.vehicle_state?.odometer
                  ? `${Math.round(vehicleData.vehicle_state.odometer * 1.609).toLocaleString()} km`
                  : "--"}
              </span>
            </div>

            <Separator />

            {/* Commands */}
            <div className="space-y-3">
              <Button
                onClick={handleWakeUp}
                disabled={isLoading || commandLoading !== null}
                variant="outline"
                className="w-full"
              >
                {commandLoading === "wake_up" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                {t.wakeUp}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleCommand("door_lock")}
                  disabled={isLoading || commandLoading !== null}
                  variant="outline"
                  size="sm"
                >
                  {commandLoading === "door_lock" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  {t.lock}
                </Button>
                <Button
                  onClick={() => handleCommand("door_unlock")}
                  disabled={isLoading || commandLoading !== null}
                  variant="outline"
                  size="sm"
                >
                  {commandLoading === "door_unlock" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4 mr-2" />
                  )}
                  {t.unlock}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleCommand("climate_on")}
                  disabled={isLoading || commandLoading !== null}
                  variant="outline"
                  size="sm"
                >
                  {commandLoading === "climate_on" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sun className="w-4 h-4 mr-2" />
                  )}
                  {t.climateOn}
                </Button>
                <Button
                  onClick={() => handleCommand("climate_off")}
                  disabled={isLoading || commandLoading !== null}
                  variant="outline"
                  size="sm"
                >
                  {commandLoading === "climate_off" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Snowflake className="w-4 h-4 mr-2" />
                  )}
                  {t.climateOff}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleCommand("flash_lights")}
                  disabled={isLoading || commandLoading !== null}
                  variant="outline"
                  size="sm"
                >
                  {commandLoading === "flash_lights" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  {t.flashLights}
                </Button>
                <Button
                  onClick={() => handleCommand("honk_horn")}
                  disabled={isLoading || commandLoading !== null}
                  variant="outline"
                  size="sm"
                >
                  {commandLoading === "honk_horn" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {t.honk}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleCommand("charge_start")}
                  disabled={isLoading || commandLoading !== null}
                  variant="outline"
                  size="sm"
                >
                  {commandLoading === "charge_start" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <PlugZap className="w-4 h-4 mr-2" />
                  )}
                  {t.chargeStart}
                </Button>
                <Button
                  onClick={() => handleCommand("charge_stop")}
                  disabled={isLoading || commandLoading !== null}
                  variant="outline"
                  size="sm"
                >
                  {commandLoading === "charge_stop" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {t.chargeStop}
                </Button>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Refresh and Disconnect */}
        <div className="flex gap-2">
          {selectedVin && (
            <Button
              onClick={() => getVehicleData(selectedVin)}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {t.refreshData}
            </Button>
          )}
          <Button
            onClick={disconnect}
            disabled={isLoading}
            variant="outline"
            className="flex-1 text-destructive hover:text-destructive"
          >
            {t.disconnect}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
