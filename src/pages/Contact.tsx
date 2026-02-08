import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import teslandLogo from "@/assets/tesland-logo.png";

const Contact = () => {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 md:px-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={teslandLogo} alt="TESLAND" className="h-6 md:h-8 w-auto" />
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {language === "hu" ? "Kapcsolat" : "Contact Us"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {language === "hu" 
            ? "Vegye fel velünk a kapcsolatot bármilyen kérdéssel vagy időpontfoglalással kapcsolatban."
            : "Get in touch with us for any questions or appointment inquiries."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">
                    {language === "hu" ? "Cím" : "Address"}
                  </h3>
                  <p className="text-muted-foreground">
                    Ganz Ábrahám utca 3<br />
                    Nagytarcsa, Hungary
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">
                    {language === "hu" ? "Telefon" : "Phone"}
                  </h3>
                  <p className="text-muted-foreground">
                    +36 1 234 5678
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-muted-foreground">
                    info@tesland.hu
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">
                    {language === "hu" ? "Nyitvatartás" : "Opening Hours"}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === "hu" ? "Hétfő - Péntek: 9:00 - 17:00" : "Monday - Friday: 9:00 AM - 5:00 PM"}<br />
                    {language === "hu" ? "Szombat: 9:00 - 13:00" : "Saturday: 9:00 AM - 1:00 PM"}<br />
                    {language === "hu" ? "Vasárnap: Zárva" : "Sunday: Closed"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="glass-card p-2 h-[400px] md:h-full min-h-[300px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d673.5!2d19.28912!3d47.52458!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4741db8c8b8b8b8b%3A0x0!2zR2FueiBBYnJhaGFtIHV0Y2EgMywgTmFneXRhcmNzYQ!5e0!3m2!1shu!2shu!4v1707400000000"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: "0.5rem" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="TESLAND Location"
            />
          </div>
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

export default Contact;
