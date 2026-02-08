export const translations = {
  // Common
  back: "Vissza",
  signIn: "Bejelentkezés",
  signOut: "Kijelentkezés",
  adminLogin: "Admin bejelentkezés",
  support: "Támogatás",
  locations: "Helyszínek",
  contact: "Kapcsolat",

  // Header
  teslaService: "Tesla Szerviz",
  scheduleYourService: "Foglalja le szervizét",
  expertCare: "Szakértői gondoskodás Teslájáról, az Ön kényelmében",

  // Progress Steps
  service: "Szolgáltatás",
  vehicle: "Jármű",
  schedule: "Időpont",
  confirm: "Megerősítés",

  // Service Selector
  selectService: "Válasszon szolgáltatást",
  chooseServiceType: "Válassza ki a Teslájához szükséges szolgáltatás típusát",
  estTime: "Becsült idő",

  // Services
  services: {
    maintenance: {
      title: "Éves karbantartás",
      description: "Teljes átvizsgálás és folyadékellenőrzés",
      duration: "2-3 óra",
    },
    battery: {
      title: "Akkumulátor szerviz",
      description: "Akkumulátor állapotfelmérés és optimalizálás",
      duration: "1-2 óra",
    },
    brake: {
      title: "Fékszerviz",
      description: "Fékbetét ellenőrzés és csere",
      duration: "1-2 óra",
    },
    software: {
      title: "Software frissítés",
      description: "Legújabb firmware és funkció frissítések",
      duration: "30 perc",
    },
    body: {
      title: "Karosszéria javítás",
      description: "Horpadás eltávolítás és festés javítás",
      duration: "Változó",
    },
    warranty: {
      title: "Garanciális szerviz",
      description: "Garanciális javítások és cserék",
      duration: "Változó",
    },
  },

  // Vehicle Selector
  selectVehicle: "Válassza ki járművét",
  chooseVehicleModel: "Válassza ki Tesla modelljét a pontos szerviz opciókhoz",

  // Vehicle Types
  vehicleTypes: {
    Sedan: "Szedán",
    SUV: "SUV",
    Truck: "Pickup",
    Sports: "Sportkocsi",
  },

  // Appointment Form
  scheduleAppointment: "Időpont foglalás",
  chooseDateTimeLocation: "Válassza ki a kívánt dátumot, időpontot és helyszínt",
  selectDate: "Válasszon dátumot",
  pickDate: "Válasszon dátumot",
  selectTime: "Válasszon időpontot",
  selectLocation: "Válasszon helyszínt",
  contactInformation: "Kapcsolattartási adatok",
  fullName: "Teljes név",
  email: "E-mail",
  phone: "Telefon",
  confirmAppointment: "Időpont megerősítése",
  booking: "Foglalás...",

  // Locations
  locationsList: {
    sf: { name: "San Francisco Szervizközpont", address: "123 Tesla Blvd, SF, CA" },
    la: { name: "Los Angeles Szervizközpont", address: "456 Electric Ave, LA, CA" },
    ny: { name: "New York Szervizközpont", address: "789 Innovation St, NY, NY" },
  },

  // Confirmation
  appointmentConfirmed: "Időpont megerősítve!",
  confirmationEmailSent: "Visszaigazoló e-mailt küldtünk a következő címre:",
  appointmentDetails: "Időpont részletei",
  serviceLabel: "Szolgáltatás",
  vehicleLabel: "Jármű",
  dateLabel: "Dátum",
  timeLabel: "Időpont",
  locationLabel: "Helyszín",
  scheduleAnother: "Másik foglalás",
  addToCalendar: "Naptárhoz adás",

  // Auth
  adminSignIn: "Admin bejelentkezés",
  signInToAccess: "Jelentkezzen be az admin felület eléréséhez",
  createAccount: "Fiók létrehozása",
  createAccountToStart: "Hozzon létre fiókot a kezdéshez",
  password: "Jelszó",
  dontHaveAccount: "Nincs még fiókja?",
  signUp: "Regisztráció",
  alreadyHaveAccount: "Már van fiókja?",
  checkEmailVerify: "Ellenőrizze e-mailjét a fiók megerősítéséhez!",
  welcomeBack: "Üdvözöljük újra!",
  backToHome: "Vissza a főoldalra",

  // Admin Dashboard
  admin: "Admin",
  appointmentsDashboard: "Időpont kezelő",
  viewManageAppointments: "Összes foglalt szerviz időpont megtekintése és kezelése",
  refresh: "Frissítés",
  noAppointments: "Nincsenek időpontok",
  customer: "Ügyfél",
  status: "Státusz",
  actions: "Műveletek",
  confirmed: "Megerősítve",

  // Toast Messages
  appointmentBookedSuccess: "Időpont sikeresen lefoglalva! Ellenőrizze e-mailjét a visszaigazolásért.",
  failedToBook: "Időpont foglalása sikertelen. Kérjük, próbálja újra.",
  pushNotificationsEnabled: "Push értesítések engedélyezve az időpont emlékeztetőkhöz!",
  appointmentDeleted: "Időpont törölve",
  failedToDelete: "Időpont törlése sikertelen",
  failedToLoad: "Időpontok betöltése sikertelen",
  onlyAdminsCanDelete: "Csak adminok törölhetnek időpontokat",
};

export type Translations = typeof translations;
