import { Wrench, Zap, Settings, Disc, Shield, Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceSelectorProps {
  onSelect: (service: string) => void;
  selected: string | null;
}

const services = [
  {
    id: "maintenance",
    title: "Annual Maintenance",
    description: "Complete inspection and fluid checks",
    icon: Wrench,
    duration: "2-3 hours",
  },
  {
    id: "battery",
    title: "Battery Service",
    description: "Battery health check and optimization",
    icon: Zap,
    duration: "1-2 hours",
  },
  {
    id: "brake",
    title: "Brake Service",
    description: "Brake pad inspection and replacement",
    icon: Disc,
    duration: "1-2 hours",
  },
  {
    id: "software",
    title: "Software frissítés",
    description: "Latest firmware and feature updates",
    icon: Settings,
    duration: "30 mins",
  },
  {
    id: "body",
    title: "Body Repair",
    description: "Dent removal and paint touch-ups",
    icon: Paintbrush,
    duration: "Varies",
  },
  {
    id: "warranty",
    title: "Warranty Service",
    description: "Covered repairs and replacements",
    icon: Shield,
    duration: "Varies",
  },
];

const ServiceSelector = ({ onSelect, selected }: ServiceSelectorProps) => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-bold mb-2">Select a Service</h2>
      <p className="text-muted-foreground mb-8">
        Choose the type of service your Tesla needs
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const Icon = service.icon;
          const isSelected = selected === service.id;

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
              <h3 className="text-lg font-semibold mb-1">{service.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {service.description}
              </p>
              <div className="text-xs text-muted-foreground">
                Est. time: {service.duration}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceSelector;
