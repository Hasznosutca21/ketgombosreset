import { Wrench, Zap, Settings, Disc, Shield, Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface ServiceSelectorProps {
  onSelect: (service: string) => void;
  selected: string | null;
}

const services = [
  { id: "maintenance", icon: Wrench },
  { id: "battery", icon: Zap },
  { id: "brake", icon: Disc },
  { id: "software", icon: Settings },
  { id: "body", icon: Paintbrush },
  { id: "warranty", icon: Shield },
];

const ServiceSelector = ({ onSelect, selected }: ServiceSelectorProps) => {
  const { t } = useLanguage();

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-bold mb-2">{t.selectService}</h2>
      <p className="text-muted-foreground mb-8">{t.chooseServiceType}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const Icon = service.icon;
          const isSelected = selected === service.id;
          const serviceData = t.services[service.id as keyof typeof t.services];

          return (
            <button
              key={service.id}
              onClick={() => onSelect(service.id)}
              className={cn(
                "glass-card p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:border-primary/50",
                isSelected && "border-primary shadow-[0_0_30px_-10px_hsl(352_85%_49%/0.4)]"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{serviceData.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{serviceData.description}</p>
              <div className="text-xs text-muted-foreground">
                {t.estTime}: {serviceData.duration}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceSelector;
