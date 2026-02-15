import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import teslaOwnersClubLogo from "@/assets/tesla-owners-club-logo.png";

const STORAGE_KEY = "tesla-owners-club-popup-dismissed";

const TeslaOwnersClubPopup = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setOpen(false);
    sessionStorage.setItem(STORAGE_KEY, "true");
  };

  const handleJoin = () => {
    handleDismiss();
    navigate("/tesla-owners-club");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-sm text-center gap-6 p-8">
        <DialogHeader className="items-center gap-4">
          <img
            src={teslaOwnersClubLogo}
            alt="Tesla Owners Hungary"
            width={120}
            height={120}
            className="rounded-full mx-auto"
          />
          <DialogTitle className="text-xl font-bold">
            Csatlakozz a Tesla Owners Club Hungary-hoz!
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Legyél tagja Magyarország legnagyobb Tesla közösségének. Találkozók, hírek, kedvezmények és még sok más vár rád!
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="tesla" size="lg" onClick={handleJoin}>
            Megnézem
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Később
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeslaOwnersClubPopup;
