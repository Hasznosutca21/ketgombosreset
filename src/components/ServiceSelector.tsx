import { useState, useMemo } from "react";
import {
  Wrench, 
  Zap, 
  Settings, 
  Disc, 
  Shield, 
  Thermometer, 
  Fan, 
  Flame,
  Lightbulb,
  MonitorPlay,
  CircleDot,
  Info,
  Donut,
  ArrowLeft,
  ChevronDown,
  DoorOpen,
  DoorClosed,
  Package,
  Battery,
  Gamepad2,
  Circle,
  Minus,
  Navigation,
  LayoutDashboard,
  Plug,
  LucideIcon
} from "lucide-react";
import s3xyIcon from "@/assets/s3xy-icon.png";
import s3xyCommanderImage from "@/assets/products/s3xy-commander.jpg";
import s3xyDashImage from "@/assets/products/s3xy-dash.webp";
import s3xyDashCommanderImage from "@/assets/products/s3xy-dash-commander.webp";
import s3xyKnobImage from "@/assets/products/s3xy-knob.webp";
import s3xyKnobCommanderImage from "@/assets/products/s3xy-knob-commander.webp";
import s3xyStripImage from "@/assets/products/s3xy-strip.webp";
import s3xyStalkLeftImage from "@/assets/products/s3xy-stalk-left.webp";
import s3xyStalkRightImage from "@/assets/products/s3xy-stalk-right.webp";
import lowVoltageBatteryImage from "@/assets/products/low-voltage-battery.jpg";
import chargePortRepairImage from "@/assets/products/charge-port-repair.webp";
import seatVentWhiteImage from "@/assets/products/seat-ventilation-white.jpg";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DoorHandleSelector from "@/components/DoorHandleSelector";

interface ServiceSelectorProps {
  onSelect: (service: string, extras?: { doorHandles?: string[]; trunkLightNotWorking?: boolean; trunkNotOpening?: boolean; s3xyProducts?: string[] }) => void;
  selected: string | null;
  selectedVehicle?: string | null;
  onBack?: () => void;
  onNext?: () => void;
}

// Categories with their services
// vehicleRestriction: array of vehicle IDs that can use this service (empty = all vehicles)
// yearRestriction: { from, to } - optional year range restriction
interface ServiceDef {
  id: string;
  icon: typeof Wrench;
  vehicleRestriction: string[];
  yearRestriction?: { from: number; to: number };
}

const categories: { id: string; icon: typeof Wrench; services: ServiceDef[]; vehicleRestriction?: string[] }[] = [
  {
    id: "maintenance",
    icon: Wrench,
    services: [
      { id: "maintenance", icon: Wrench, vehicleRestriction: [] },
      { id: "battery", icon: Zap, vehicleRestriction: [] },
      { id: "brake", icon: Disc, vehicleRestriction: [] },
    ],
  },
  {
    id: "hvac",
    icon: Thermometer,
    services: [
      { id: "ac", icon: Fan, vehicleRestriction: [] },
      { id: "heatpump", icon: Thermometer, vehicleRestriction: ["model-3"], yearRestriction: { from: 2020, to: 2026 } },
      { id: "heating", icon: Flame, vehicleRestriction: ["model-3", "model-y"] },
      { id: "hepa", icon: Fan, vehicleRestriction: ["model-y"] },
      { id: "ptcheater", icon: Zap, vehicleRestriction: ["model-3"], yearRestriction: { from: 2018, to: 2020 } },
    ],
  },
  {
    id: "extras",
    icon: Settings,
    services: [
      { id: "software", icon: Donut, vehicleRestriction: ["model-3"] },
      { id: "autopilot", icon: Lightbulb, vehicleRestriction: ["model-3"] },
      { id: "multimedia", icon: MonitorPlay, vehicleRestriction: [] },
    ],
  },
  {
    id: "batteryCategory",
    icon: Battery,
    services: [
      { id: "lowvoltagebattery", icon: Battery, vehicleRestriction: ["model-3", "model-y"] },
    ],
    vehicleRestriction: ["model-3", "model-y"],
  },
  {
    id: "other",
    icon: Shield,
    services: [
      { id: "doorhandle", icon: DoorOpen, vehicleRestriction: ["model-3"] },
      { id: "body", icon: Package, vehicleRestriction: ["model-3"] },
      { id: "canbus", icon: Settings, vehicleRestriction: ["model-y"] },
      { id: "warranty", icon: Shield, vehicleRestriction: ["model-3"] },
      { id: "tires", icon: CircleDot, vehicleRestriction: [] },
    ],
  },
  {
    id: "charging",
    icon: Plug,
    services: [
      { id: "chargeport_repair", icon: Plug, vehicleRestriction: [] },
      { id: "home_charger_install", icon: Zap, vehicleRestriction: [] },
      { id: "charging_diagnostics", icon: Settings, vehicleRestriction: [] },
    ],
  },
  {
    id: "wrapping",
    icon: Shield,
    services: [
      { id: "ppf", icon: Shield, vehicleRestriction: [] },
    ],
  },
  {
    id: "accessories",
    icon: Package,
    services: [
      { id: "s3xy_products", icon: Package, vehicleRestriction: [] },
      { id: "softclose", icon: DoorClosed, vehicleRestriction: ["model-3", "model-y"] },
      { id: "seat_ventilation", icon: Fan, vehicleRestriction: ["model-3", "model-y"], yearRestriction: { from: 2017, to: 2023 } },
      { id: "performance_seat_upgrade", icon: Fan, vehicleRestriction: ["model-3", "model-y"], yearRestriction: { from: 2024, to: 2026 } },
    ],
  },
];

