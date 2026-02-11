import { useLanguage } from "@/hooks/useLanguage";
import { History } from "lucide-react";

interface AppointmentHistoryProps {
  userEmail: string | undefined;
}

const AppointmentHistory = ({ userEmail }: AppointmentHistoryProps) => {
  const { language } = useLanguage();

  return (
    <div className="text-center py-12">
      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        {language === "hu" ? "Előzmények átállítás alatt" : "History migration in progress"}
      </h3>
      <p className="text-sm text-muted-foreground">
        {language === "hu"
          ? "A foglalási előzmények hamarosan elérhetők lesznek az új API-n keresztül."
          : "Appointment history will be available via the new API soon."}
      </p>
    </div>
  );
};

export default AppointmentHistory;
