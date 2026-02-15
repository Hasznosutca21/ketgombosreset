import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import teslaOwnersClubLogo from "@/assets/tesla-owners-club-logo.png";

const TeslaOwnersClub = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Vissza a főoldalra
        </Link>

        <img
          src={teslaOwnersClubLogo}
          alt="Tesla Owners Club Hungary"
          width={160}
          height={160}
          className="rounded-full mx-auto"
        />

        <h1 className="text-3xl font-bold tracking-tight">
          Tesla Owners Club Hungary
        </h1>

        <p className="text-muted-foreground leading-relaxed">
          Legyél tagja Magyarország legnagyobb Tesla közösségének. Találkozók, hírek, kedvezmények és még sok más vár rád!
        </p>

        <Button variant="tesla" size="lg" className="w-full" asChild>
          <a href="https://www.teslaownersclub.hu" target="_blank" rel="noopener noreferrer">
            Csatlakozom
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </div>
    </div>
  );
};

export default TeslaOwnersClub;
