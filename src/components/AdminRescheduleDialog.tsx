import { useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/hooks/useLanguage";
import { format } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AdminRescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  currentTime: string;
  onConfirm: (newDate: Date, newTime: string) => Promise<void>;
}

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
];

const AdminRescheduleDialog = ({
  open,
  onOpenChange,
  currentDate,
  currentTime,
  onConfirm,
}: AdminRescheduleDialogProps) => {
  const { t, language } = useLanguage();
  const dateLocale = language === "hu" ? hu : enUS;
  
  const [newDate, setNewDate] = useState<Date | undefined>(currentDate);
  const [newTime, setNewTime] = useState(currentTime);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!newDate || !newTime) return;
    setIsLoading(true);
    await onConfirm(newDate, newTime);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.rescheduleAppointment}</DialogTitle>
          <DialogDescription>{t.selectNewDateTime}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t.selectDate}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !newDate && "text-muted-foreground")}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {newDate ? format(newDate, "PPP", { locale: dateLocale }) : t.pickDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={newDate}
                  onSelect={setNewDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                  initialFocus
                  locale={dateLocale}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t.selectTime}</label>
            <Select value={newTime} onValueChange={setNewTime}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectTime} />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.back}
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !newDate || !newTime}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t.confirmReschedule}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminRescheduleDialog;
