import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import teslandLogo from "@/assets/tesland-logo.png";

const PrivacyPolicy = () => {
  const { language } = useLanguage();

  const content = {
    hu: {
      title: "Adatkezelési Tájékoztató",
      lastUpdated: "Utolsó frissítés: 2026. február 8.",
      sections: [
        {
          title: "1. Adatkezelő",
          content: "Az adatkezelő a TESLAND (székhely: Ganz Ábrahám utca 3, Nagytarcsa, Magyarország). Kapcsolat: info@tesland.hu, +36 1 234 5678."
        },
        {
          title: "2. Gyűjtött adatok",
          content: "Időpontfoglaláskor az alábbi adatokat gyűjtjük: teljes név, e-mail cím, telefonszám, jármű típusa, választott szolgáltatás és időpont. Regisztráció esetén további adatokat tárolhatunk a profilban."
        },
        {
          title: "3. Adatkezelés célja",
          content: "Az adatokat az időpontfoglalás kezelésére, visszaigazolások és emlékeztetők küldésére, valamint a szolgáltatás minőségének javítására használjuk."
        },
        {
          title: "4. Adatkezelés jogalapja",
          content: "Az adatkezelés jogalapja a szerződés teljesítése (időpontfoglalás) és az Ön hozzájárulása (marketing célú megkeresések esetén)."
        },
        {
          title: "5. Adatok megőrzése",
          content: "A személyes adatokat a szolgáltatás teljesítését követően a jogszabályokban előírt ideig (általában 5 év) őrizzük meg, kivéve, ha Ön korábban kéri a törlést."
        },
        {
          title: "6. Adatok továbbítása",
          content: "Adatait harmadik félnek nem adjuk át, kivéve az e-mail szolgáltatónkat (Resend) az értesítések küldéséhez. Az adatokat az EU területén belül tároljuk."
        },
        {
          title: "7. Az Ön jogai",
          content: "Önnek joga van a személyes adataihoz való hozzáféréshez, azok helyesbítéséhez, törléséhez, az adatkezelés korlátozásához és az adathordozhatósághoz. Kérését a info@tesland.hu címen nyújthatja be."
        },
        {
          title: "8. Sütik (Cookies)",
          content: "Weboldalunk sütiket használ a működéshez szükséges információk tárolására. Ezek a sütik nem tartalmaznak személyes adatokat és a böngésző bezárásával törlődnek."
        },
        {
          title: "9. Biztonság",
          content: "Megfelelő technikai és szervezési intézkedéseket alkalmazunk az Ön adatainak védelme érdekében, beleértve a titkosított adatátvitelt és a biztonságos tárolást."
        },
        {
          title: "10. Kapcsolat",
          content: "Adatvédelmi kérdésekkel kapcsolatban keressen minket: info@tesland.hu. Panasz esetén a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (NAIH) fordulhat."
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: February 8, 2026",
      sections: [
        {
          title: "1. Data Controller",
          content: "The data controller is TESLAND (address: Ganz Ábrahám utca 3, Nagytarcsa, Hungary). Contact: info@tesland.hu, +36 1 234 5678."
        },
        {
          title: "2. Data Collected",
          content: "When booking an appointment, we collect: full name, email address, phone number, vehicle type, selected service, and appointment time. If you register, we may store additional data in your profile."
        },
        {
          title: "3. Purpose of Data Processing",
          content: "We use the data to manage appointments, send confirmations and reminders, and to improve service quality."
        },
        {
          title: "4. Legal Basis",
          content: "The legal basis for data processing is contract performance (appointment booking) and your consent (for marketing communications)."
        },
        {
          title: "5. Data Retention",
          content: "We retain personal data for the period prescribed by law (generally 5 years) after service completion, unless you request earlier deletion."
        },
        {
          title: "6. Data Sharing",
          content: "We do not share your data with third parties, except our email provider (Resend) for sending notifications. Data is stored within the EU."
        },
        {
          title: "7. Your Rights",
          content: "You have the right to access, rectify, erase, restrict processing, and data portability of your personal data. Submit requests to info@tesland.hu."
        },
        {
          title: "8. Cookies",
          content: "Our website uses cookies to store information necessary for operation. These cookies do not contain personal data and are deleted when the browser is closed."
        },
        {
          title: "9. Security",
          content: "We implement appropriate technical and organizational measures to protect your data, including encrypted data transmission and secure storage."
        },
        {
          title: "10. Contact",
          content: "For privacy questions, contact us at info@tesland.hu. For complaints, you may contact the National Authority for Data Protection and Freedom of Information (NAIH)."
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

export default PrivacyPolicy;
