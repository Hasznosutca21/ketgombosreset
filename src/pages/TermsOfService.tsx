import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import teslandLogo from "@/assets/tesland-logo.png";

const TermsOfService = () => {
  const { language } = useLanguage();

  const content = {
    hu: {
      title: "Általános Szerződési Feltételek",
      lastUpdated: "Utolsó frissítés: 2026. február 8.",
      sections: [
        {
          title: "1. Szolgáltatások",
          content: "A TESLAND Tesla járművek szervizszolgáltatásait nyújtja Magyarországon. Szolgáltatásaink közé tartozik az éves karbantartás, akkumulátor szerviz, fékszerviz, szoftverfrissítés, karosszéria javítás és garanciális szerviz."
        },
        {
          title: "2. Időpontfoglalás",
          content: "Az időpontfoglalás weboldalunkon keresztül történik. A foglalás visszaigazolását e-mailben küldjük. Fenntartjuk a jogot az időpontok módosítására rendkívüli körülmények esetén, erről előzetesen értesítjük ügyfeleinket."
        },
        {
          title: "3. Lemondási feltételek",
          content: "Az időpontok lemondása vagy módosítása a tervezett időpont előtt legalább 24 órával lehetséges díjmentesen. Ennél későbbi lemondás esetén lemondási díjat számíthatunk fel."
        },
        {
          title: "4. Árak és fizetés",
          content: "Szolgáltatásaink árai a weboldalon és a szervizközpontban megtalálhatók. Az árak tartalmazzák az ÁFÁ-t. Fizetés készpénzzel vagy bankkártyával lehetséges a szolgáltatás elvégzése után."
        },
        {
          title: "5. Garancia",
          content: "Munkáinkra 12 hónap garanciát vállalunk. A garancia nem terjed ki a rendeltetésellenes használatból eredő hibákra. Eredeti alkatrészek használata esetén a gyártói garancia érvényes."
        },
        {
          title: "6. Felelősség",
          content: "A TESLAND mindent megtesz a szolgáltatások magas színvonalú nyújtásáért. Nem vállalunk felelősséget olyan károkért, amelyek nem a mi hibánkból erednek, vagy vis maior következtében keletkeznek."
        },
        {
          title: "7. Adatkezelés",
          content: "Az Ön személyes adatait az Adatkezelési Tájékoztatónknak megfelelően kezeljük. Az adatkezelésről bővebb információt az Adatkezelési Tájékoztatóban talál."
        },
        {
          title: "8. Kapcsolat",
          content: "Kérdés esetén keressen minket a info@tesland.hu e-mail címen vagy a +36 1 234 5678 telefonszámon."
        }
      ]
    },
    en: {
      title: "Terms of Service",
      lastUpdated: "Last updated: February 8, 2026",
      sections: [
        {
          title: "1. Services",
          content: "TESLAND provides Tesla vehicle service in Hungary. Our services include annual maintenance, battery service, brake service, software updates, body repair, and warranty service."
        },
        {
          title: "2. Appointment Booking",
          content: "Appointments are booked through our website. We send booking confirmation via email. We reserve the right to modify appointments in extraordinary circumstances, and we will notify customers in advance."
        },
        {
          title: "3. Cancellation Policy",
          content: "Appointments can be cancelled or modified free of charge at least 24 hours before the scheduled time. Cancellations made later may incur a cancellation fee."
        },
        {
          title: "4. Prices and Payment",
          content: "Our service prices are available on the website and at the service center. Prices include VAT. Payment can be made by cash or card after the service is completed."
        },
        {
          title: "5. Warranty",
          content: "We provide a 12-month warranty on our work. The warranty does not cover defects resulting from improper use. Manufacturer's warranty applies when using genuine parts."
        },
        {
          title: "6. Liability",
          content: "TESLAND makes every effort to provide high-quality services. We are not liable for damages that do not result from our fault or occur due to force majeure."
        },
        {
          title: "7. Data Processing",
          content: "We process your personal data in accordance with our Privacy Policy. More information about data processing can be found in our Privacy Policy."
        },
        {
          title: "8. Contact",
          content: "For questions, contact us at info@tesland.hu or +36 1 234 5678."
        }
      ]
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 md:px-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={teslandLogo} alt="TESLAND" className="h-10 w-auto" />
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "hu" ? "Vissza" : "Back"}
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.lastUpdated}</p>

        <div className="space-y-8">
          {t.sections.map((section, index) => (
            <section key={index} className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{section.content}</p>
            </section>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 mt-12">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} TESLAND. {language === "hu" ? "Minden jog fenntartva." : "All rights reserved."}
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