const ServiceSelector = ({ onSelect, selected, selectedVehicle, onBack, onNext }: ServiceSelectorProps) => {
  const { t, language } = useLanguage();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [doorHandleDialogOpen, setDoorHandleDialogOpen] = useState(false);
  const [selectedDoorHandles, setSelectedDoorHandles] = useState<string[]>([]);
  const [trunkDialogOpen, setTrunkDialogOpen] = useState(false);
  const [trunkLightNotWorking, setTrunkLightNotWorking] = useState(false);
  const [trunkNotOpening, setTrunkNotOpening] = useState(false);
  const [s3xyDialogOpen, setS3xyDialogOpen] = useState(false);
  const [selectedS3xyProducts, setSelectedS3xyProducts] = useState<string[]>([]);
  const [selectedS3xyVehicleVariant, setSelectedS3xyVehicleVariant] = useState<string>("");
  const [selectedStripVariant, setSelectedStripVariant] = useState<string>("");
  const [softcloseDialogOpen, setSoftcloseDialogOpen] = useState(false);
  const [selectedSoftcloseOption, setSelectedSoftcloseOption] = useState<string>("");
  const [ppfDialogOpen, setPpfDialogOpen] = useState(false);
  const [selectedPpfVariant, setSelectedPpfVariant] = useState<string>("");
  const [selectedPpfCoverage, setSelectedPpfCoverage] = useState<string>("");
  const [seatVentDialogOpen, setSeatVentDialogOpen] = useState(false);
  const [selectedSeatVentVariant, setSelectedSeatVentVariant] = useState<string>("");
  const [selectedSeatVentColor, setSelectedSeatVentColor] = useState<string>("");
  const [commanderInfoOpen, setCommanderInfoOpen] = useState(false);
  const [dashInfoOpen, setDashInfoOpen] = useState(false);
  const [knobInfoOpen, setKnobInfoOpen] = useState(false);
  const [knobCommanderInfoOpen, setKnobCommanderInfoOpen] = useState(false);
  const [stripInfoOpen, setStripInfoOpen] = useState(false);
  const [stalkInfoOpen, setStalkInfoOpen] = useState(false);
  const [selectedStalkSide, setSelectedStalkSide] = useState<string>("");
  const [dashCommanderInfoOpen, setDashCommanderInfoOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<{
    title: string;
    details: string;
    duration: string;
    serviceId?: string;
  } | null>(null);

  // Find which category contains the selected service
  const getDefaultOpenCategory = () => {
    if (!selected) return ["maintenance"]; // Default open first category
    for (const category of categories) {
      if (category.services.some(s => s.id === selected)) {
        return [category.id];
      }
    }
    return ["maintenance"];
  };

  const handleInfoClick = (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation();
    const serviceData = t.services[serviceId as keyof typeof t.services] as {
      title: string;
      description: string;
      duration: string;
      details?: string;
    };
    if (serviceData.details) {
      setSelectedDetails({
        title: serviceData.title,
        details: serviceData.details,
        duration: serviceData.duration,
        serviceId,
      });
      setDetailsOpen(true);
    }
  };

  // Parse vehicle ID and year from selectedVehicle (format: "model-3-2022")
  const parseVehicleSelection = (vehicle: string | null | undefined) => {
    if (!vehicle) return { vehicleId: null, year: null };
    const parts = vehicle.split('-');
    if (parts.length >= 3) {
      const year = parseInt(parts[parts.length - 1], 10);
      const vehicleId = parts.slice(0, -1).join('-');
      return { vehicleId, year: isNaN(year) ? null : year };
    }
    return { vehicleId: vehicle, year: null };
  };

  // Filter categories to only show services available for the selected vehicle
  const filteredCategories = useMemo(() => {
    const { vehicleId, year } = parseVehicleSelection(selectedVehicle);
    
    return categories.map(category => {
      // Check category-level vehicle restriction
      if (category.vehicleRestriction && category.vehicleRestriction.length > 0) {
        if (!vehicleId || !category.vehicleRestriction.includes(vehicleId)) {
          return { ...category, services: [] };
        }
      }
      
      return {
        ...category,
        services: category.services.filter(service => {
          // Check vehicle restriction
          if (service.vehicleRestriction.length > 0) {
            if (!vehicleId || !service.vehicleRestriction.includes(vehicleId)) {
              return false;
            }
          }
          
          // Check year restriction
          if (service.yearRestriction && year) {
            if (year < service.yearRestriction.from || year > service.yearRestriction.to) {
              return false;
            }
          }
          
          return true;
        })
      };
    }).filter(category => category.services.length > 0);
  }, [selectedVehicle]);

  return (
    <div className="animate-fade-in">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.back}
        </Button>
      )}
      
      <h2 className="text-2xl md:text-4xl font-extralight tracking-tight mb-2">{t.selectService}</h2>
      <p className="text-muted-foreground font-light mb-8">{t.chooseServiceType}</p>

      <Accordion 
        type="multiple" 
        defaultValue={getDefaultOpenCategory()}
        className="space-y-3"
      >
        {filteredCategories.map((category) => {
          const categoryData = t.serviceCategories[category.id as keyof typeof t.serviceCategories];
          const hasSelectedService = category.services.some(s => s.id === selected);
          const CategoryIcon = category.icon;
          
          return (
            <AccordionItem 
              key={category.id} 
              value={category.id}
              className={cn(
                "tesla-card border overflow-hidden",
                hasSelectedService && "border-foreground"
              )}
            >
              <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-muted/50 transition-colors [&[data-state=open]>div>.chevron]:rotate-180">
                <div className="flex items-center gap-4 w-full">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    hasSelectedService ? "bg-foreground text-background" : "bg-muted"
                  )}>
                    {category.id === 'accessories' ? (
                      <img src={s3xyIcon} alt="S3XY" className="w-6 h-6 object-contain dark:invert-0 invert" />
                    ) : (
                      <CategoryIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-medium">{categoryData.title}</h3>
                    <p className="text-sm text-muted-foreground font-light">{categoryData.description}</p>
                  </div>
                  <ChevronDown className="chevron w-5 h-5 text-muted-foreground transition-transform duration-200" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {category.services.map((service) => {
                    const Icon = service.icon;
                    const isSelected = selected === service.id;
                    const serviceData = t.services[service.id as keyof typeof t.services] as {
                      title: string;
                      description: string;
                      duration: string;
                      details?: string;
                      price?: string;
                    };
                    const hasDetails = !!serviceData.details;
                    const hasPrice = !!serviceData.price;

                    return (
                      <div key={service.id} className="relative">
                        <button
                          onClick={() => {
                            if (isSelected) return; // don't re-select
                            if (service.id === 'doorhandle') {
                              setDoorHandleDialogOpen(true);
                            } else if (service.id === 'body') {
                              setTrunkDialogOpen(true);
                            } else if (service.id === 's3xy_products') {
                              setS3xyDialogOpen(true);
                            } else if (service.id === 'softclose') {
                              setSoftcloseDialogOpen(true);
                            } else if (service.id === 'ppf') {
                              setPpfDialogOpen(true);
                            } else if (service.id === 'seat_ventilation') {
                              setSeatVentDialogOpen(true);
                            } else {
                              onSelect(service.id);
                            }
                          }}
                          className={cn(
                            "w-full p-5 text-left rounded-lg transition-all duration-200 border relative",
                            isSelected 
                              ? "bg-primary/10 border-primary ring-2 ring-primary/20" 
                              : "bg-muted/30 border-border hover:border-foreground/30 hover:bg-muted/50"
                          )}
                        >
                          {hasDetails && (
                            <div
                              onClick={(e) => handleInfoClick(e, service.id)}
                              className={cn(
                                "absolute top-3 right-3 p-1.5 rounded-full transition-colors cursor-pointer",
                                isSelected 
                                  ? "bg-primary/10 hover:bg-primary/20 text-primary" 
                                  : "bg-muted hover:bg-foreground/10"
                              )}
                            >
                              <Info className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex flex-col items-center text-center gap-3">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                                isSelected ? "bg-primary/15 text-primary" : "bg-muted"
                              )}
                            >
                              {service.id === 's3xy_products' ? (
                                <img src={s3xyIcon} alt="S3XY" className="w-6 h-6 object-contain dark:invert-0 invert" />
                              ) : (
                                <Icon className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm mb-1">{serviceData.title}</h4>
                              <p className={cn(
                                "text-xs mb-2 line-clamp-2",
                                isSelected ? "text-muted-foreground" : "text-muted-foreground"
                              )}>
                                {serviceData.description}
                              </p>
                              <div className="flex flex-col gap-0.5">
                                <div className="text-xs text-muted-foreground">
                                  {t.estTime}: {serviceData.duration}
                                </div>
                                {hasPrice && (
                                  <div className="text-sm font-medium mt-1">
                                    {serviceData.price}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect("");
                            }}
                            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-muted border border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors flex items-center justify-center shadow-sm z-10"
                            title={language === 'hu' ? 'Visszavonás' : 'Undo'}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium">{selectedDetails?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDetails?.serviceId === 'lowvoltagebattery' && (
              <div className="rounded-lg overflow-hidden">
                <img src={lowVoltageBatteryImage} alt="12V akkumulátor" className="w-full h-48 object-contain bg-muted/30" />
              </div>
            )}
            {selectedDetails?.serviceId === 'chargeport_repair' && (
              <div className="rounded-lg overflow-hidden">
                <img src={chargePortRepairImage} alt="Töltőport javítás - CP_A163" className="w-full h-48 object-cover bg-muted/30" />
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {t.estTime}: {selectedDetails?.duration}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {selectedDetails?.details?.split('\n').map((line, i) => (
                <p key={i} className={cn(
                  "text-sm leading-relaxed",
                  line.startsWith('•') && "ml-2"
                )}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Door Handle Selector Dialog */}
      <Dialog open={doorHandleDialogOpen} onOpenChange={setDoorHandleDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <DoorOpen className="w-5 h-5" />
              {language === "hu" ? "Kilincs csere" : "Door Handle Replacement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === "hu" 
                ? "Jelölje be, melyik kilincs(ek) sérültek és cserére szorulnak."
                : "Select which door handle(s) are damaged and need replacement."}
            </p>
            
            <DoorHandleSelector
              value={selectedDoorHandles}
              onChange={setSelectedDoorHandles}
            />

            <Button 
              variant="tesla" 
              className="w-full" 
              disabled={selectedDoorHandles.length === 0}
              onClick={() => {
                onSelect('doorhandle', { doorHandles: selectedDoorHandles });
                setDoorHandleDialogOpen(false);
              }}
            >
              {language === "hu" ? "Tovább a foglaláshoz" : "Continue to booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trunk Lid Issue Dialog */}
      <Dialog open={trunkDialogOpen} onOpenChange={(open) => {
        setTrunkDialogOpen(open);
        if (!open) {
          setTrunkLightNotWorking(false);
          setTrunkNotOpening(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <Package className="w-5 h-5" />
              {language === "hu" ? "Hátsó csomagtérajtó probléma" : "Rear Trunk Lid Issue"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {language === "hu" 
                ? "A kábelköteg szakadása különböző tüneteket okozhat. Kérjük jelölje be a fennálló problémákat."
                : "Cable harness breakage can cause various symptoms. Please select the issues you're experiencing."}
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/30 border border-border">
                <Checkbox 
                  id="trunk-light" 
                  checked={trunkLightNotWorking}
                  onCheckedChange={(checked) => setTrunkLightNotWorking(checked === true)}
                />
                <label 
                  htmlFor="trunk-light" 
                  className="text-sm font-medium leading-none cursor-pointer select-none"
                >
                  {language === "hu" ? "Nem világít a lámpa" : "Light is not working"}
                </label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/30 border border-border">
                <Checkbox 
                  id="trunk-not-opening" 
                  checked={trunkNotOpening}
                  onCheckedChange={(checked) => setTrunkNotOpening(checked === true)}
                />
                <label 
                  htmlFor="trunk-not-opening" 
                  className="text-sm font-medium leading-none cursor-pointer select-none"
                >
                  {language === "hu" ? "Nem nyílik a csomagtérajtó" : "Trunk lid does not open"}
                </label>
              </div>
            </div>

            <Button 
              variant="tesla" 
              className="w-full" 
              onClick={() => {
                onSelect('body', { trunkLightNotWorking, trunkNotOpening });
                setTrunkDialogOpen(false);
              }}
            >
              {language === "hu" ? "Tovább a foglaláshoz" : "Continue to booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Products Dialog */}
      <Dialog open={s3xyDialogOpen} onOpenChange={(open) => {
        setS3xyDialogOpen(open);
        if (!open) {
          setSelectedS3xyProducts([]);
          setSelectedS3xyVehicleVariant("");
          setSelectedStripVariant("");
          setSelectedSoftcloseOption("");
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <Package className="w-5 h-5" />
              {language === "hu" ? "S3XY termékek" : "S3XY Products"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === "hu" 
                ? "Válaszd ki a beszerelni kívánt termékeket."
                : "Select the products you want to install."}
            </p>
            <p className="text-xs text-muted-foreground italic">
              {language === "hu" 
                ? "Az árak a beszerelés díját is tartalmazzák."
                : "Prices include installation."}
            </p>
            
            {(() => {
              const { vehicleId } = parseVehicleSelection(selectedVehicle);
              const isModelSX = vehicleId === 'model-s' || vehicleId === 'model-x';
              
              return (
                <>
                  {isModelSX && (
                    <div className="p-3 rounded-lg bg-accent/50 border border-accent mb-4">
                      <p className="text-sm text-muted-foreground">
                        {language === "hu" 
                          ? "Model S és X esetében a Commander kizárólag Palladium típusokhoz (2021+) érhető el."
                          : "For Model S and X, Commander is only available for Palladium versions (2021+)."}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {[
                      { id: "commander", hu: "S3XY Commander", en: "S3XY Commander", icon: Gamepad2, price: "bruttó 89 900 Ft", availableForSX: true, hasInfo: true, infoTarget: "commander" },
                      { id: "knob", hu: "S3XY Knob", en: "S3XY Knob", icon: Circle, price: "bruttó 89 900 Ft", availableForSX: false, hasInfo: true, infoTarget: "knob" },
                      { id: "knob_commander", hu: "S3XY Knob + Commander", en: "S3XY Knob + Commander", icon: Package, price: "bruttó 145 900 Ft", availableForSX: false, hasInfo: true, infoTarget: "knob_commander" },
                      { id: "strip", hu: "S3XY Strip", en: "S3XY Strip", icon: Minus, price: "bruttó 59 900 Ft", availableForSX: false, hasInfo: true, infoTarget: "strip" },
                      { id: "stalk", hu: "S3XY Stalk", en: "S3XY Stalk", icon: Navigation, price: "bruttó 79 900 Ft", availableForSX: false, hasInfo: true, infoTarget: "stalk" },
                      { id: "dash", hu: "S3XY Dash", en: "S3XY Dash", icon: LayoutDashboard, price: "bruttó 169 900 Ft", availableForSX: false, hasInfo: true, infoTarget: "dash" },
                      { id: "dash_commander", hu: "S3XY Dash + Commander", en: "S3XY Dash + Commander", icon: Package, price: "bruttó 204 990 Ft", availableForSX: false, hasInfo: true, infoTarget: "dash_commander" },
                    ].filter(product => {
                      // For Model S/X: only Commander is available
                      if (isModelSX) {
                        return product.availableForSX;
                      }
                      return true;
                    }).map((product) => {
                      const ProductIcon = product.icon;
                      const isChecked = selectedS3xyProducts.includes(product.id);
                      return (
                        <div key={product.id} className="space-y-2">
                          <div 
                            className="flex items-center space-x-3 p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox 
                              id={`s3xy-${product.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedS3xyProducts([...selectedS3xyProducts, product.id]);
                                } else {
                                  setSelectedS3xyProducts(selectedS3xyProducts.filter(p => p !== product.id));
                                  if (product.id === 'knob_commander') {
                                    setSelectedS3xyVehicleVariant("");
                                  }
                                  if (product.id === 'strip') {
                                    setSelectedStripVariant("");
                                  }
                                }
                              }}
                            />
                            <ProductIcon className="w-4 h-4 text-muted-foreground" />
                            <label 
                              htmlFor={`s3xy-${product.id}`}
                              className="text-sm font-medium leading-none cursor-pointer select-none flex-1"
                            >
                              {language === "hu" ? product.hu : product.en}
                            </label>
                            {product.hasInfo && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (product.infoTarget === "dash") {
                                    setDashInfoOpen(true);
                                  } else if (product.infoTarget === "dash_commander") {
                                    setDashCommanderInfoOpen(true);
                                  } else if (product.infoTarget === "knob") {
                                    setKnobInfoOpen(true);
                                  } else if (product.infoTarget === "knob_commander") {
                                    setKnobCommanderInfoOpen(true);
                                  } else if (product.infoTarget === "strip") {
                                    setStripInfoOpen(true);
                                  } else if (product.infoTarget === "stalk") {
                                    setStalkInfoOpen(true);
                                  } else {
                                    setCommanderInfoOpen(true);
                                  }
                                }}
                                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                              >
                                <Info className="w-4 h-4 text-muted-foreground" />
                              </button>
                            )}
                            {product.price && (
                              <span className="text-sm font-medium text-foreground">
                                {product.price}
                              </span>
                            )}
                          </div>
                          
                          {/* Vehicle variant selector for Knob + Commander */}
                          {product.id === 'knob_commander' && isChecked && (
                            <div className="ml-8 p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                              <p className="text-xs text-muted-foreground">
                                {language === "hu" ? "Válassz járműtípust:" : "Select vehicle type:"}
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: "model3_facelift", label: "Model 3 Facelift" },
                                  { id: "model3_highland", label: "Model 3 Highland" },
                                  { id: "modely", label: "Model Y" },
                                  { id: "modely_juniper", label: "Model Y Juniper Premium" },
                                ].map((variant) => (
                                  <button
                                    key={variant.id}
                                    type="button"
                                    onClick={() => setSelectedS3xyVehicleVariant(variant.id)}
                                    className={cn(
                                      "p-2 text-xs rounded-md border transition-colors text-center",
                                      selectedS3xyVehicleVariant === variant.id
                                        ? "bg-foreground text-background border-foreground"
                                        : "bg-background border-border hover:border-foreground/50"
                                    )}
                                  >
                                    {variant.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Vehicle variant selector for Strip */}
                          {product.id === 'strip' && isChecked && (
                            <div className="ml-8 p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                              <p className="text-xs text-muted-foreground">
                                {language === "hu" ? "Válassz járműtípust:" : "Select vehicle type:"}
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: "model3", label: "Model 3", forVehicle: "model-3" },
                                  { id: "model3_highland", label: "Model 3 Highland", forVehicle: "model-3" },
                                  { id: "modely", label: "Model Y", forVehicle: "model-y" },
                                  { id: "modely_juniper", label: "Model Y Juniper", forVehicle: "model-y" },
                                ].filter(variant => variant.forVehicle === vehicleId).map((variant) => (
                                  <button
                                    key={variant.id}
                                    type="button"
                                    onClick={() => setSelectedStripVariant(variant.id)}
                                    className={cn(
                                      "p-2 text-xs rounded-md border transition-colors text-center",
                                      selectedStripVariant === variant.id
                                        ? "bg-foreground text-background border-foreground"
                                        : "bg-background border-border hover:border-foreground/50"
                                    )}
                                  >
                                    {variant.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            <Button 
              variant="tesla" 
              className="w-full" 
              disabled={
                selectedS3xyProducts.length === 0 || 
                (selectedS3xyProducts.includes('knob_commander') && !selectedS3xyVehicleVariant) ||
                (selectedS3xyProducts.includes('strip') && !selectedStripVariant)
              }
              onClick={() => {
                onSelect('s3xy_products', { s3xyProducts: selectedS3xyProducts });
                setS3xyDialogOpen(false);
              }}
            >
              {language === "hu" ? "Tovább a foglaláshoz" : "Continue to booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PPF Dialog */}
      <Dialog open={ppfDialogOpen} onOpenChange={(open) => {
        setPpfDialogOpen(open);
        if (!open) { setSelectedPpfVariant(""); setSelectedPpfCoverage(""); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {language === "hu" ? "PPF festékvédő fólia" : "PPF Paint Protection Film"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === "hu"
                ? "Válaszd ki a fólia típusát."
                : "Select the film type."}
            </p>
            <div className="space-y-2">
              {[
                { id: "glossy", label: language === "hu" ? "Fényes (Glossy)" : "Glossy", desc: language === "hu" ? "Eredeti gyári hatás, tükröződő felület" : "Original factory look, reflective surface", price: language === "hu" ? "bruttó 1 079 500 Ft-tól" : "from 1,079,500 HUF gross", duration: language === "hu" ? "3 nap (teljes) / 1,5 nap (eleje)" : "3 days (full) / 1.5 days (front)" },
                { id: "matte", label: language === "hu" ? "Matt (Matte)" : "Matte", desc: language === "hu" ? "Modern, szatén hatású felület" : "Modern, satin-like surface", price: language === "hu" ? "bruttó 1 104 900 Ft" : "1,104,900 HUF gross", duration: language === "hu" ? "3 nap" : "3 days" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => { setSelectedPpfVariant(option.id); setSelectedPpfCoverage(""); }}
                  className={cn(
                    "w-full p-4 text-left rounded-lg border transition-colors",
                    selectedPpfVariant === option.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted/30 border-border hover:border-foreground/50"
                  )}
                >
                  <span className="font-medium text-sm">{option.label}</span>
                  <p className={cn("text-xs mt-1", selectedPpfVariant === option.id ? "text-background/70" : "text-muted-foreground")}>{option.desc}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={cn("text-xs font-medium", selectedPpfVariant === option.id ? "text-background/80" : "text-foreground/70")}>{option.price}</span>
                    <span className={cn("text-xs", selectedPpfVariant === option.id ? "text-background/60" : "text-muted-foreground")}>{option.duration}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedPpfVariant === "glossy" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {language === "hu" ? "Fóliázás kiterjedése:" : "Coverage area:"}
                </p>
                {[
                  { id: "full", label: language === "hu" ? "Teljes autó" : "Full car", price: language === "hu" ? "bruttó 1 079 500 Ft" : "1,079,500 HUF gross" },
                  { id: "front", label: language === "hu" ? "Csak az eleje" : "Front only", price: language === "hu" ? "bruttó 457 200 Ft" : "457,200 HUF gross" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedPpfCoverage(option.id)}
                    className={cn(
                      "w-full p-3 text-sm text-left rounded-lg border transition-colors flex items-center justify-between",
                      selectedPpfCoverage === option.id
                        ? "bg-foreground text-background border-foreground"
                        : "bg-muted/30 border-border hover:border-foreground/50"
                    )}
                  >
                    <span>{option.label}</span>
                    <span className={cn("ml-auto text-xs font-medium", selectedPpfCoverage === option.id ? "text-background/80" : "text-foreground/70")}>{option.price}</span>
                  </button>
                ))}
              </div>
            )}

            <Button
              variant="tesla"
              className="w-full"
              disabled={!selectedPpfVariant || (selectedPpfVariant === "glossy" && !selectedPpfCoverage)}
              onClick={() => {
                const coverage = selectedPpfVariant === "glossy" ? `_${selectedPpfCoverage}` : "";
                onSelect(`ppf_${selectedPpfVariant}${coverage}`);
                setPpfDialogOpen(false);
              }}
            >
              {language === "hu" ? "Tovább a foglaláshoz" : "Continue to booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={softcloseDialogOpen} onOpenChange={(open) => {
        setSoftcloseDialogOpen(open);
        if (!open) {
          setSelectedSoftcloseOption("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <DoorClosed className="w-5 h-5" />
              Softclose
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === "hu" 
                ? "Válaszd ki, melyik ajtókra szeretnéd a softclose beszerelését."
                : "Select which doors you want the softclose installed on."}
            </p>
            
            <div className="space-y-2">
              {[
                { id: "front_2", label: language === "hu" ? "Első 2 ajtó" : "Front 2 doors", iconCount: 2, price: "bruttó 140 000 Ft" },
                { id: "rear_2", label: language === "hu" ? "Hátsó 2 ajtó" : "Rear 2 doors", iconCount: 2, price: "bruttó 140 000 Ft" },
                { id: "all_4", label: language === "hu" ? "Mind a 4 ajtó" : "All 4 doors", iconCount: 4, price: "bruttó 250 000 Ft" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedSoftcloseOption(option.id)}
                  className={cn(
                    "w-full p-4 text-sm rounded-lg border transition-colors flex items-center justify-between",
                    selectedSoftcloseOption === option.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted/30 border-border hover:border-foreground/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {Array.from({ length: option.iconCount }).map((_, i) => (
                        <DoorClosed key={i} className="w-4 h-4" />
                      ))}
                    </div>
                    <span>{option.label}</span>
                  </div>
                  <span className="font-medium">{option.price}</span>
                </button>
              ))}
            </div>

            <Button 
              variant="tesla" 
              className="w-full" 
              disabled={!selectedSoftcloseOption}
              onClick={() => {
                onSelect('softclose', { s3xyProducts: [`softclose_${selectedSoftcloseOption}`] });
                setSoftcloseDialogOpen(false);
              }}
            >
              {language === "hu" ? "Tovább a foglaláshoz" : "Continue to booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Seat Ventilation Dialog */}
      <Dialog open={seatVentDialogOpen} onOpenChange={(open) => {
        setSeatVentDialogOpen(open);
        if (!open) {
          setSelectedSeatVentVariant("");
          setSelectedSeatVentColor("");
        }
      }}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <Fan className="w-5 h-5" />
              {language === "hu" ? "Ülés szellőztetés" : "Seat Ventilation"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === "hu" 
                ? "Válaszd ki a jármű típusát a megfelelő szellőztetés csomaghoz."
                : "Select your vehicle type for the appropriate ventilation package."}
            </p>
            
            <div className="space-y-2">
              {[
                { id: "model_3", label: "Model 3" },
                { id: "model_y", label: "Model Y" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedSeatVentVariant(option.id)}
                  className={cn(
                    "w-full p-4 text-sm rounded-lg border transition-colors flex items-center gap-3",
                    selectedSeatVentVariant === option.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted/30 border-border hover:border-foreground/50"
                  )}
                >
                  <Fan className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                {language === "hu" ? "Ülés szín" : "Seat color"}
              </p>
              <div className="flex gap-3">
                {[
                  { id: "white", label: language === "hu" ? "Fehér" : "White", colorClass: "bg-white border-2", image: seatVentWhiteImage },
                  { id: "black", label: language === "hu" ? "Fekete" : "Black", colorClass: "bg-[#1C1C1C]", image: null },
                ].map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedSeatVentColor(color.id)}
                    className={cn(
                      "flex-1 text-sm rounded-lg border transition-colors overflow-hidden",
                      selectedSeatVentColor === color.id
                        ? "border-foreground ring-2 ring-foreground/20"
                        : "border-border hover:border-foreground/50"
                    )}
                  >
                    {color.image ? (
                      <img src={color.image} alt={color.label} className="w-full h-20 object-cover" />
                    ) : (
                      <div className={cn("w-full h-20", color.colorClass)} />
                    )}
                    <div className="p-2 flex items-center justify-center gap-2">
                      <div className={cn("w-4 h-4 rounded-full border border-border shrink-0", color.colorClass)} />
                      <span>{color.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button 
              variant="tesla" 
              className="w-full" 
              disabled={!selectedSeatVentVariant || !selectedSeatVentColor}
              onClick={() => {
                onSelect('seat_ventilation', { s3xyProducts: [`seat_vent_${selectedSeatVentVariant}_${selectedSeatVentColor}`] });
                setSeatVentDialogOpen(false);
              }}
            >
              {language === "hu" ? "Tovább a foglaláshoz" : "Continue to booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Commander Info Dialog */}
      <Dialog open={commanderInfoOpen} onOpenChange={setCommanderInfoOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              S3XY Commander
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden bg-muted/30">
              <img 
                src={s3xyCommanderImage} 
                alt="S3XY Commander" 
                className="w-full h-auto object-cover max-h-40"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "hu" 
                ? "A Commander a teljes S3XY ökoszisztéma agya. Hozzáférést biztosít az összes funkcióhoz, automatizációhoz és valós idejű statisztikához."
                : "The Commander is the brain behind the entire S3XY ecosystem. It gives you access to all features, automations, and real-time stats."}
            </p>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <p className="text-xs font-medium">
                {language === "hu" ? "Ár beszereléssel:" : "Price with installation:"} bruttó 89 900 Ft
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCommanderInfoOpen(false)}
              >
                {language === "hu" ? "Bezárás" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Knob Info Dialog */}
      <Dialog open={knobInfoOpen} onOpenChange={setKnobInfoOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
              <Circle className="w-4 h-4" />
              S3XY Knob
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden bg-muted/30">
              <img 
                src={s3xyKnobImage} 
                alt="S3XY Knob" 
                className="w-full h-auto object-cover max-h-40"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "hu" 
                ? "Az S3XY Knob egy elegáns, többfunkciós vezérlő, amely zökkenőmentesen integrálható a Tesla Model 3 és Model Y járművekbe."
                : "The S3XY Knob is an elegant, multi-function controller that integrates seamlessly into Tesla Model 3 and Model Y vehicles."}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "80+ választható funkció" : "80+ selectable functions"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "5 egyedileg konfigurálható vezérlőoldal" : "5 custom configurable control pages"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Egyetlen mozdulattal elérhető műveletek" : "One-touch accessible operations"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Vezetés közbeni figyelemelvonás nélkül" : "No distraction while driving"}
              </li>
            </ul>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <p className="text-xs font-medium">
                {language === "hu" ? "Termék ára beszereléssel:" : "Price with installation:"} bruttó 89 900 Ft
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setKnobInfoOpen(false)}
              >
                {language === "hu" ? "Bezárás" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Knob + Commander Info Dialog */}
      <Dialog open={knobCommanderInfoOpen} onOpenChange={setKnobCommanderInfoOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              S3XY Knob + Commander
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden bg-muted/30">
              <img 
                src={s3xyKnobCommanderImage} 
                alt="S3XY Knob + Commander" 
                className="w-full h-auto object-cover max-h-40"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "hu" 
                ? "A Commander és az S3XY Knob együtt alkotják a teljes S3XY vezérlőrendszert. A Commander a rendszer agya, míg az S3XY Knob az intuitív, fizikai kezelőfelület."
                : "The Commander and S3XY Knob together form the complete S3XY control system. The Commander is the brain, while the S3XY Knob is the intuitive physical interface."}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "80+ vezérelhető funkció" : "80+ controllable functions"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "5 testreszabható vezérlőoldal" : "5 customizable control pages"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Egyérintéses vezérlés" : "One-touch control"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Minimális figyelemelvonás vezetés közben" : "Minimal distraction while driving"}
              </li>
            </ul>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <p className="text-xs font-medium">
                {language === "hu" ? "Termék ára beszereléssel:" : "Price with installation:"} bruttó 145 900 Ft
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setKnobCommanderInfoOpen(false)}
              >
                {language === "hu" ? "Bezárás" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Strip Info Dialog */}
      <Dialog open={stripInfoOpen} onOpenChange={setStripInfoOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
              <Minus className="w-4 h-4" />
              S3XY Strip
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden bg-muted/30">
              <img 
                src={s3xyStripImage} 
                alt="S3XY Strip" 
                className="w-full h-auto object-cover max-h-40"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "hu" 
                ? "S3XY Smart RGB Lightstrip – több mint hangulatfény. Valós idejű fényjelzések holttérfigyeléshez, sebességhatárokhoz és Sentry Mode-hoz."
                : "S3XY Smart RGB Lightstrip – more than ambient lighting. Real-time light signals for blind spot monitoring, speed limits, and Sentry Mode."}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Testreszabható az S3XY Appban" : "Customizable in the S3XY App"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Egyszerű telepítés, Commander nélkül" : "Easy installation, no Commander needed"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Tesla Model 3 és Model Y (2021+)" : "Tesla Model 3 and Model Y (2021+)"}
              </li>
            </ul>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <p className="text-xs font-medium">
                {language === "hu" ? "Termék ára beszereléssel:" : "Price with installation:"} bruttó 59 900 Ft
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStripInfoOpen(false)}
              >
                {language === "hu" ? "Bezárás" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Stalk Info Dialog */}
      <Dialog open={stalkInfoOpen} onOpenChange={(open) => {
        setStalkInfoOpen(open);
        if (!open) setSelectedStalkSide("");
      }}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              S3XY Stalk
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(selectedStalkSide === "" || selectedStalkSide === "left") && (
              <div className="rounded-lg overflow-hidden bg-muted/30">
                <img 
                  src={s3xyStalkLeftImage} 
                  alt="S3XY Stalk - Bal oldal" 
                  className="w-full h-auto object-cover max-h-40"
                />
              </div>
            )}
            {selectedStalkSide === "right" && (
              <div className="rounded-lg overflow-hidden bg-muted/30">
                <img 
                  src={s3xyStalkRightImage} 
                  alt="S3XY Stalk - Jobb oldal" 
                  className="w-full h-auto object-cover max-h-40"
                />
              </div>
            )}
            {selectedStalkSide === "both" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg overflow-hidden bg-muted/30">
                  <img 
                    src={s3xyStalkLeftImage} 
                    alt="S3XY Stalk - Bal oldal" 
                    className="w-full h-auto object-cover max-h-40"
                  />
                </div>
                <div className="rounded-lg overflow-hidden bg-muted/30">
                  <img 
                    src={s3xyStalkRightImage} 
                    alt="S3XY Stalk - Jobb oldal" 
                    className="w-full h-auto object-cover max-h-40"
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "hu" 
                ? "Fontos: az S3XY Stalk kizárólag a Tesla Model 3 Highland verziókhoz érhető el, amelyek nem rendelkeznek hagyományos indexkarral."
                : "Important: the S3XY Stalk is only available for Tesla Model 3 Highland versions that do not have a traditional turn signal stalk."}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "hu" 
                ? "S3XY Stalks – a vezérlés visszakerül a kezedbe. Irányítsd az irányjelzőket, menetállapotokat és válassz több mint 200 funkció közül – ablaktörlők, távolsági fényszóró, akkumulátor-előmelegítés, ülésmozgatás, regeneráció állítása és még sok más."
                : "S3XY Stalks – control returns to your hands. Manage turn signals, drive states and choose from 200+ functions – wipers, high beams, battery preheat, seat adjustment, regen settings and much more."}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "200+ vezérelhető funkció" : "200+ controllable functions"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "CR2032 elemek, 1+ év élettartam" : "CR2032 batteries, 1+ year lifespan"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Leszerelés nélkül cserélhető elem" : "Battery replaceable without removal"}
              </li>
            </ul>

            <div className="pt-2 border-t border-border space-y-3">
              <p className="text-xs font-medium">
                {language === "hu" ? "Melyik oldalra szeretnéd?" : "Which side do you want?"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "left", label: language === "hu" ? "Bal oldal" : "Left side", price: "bruttó 79 900 Ft" },
                  { id: "right", label: language === "hu" ? "Jobb oldal" : "Right side", price: "bruttó 79 900 Ft" },
                  { id: "both", label: language === "hu" ? "Mindkettő" : "Both sides", price: "bruttó 159 800 Ft" },
                ].map((side) => (
                  <button
                    key={side.id}
                    type="button"
                    onClick={() => setSelectedStalkSide(side.id)}
                    className={cn(
                      "p-3 text-sm rounded-lg border transition-colors text-center",
                      selectedStalkSide === side.id
                        ? "bg-foreground text-background border-foreground"
                        : "bg-muted/30 border-border hover:border-foreground/50"
                    )}
                  >
                    <div>{side.label}</div>
                    <div className={cn("text-xs mt-1", selectedStalkSide === side.id ? "text-background/70" : "text-muted-foreground")}>{side.price}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStalkInfoOpen(false)}
              >
                {language === "hu" ? "Bezárás" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Dash Info Dialog */}
      <Dialog open={dashInfoOpen} onOpenChange={setDashInfoOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              S3XY Dash
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden bg-muted/30">
              <img 
                src={s3xyDashImage} 
                alt="S3XY Dash" 
                className="w-full h-auto object-cover max-h-40"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "hu" 
                ? "Az S3XY Dash egy intelligens, teljes mértékben testreszabható kiegészítő műszerfal, amely támogatja az Apple CarPlay és az Android Auto rendszereket. Tökéletesen illeszkedik minden Tesla Model 3 és Model Y járműhöz, beleértve a Highland és Juniper verziókat is."
                : "The S3XY Dash is an intelligent, fully customizable auxiliary dashboard supporting Apple CarPlay and Android Auto. It fits perfectly in every Tesla Model 3 and Model Y, including Highland and Juniper versions."}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Apple CarPlay és Android Auto" : "Apple CarPlay and Android Auto"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "50+ járműfunkció vezérlése" : "Control 50+ vehicle functions"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Valós idejű menetadatok" : "Real-time driving data"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Testreszabható felület" : "Customizable interface"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "OTA frissítések" : "OTA updates"}
              </li>
            </ul>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                ⚠️ {language === "hu" 
                  ? "Figyelem: a termék csak előrendelésre érhető el. Beérkezés után installáljuk." 
                  : "Note: this product is available for pre-order only. Installation after arrival."}
              </p>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <p className="text-xs font-medium">
                {language === "hu" ? "Termék ára beszereléssel:" : "Price with installation:"} bruttó 169 900 Ft
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDashInfoOpen(false)}
              >
                {language === "hu" ? "Bezárás" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Dash + Commander Info Dialog */}
      <Dialog open={dashCommanderInfoOpen} onOpenChange={setDashCommanderInfoOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              S3XY Dash + Commander
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden bg-muted/30">
              <img 
                src={s3xyDashCommanderImage} 
                alt="S3XY Dash + Commander" 
                className="w-full h-auto object-cover max-h-40"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "hu" 
                ? "Az S3XY Dash egy intelligens, teljes mértékben testreszabható kiegészítő műszerfal, amely támogatja az Apple CarPlay és az Android Auto rendszereket. Tökéletesen illeszkedik minden Tesla Model 3 és Model Y járműhöz, beleértve a Highland és Juniper verziókat is."
                : "The S3XY Dash is an intelligent, fully customizable auxiliary dashboard supporting Apple CarPlay and Android Auto. Fits every Tesla Model 3 and Model Y, including Highland and Juniper versions."}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Apple CarPlay és Android Auto" : "Apple CarPlay and Android Auto"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "50+ járműfunkció vezérlése" : "Control 50+ vehicle functions"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Valós idejű menetadatok" : "Real-time driving data"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Testreszabható felület és sebességmérő" : "Customizable interface and speedometer"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "OTA frissítések" : "OTA updates"}
              </li>
            </ul>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                ⚠️ {language === "hu" 
                  ? "Figyelem: a termék csak előrendelésre érhető el. Beérkezés után installáljuk." 
                  : "Note: this product is available for pre-order only. Installation after arrival."}
              </p>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <p className="text-xs font-medium">
                {language === "hu" ? "Termék ára beszereléssel:" : "Price with installation:"} bruttó 204 990 Ft
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDashCommanderInfoOpen(false)}
              >
                {language === "hu" ? "Bezárás" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {selected && onNext && (
        <div className="mt-8 flex justify-center">
          <Button variant="tesla" size="lg" onClick={onNext} className="min-w-[200px]">
            {language === "hu" ? "Tovább" : "Next"}
            <ChevronDown className="w-4 h-4 ml-2 rotate-[-90deg]" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;
