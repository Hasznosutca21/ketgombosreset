import { useState } from "react";
import { AlertTriangle, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";

interface WaitingForPartsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (missingPart: string, notes: string, reschedule: boolean) => Promise<void>;
  customerName?: string;
}

const WaitingForPartsDialog = ({
  open,
  onOpenChange,
  onConfirm,
  customerName,
}: WaitingForPartsDialogProps) => {
  const { t } = useLanguage();
  const [missingPart, setMissingPart] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async (reschedule: boolean) => {
    if (!missingPart.trim()) return;
    setIsLoading(true);
    try {
      await onConfirm(missingPart.trim(), notes.trim(), reschedule);
      setMissingPart("");
      setNotes("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {t.markWaitingForParts}
          </DialogTitle>
          <DialogDescription>
            {t.markWaitingForPartsDesc}
            {customerName && (
              <span className="block mt-1 font-medium text-foreground">
                {t.customer}: {customerName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="missing-part" className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              {t.missingPart} *
            </Label>
            <Input
              id="missing-part"
              value={missingPart}
              onChange={(e) => setMissingPart(e.target.value)}
              placeholder={t.missingPartPlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{t.additionalNotes}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.additionalNotesPlaceholder}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t.back}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleConfirm(false)}
            disabled={isLoading || !missingPart.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t.markOnly}
          </Button>
          <Button
            onClick={() => handleConfirm(true)}
            disabled={isLoading || !missingPart.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t.markAndReschedule}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WaitingForPartsDialog;
