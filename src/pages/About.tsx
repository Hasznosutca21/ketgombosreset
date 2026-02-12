import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Award, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import teslandLogo from "@/assets/tesland-logo.png";

const About = () => {
  const { language } = useLanguage();
  const t = {
    back: language === "hu" ? "Vissza" : "Back",
  };

  const features = [
    {
      icon: Shield,
      title: language === "hu" ? "Megbízhatóság" : "Reliability",
      description: language === "hu" 
        ? "Több éves tapasztalattal rendelkezünk Tesla járművek szervizelésében."
        : "Years of experience in servicing Tesla vehicles.",
    },
    {
      icon: Award,
      title: language === "hu" ? "Minőség" : "Quality",
      description: language === "hu" 
        ? "Csak eredeti alkatrészeket és professzionális eszközöket használunk."
        : "We only use genuine parts and professional equipment.",
    },
    {
      icon: Users,
      title: language === "hu" ? "Szakértelem" : "Expertise",
      description: language === "hu" 
        ? "Képzett technikusaink naprakészek a legújabb Tesla technológiákban."
        : "Our trained technicians are up-to-date with the latest Tesla technologies.",
    },
    {
      icon: Zap,
      title: language === "hu" ? "Gyorsaság" : "Speed",
      description: language === "hu" 
        ? "Hatékony munkavégzés, hogy autója mielőbb visszakerüljön Önhöz."
        : "Efficient work so your car returns to you as soon as possible.",
    },
  ];

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

      {/* Hero */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {language === "hu" ? "Rólunk" : "About Us"}
          </h1>
          <p className="text-xl text-muted-foreground">
            {language === "hu" 
              ? "A TESLAND Magyarország vezető Tesla szervizközpontja, ahol szenvedélyesen foglalkozunk az elektromos járművek karbantartásával és javításával."
              : "TESLAND is Hungary's leading Tesla service center, where we are passionate about maintaining and repairing electric vehicles."}
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="glass-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-12 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            {language === "hu" ? "Történetünk" : "Our Story"}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {language === "hu" 
              ? "A TESLAND több mint 6 éve nyújt magas színvonalú szolgáltatásokat a magyar Tesla-tulajdonosok számára. Működésünk első 4 évében kizárólag pimpelési megoldásokra fókuszáltunk, majd ezt követően szervizszolgáltatásokkal is bővítettük kínálatunkat.\n\nNagytarcsán és Győrben, modern diagnosztikai eszközökkel és szakképzett csapattal gondoskodunk arról, hogy Teslád a lehető legjobb kezekben legyen."
              : "TESLAND has been providing high-quality services to Hungarian Tesla owners for over 6 years. During our first 4 years, we focused exclusively on customization solutions, and then expanded our offerings with service solutions.\n\nIn Nagytarcsa and Győr, with modern diagnostic tools and a skilled team, we ensure your Tesla is in the best hands."}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {language === "hu" ? "Készen áll az időpontfoglalásra?" : "Ready to Book an Appointment?"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {language === "hu" 
              ? "Foglaljon időpontot online, gyorsan és egyszerűen."
              : "Book your appointment online, quickly and easily."}
          </p>
          <Button variant="tesla" size="lg" asChild>
            <Link to="/">
              {language === "hu" ? "Időpontfoglalás" : "Book Now"}
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} TESLAND. {language === "hu" ? "Minden jog fenntartva." : "All rights reserved."}
        </div>
      </footer>
    </div>
  );
};

export default About;
