export const hu = {
  // Common
  back: "Vissza",
  signIn: "Bejelentkezés",
  signOut: "Kijelentkezés",
  adminLogin: "Admin bejelentkezés",
  support: "TESLAND",
  locations: "TESLAND Locations",
  contact: "Kapcsolat",

  // Header
  teslaService: "TESLAND",
  scheduleYourService: "Ha nem elég a kétgombos reset",
  heroSubtitle: "",
  expertCare: "Miért a Tesland?",
  heroDescription: "Nem csupán Teslákat szervizelünk, hanem a tulajdonosokat is összekapcsoljuk. A Tesland egy Tesla-központú műhely és szolgáltató, ahol a cél nem csak az, hogy megjavítsuk az autót, hanem hogy a Tesla-tulajdonosok biztonságban, magabiztosan és kompromisszumok nélkül használhassák az autójukat. A Teslák világa más: szoftver, elektronika, nagyfeszültségű rendszer, speciális alkatrészek – és ehhez olyan csapat kell, aki nem csak látott már Teslát, hanem ebben él.",

  // Progress Steps
  service: "Szolgáltatás",
  vehicle: "Jármű",
  schedule: "Időpont",
  confirm: "Megerősítés",
  selectYear: "Válaszd ki az évjáratot",
  change: "Módosítás",

  // Service Selector
  selectService: "Válasszon szolgáltatást",
  chooseServiceType: "Válassza ki a járművéhez szükséges szolgáltatás típusát",
  estTime: "Becsült idő",

  // Service Categories
  serviceCategories: {
    maintenance: {
      title: "Karbantartás",
      description: "Időszakos ellenőrzések és szervizelés",
    },
    hvac: {
      title: "Fűtés, hűtés",
      description: "Klíma és hőmérséklet szabályozás",
    },
    extras: {
      title: "Extra funkciók",
      description: "Software és intelligens rendszerek",
    },
    other: {
      title: "Egyéb szolgáltatások",
      description: "Karosszéria, garancia és egyebek",
    },
  },

  // Services
  services: {
    // Karbantartás
    maintenance: {
      title: "Általános átvizsgálás",
      description: "Pontos kép Teslád állapotáról – meglepetések nélkül",
      duration: "45 perc",
      price: "31 750 Ft",
      details: `A Tesland általános átvizsgálás egy átfogó ellenőrzési szolgáltatás Tesla modellekhez (Model 3 / Y / S / X), amely segít feltárni az autó aktuális műszaki állapotát, és időben felismerni az esetleges hibákat.

Gyári szintű diagnosztikával és célzott műszaki vizsgálattal átnézzük a jármű legfontosabb rendszereit, hogy átlátható, érthető képet kapj Teslád állapotáról – még azelőtt, hogy komolyabb problémák jelentkeznének.

• Gyári diagnosztika és hibakód kiolvasás
• Akkumulátor és töltőrendszer alapellenőrzés
• Fűtés és klímarendszer működésének vizsgálata
• Futómű és felfüggesztés vizuális ellenőrzése
• Fékek állapotfelmérése
• Alváz és főbb szerkezeti elemek átnézése
• Szoftveres állapotellenőrzés
• Rövid állapotjelentés + javaslatok`,
    },
    battery: {
      title: "Éves felülvizsgálat",
      description: "Kötelező éves akkumulátor és rendszer ellenőrzés",
      duration: "45 perc",
      price: "31 750 Ft",
      details: `Az éves Tesla felülvizsgálat célja, hogy biztosítsd járműved hosszú távú megbízhatóságát és értékállóságát. Ez a szolgáltatás különösen fontos használt Tesla vásárlás előtt, garancia lejárta után, vagy egyszerűen a nyugalom érdekében.

Miért fontos az éves felülvizsgálat?
A Tesla elektromos hajtáslánca kevesebb karbantartást igényel, mint egy hagyományos autó – de ez nem jelenti azt, hogy ne lenne szükség rendszeres ellenőrzésre. Az akkumulátor állapota, a fékrendszer, a futómű és a szoftver mind kritikus elemek, amelyek idővel kopnak vagy frissítést igényelnek.

Mit tartalmaz a felülvizsgálat?

• Akkumulátor egészségi állapot (SoH) mérés
• Töltőrendszer és töltőport ellenőrzés
• 12V akkumulátor állapotfelmérés
• Fékrendszer és fékfolyadék ellenőrzés
• Futómű és lengéscsillapítók vizsgálata
• Gumiabroncs állapot és kopásminta ellenőrzés
• Klíma és fűtésrendszer teszt
• Gyári diagnosztika és hibakód kiolvasás
• Karosszéria és alváz szemrevételezés
• Részletes állapotjelentés és javaslatok

Az árban foglalt személyes konzultáció során átbeszéljük az eredményeket és válaszolunk minden kérdésedre.`,
    },
    brake: {
      title: "Fékszerviz",
      description: "Fékbetét ellenőrzés és csere",
      duration: "1-2 óra",
    },
    // Fűtés, hűtés
    ac: {
      title: "Klíma szerviz",
      description: "Klímarendszer tisztítás és töltés",
      duration: "1-2 óra",
      price: "Javítási költség előzetes felmérés alapján",
    },
    heatpump: {
      title: "Supermanifold hiba",
      description: "Hőszivattyú rendszer diagnosztika és javítás",
      duration: "1-2 óra",
      price: "Javítási költség előzetes felmérés alapján",
    },
    heating: {
      title: "Pollen szűrő csere",
      description: "Utastér szűrő csere a tiszta levegőért",
      duration: "30 perc",
      price: "19 900 Ft",
    },
    hepa: {
      title: "HEPA szűrő csere",
      description: "Prémium HEPA szűrő csere Model Y-hoz",
      duration: "30 perc",
      price: "58 000 Ft",
    },
    ptcheater: {
      title: "PTC heater csere",
      description: "Elektromos kiegészítő fűtőelem csere, hideg időben biztosítja a hatékony fűtést",
      duration: "3-4 óra",
      price: "370 000 Ft",
    },
    // Extra funkciók
    software: {
      title: "Boombox aktiválás",
      description: "Egyedi hangok és dallamok külső hangszóróra",
      duration: "10 perc",
      price: "10 000 Ft",
    },
    autopilot: {
      title: "Belső világítás aktiválás",
      description: "Egyedi ambient világítás beállítása",
      duration: "10 perc",
      price: "10 000 Ft",
    },
    multimedia: {
      title: "Multimédia frissítés",
      description: "Infotainment rendszer frissítés és javítás",
      duration: "30 perc",
    },
    // Egyéb szolgáltatások
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
    tires: {
      title: "Abroncs szerviz",
      description: "Gumiabroncs csere és centírozás",
      duration: "1 óra",
    },
  },

  // Vehicle Selector
  selectVehicle: "Válassza ki járművét",
  chooseVehicleModel: "Válassza ki járműmodelljét a pontos szerviz opciókhoz",
  fromProfile: "Profilból",

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
    nagytarcsa: { name: "TESLAND Nagytarcsa", address: "Ganz Ábrahám utca 3, Nagytarcsa, Magyarország" },
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
  payOnline: "Online fizetés",
  payNow: "Fizetés most",
  paymentProcessing: "Fizetés feldolgozása...",
  paymentSuccess: "Fizetés sikeres!",
  paymentCancelled: "Fizetés megszakítva",
  paymentFailed: "Fizetés sikertelen",
  totalToPay: "Fizetendő összeg",
  orPayOnSite: "vagy fizessen helyszínen",

  // Auth
  adminSignIn: "Admin bejelentkezés",
  signInToAccess: "Jelentkezzen be az admin felület eléréséhez",
  signInToYourAccount: "Jelentkezzen be fiókjába",
  createAccount: "Fiók létrehozása",
  createAccountToStart: "Hozzon létre fiókot a kezdéshez",
  password: "Jelszó",
  dontHaveAccount: "Nincs még fiókja?",
  signUp: "Regisztráció",
  alreadyHaveAccount: "Már van fiókja?",
  checkEmailVerify: "Ellenőrizze e-mailjét a fiók megerősítéséhez!",
  welcomeBack: "Üdvözöljük újra!",
  backToHome: "Vissza a főoldalra",
  continueWithGoogle: "Folytatás Google fiókkal",
  continueWithApple: "Folytatás Apple fiókkal",
  continueWithTesla: "Folytatás Tesla fiókkal",
  teslaLoginFailed: "Bejelentkezés sikertelen Tesla fiókkal",
  orContinueWith: "vagy folytatás e-maillel",
  rememberMe: "Emlékezz rám",
  login: "Bejelentkezés",
  forgotPassword: "Elfelejtette jelszavát?",
  resetPassword: "Jelszó visszaállítása",
  resetPasswordDesc: "Adja meg e-mail címét a jelszó visszaállításához",
  sendResetLink: "Visszaállító link küldése",
  sending: "Küldés...",
  resetEmailSent: "Jelszó visszaállító e-mail elküldve! Ellenőrizze postafiókját.",
  newPassword: "Új jelszó",
  confirmPassword: "Jelszó megerősítése",
  updatePassword: "Jelszó frissítése",
  updating: "Frissítés...",
  passwordUpdated: "Jelszó sikeresen frissítve!",
  passwordsDoNotMatch: "A jelszavak nem egyeznek",
  backToLogin: "Vissza a bejelentkezéshez",
  invalidEmail: "Érvénytelen e-mail cím",
  passwordTooShort: "A jelszónak legalább 6 karakter hosszúnak kell lennie",
  passwordNeedsUppercase: "A jelszónak tartalmaznia kell nagybetűt",
  passwordNeedsNumber: "A jelszónak tartalmaznia kell számot",
  emailRequired: "E-mail cím megadása kötelező",
  passwordRequired: "Jelszó megadása kötelező",
  passwordStrength: "Jelszó erőssége",
  passwordWeak: "Gyenge",
  passwordFair: "Közepes",
  passwordGood: "Jó",
  passwordStrong: "Erős",
  passwordMinLength: "Legalább 6 karakter",
  passwordHasUppercase: "Nagybetű",
  passwordHasNumber: "Szám",
  passwordHasSpecial: "Speciális karakter",
  resendVerification: "Visszaigazoló e-mail újraküldése",
  resendVerificationDesc: "Adja meg e-mail címét az visszaigazoló e-mail újraküldéséhez",
  resendEmail: "E-mail újraküldése",
  resending: "Küldés...",
  verificationEmailResent: "Visszaigazoló e-mail elküldve! Ellenőrizze postafiókját.",
  didntReceiveEmail: "Nem kapta meg az e-mailt?",
  resendIt: "Újraküldés",

  // Profile
  profile: "Profil",
  personalInfo: "Személyes adatok",
  address: "Cím",
  preferences: "Beállítások",
  displayName: "Megjelenített név",
  displayNamePlaceholder: "Adja meg nevét",
  displayNameTooLong: "A megjelenített név legfeljebb 100 karakter lehet",
  phonePlaceholder: "Adja meg telefonszámát",
  phoneTooLong: "A telefonszám legfeljebb 20 karakter lehet",
  emailCannotBeChanged: "Az e-mail cím nem módosítható",
  addressLine1: "Cím 1. sor",
  addressLine1Placeholder: "Utca, házszám",
  addressLine2: "Cím 2. sor",
  addressLine2Placeholder: "Emelet, ajtó, stb.",
  city: "Város",
  cityPlaceholder: "Város",
  postalCode: "Irányítószám",
  postalCodePlaceholder: "Irányítószám",
  country: "Ország",
  countryPlaceholder: "Ország",
  saveChanges: "Mentés",
  profileUpdated: "Profil sikeresen frissítve",
  failedToSaveProfile: "Profil mentése sikertelen",
  avatarUpdated: "Profilkép sikeresen frissítve",
  failedToUploadAvatar: "Profilkép feltöltése sikertelen",
  invalidFileType: "Kérjük, válasszon képfájlt",
  fileTooLarge: "A kép legfeljebb 5 MB lehet",
  emailNotifications: "E-mail értesítések",
  emailNotificationsDesc: "Időpont emlékeztetők e-mailben",
  smsNotifications: "SMS értesítések",
  smsNotificationsDesc: "Időpont emlékeztetők SMS-ben",
  preferencesUpdated: "Beállítások frissítve",
  failedToUpdatePreferences: "Beállítások frissítése sikertelen",
  myProfile: "Profilom",
  dangerZone: "Veszélyes zóna",
  dangerZoneDesc: "Visszafordíthatatlan és destruktív műveletek",
  deleteAccount: "Fiók törlése",
  deleteAccountTitle: "Fiók törlése",
  deleteAccountWarning: "Ez a művelet nem vonható vissza. Ez véglegesen törli a fiókját és az összes adatát a szervereinkről.",
  enterPasswordToConfirm: "Adja meg jelszavát a megerősítéshez",
  deleteAccountConfirm: "Igen, törölje a fiókomat",
  invalidPassword: "Érvénytelen jelszó",
  notAuthenticated: "Nincs bejelentkezve",
  failedToDeleteAccount: "Fiók törlése sikertelen",
  accountDeleted: "Fiókja sikeresen törölve",

  // Vehicle Profile
  vehicleModel: "Tesla modell",
  selectModel: "Válasszon modellt",
  vehicleType: "Típus/Variáns",
  vehicleTypePlaceholder: "pl. Long Range, Performance, Standard Range",
  vehicleYear: "Évjárat",
  vehicleYearPlaceholder: "pl. 2023",
  vehicleVin: "VIN",
  vehicleVinPlaceholder: "Alvázszám",
  vinHelp: "17 karakteres alvázszám (Vehicle Identification Number)",
  decodeVin: "VIN dekódolás",
  decodingVin: "Dekódolás...",
  vinDecoded: "Jármű adatok sikeresen kitöltve",
  vinDecodeFailed: "VIN dekódolás sikertelen",
  onlyTeslaSupported: "Csak Tesla járművek támogatottak",
  invalidVinLength: "A VIN-nek pontosan 17 karakternek kell lennie",
  vehiclePlate: "Rendszám",
  vehiclePlatePlaceholder: "pl. ABC-123",
  vehicleImage: "Jármű kép",
  uploadVehicleImage: "Kép feltöltése",
  vehicleImageUpdated: "Jármű kép sikeresen frissítve",
  failedToUploadVehicleImage: "Jármű kép feltöltése sikertelen",
  removeVehicleImage: "Kép eltávolítása",
  vehicleImageRemoved: "Jármű kép eltávolítva",
  clickToUploadVehicleImage: "Kattintson a jármű kép feltöltéséhez",
  platePosition: "Rendszám pozíció",
  platePositionX: "Vízszintes pozíció",
  platePositionY: "Függőleges pozíció",
  plateSize: "Rendszám méret",
  plateSizeSmall: "Kicsi",
  plateSizeMedium: "Közepes",
  plateSizeLarge: "Nagy",

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

  // Manage Appointment
  manageAppointment: "Időpont kezelése",
  manageAppointmentDesc: "Kezelje, módosítsa vagy mondja le időpontját",
  enterEmailToFind: "Adja meg e-mail címét az időpont megtalálásához",
  noAppointmentsFound: "Nem található időpont",
  reschedule: "Átütemezés",
  cancel: "Lemondás",
  cancelAppointment: "Időpont lemondása",
  cancelConfirmation: "Biztosan le szeretné mondani ezt az időpontot? Ez a művelet nem vonható vissza.",
  confirmCancel: "Lemondás megerősítése",
  rescheduleAppointment: "Időpont átütemezése",
  selectNewDateTime: "Válasszon új dátumot és időpontot",
  confirmReschedule: "Átütemezés megerősítése",
  rescheduled: "Átütemezve",
  cancelled: "Lemondva",
  appointmentCancelled: "Időpont sikeresen lemondva",
  appointmentRescheduled: "Időpont sikeresen átütemezve",
  failedToCancel: "Időpont lemondása sikertelen",
  failedToReschedule: "Időpont átütemezése sikertelen",
  manageMyAppointment: "Időpont kezelése",

  // Toast Messages
  appointmentBookedSuccess: "Időpont sikeresen lefoglalva! Ellenőrizze e-mailjét a visszaigazolásért.",
  failedToBook: "Időpont foglalása sikertelen. Kérjük, próbálja újra.",
  slotAlreadyTaken: "Ez az időpont már foglalt. Kérjük válasszon másik időpontot.",
  pushNotificationsEnabled: "Push értesítések engedélyezve az időpont emlékeztetőkhöz!",
  appointmentDeleted: "Időpont törölve",
  failedToDelete: "Időpont törlése sikertelen",
  failedToLoad: "Időpontok betöltése sikertelen",
  onlyAdminsCanDelete: "Csak adminok törölhetnek időpontokat",
};

export const en = {
  // Common
  back: "Back",
  signIn: "Sign In",
  signOut: "Sign Out",
  adminLogin: "Admin Login",
  support: "TESLAND",
  locations: "TESLAND Locations",
  contact: "Kapcsolat",

  // Header
  teslaService: "TESLAND",
  scheduleYourService: "When the two-button reset isn't enough",
  heroSubtitle: "",
  expertCare: "Why Tesland?",
  heroDescription: "We don't just service Teslas – we connect owners. Tesland is a Tesla-focused workshop and service provider where the goal isn't just to \"fix the car\", but to help Tesla owners use their vehicles safely, confidently, and without compromise. The Tesla world is different: software, electronics, high-voltage systems, specialized parts – and that requires a team that doesn't just know Teslas, but lives and breathes them.",

  // Progress Steps
  service: "Service",
  vehicle: "Vehicle",
  schedule: "Schedule",
  confirm: "Confirm",
  selectYear: "Select year",
  change: "Change",

  // Service Selector
  selectService: "Select a Service",
  chooseServiceType: "Choose the type of service your vehicle needs",
  estTime: "Est. time",

  // Service Categories
  serviceCategories: {
    maintenance: {
      title: "Maintenance",
      description: "Regular inspections and servicing",
    },
    hvac: {
      title: "Heating & Cooling",
      description: "Climate and temperature control",
    },
    extras: {
      title: "Extra Features",
      description: "Software and intelligent systems",
    },
    other: {
      title: "Other Services",
      description: "Body, warranty and more",
    },
  },

  // Services
  services: {
    // Maintenance
    maintenance: {
      title: "General Inspection",
      description: "A clear picture of your Tesla's condition – no surprises",
      duration: "45 min",
      price: "31 750 Ft",
      details: `Tesland General Inspection is a comprehensive checkup service for Tesla models (Model 3 / Y / S / X), helping to reveal your car's current technical condition and identify potential issues early.

Using factory-level diagnostics and targeted technical inspection, we review your vehicle's most important systems to give you a clear, understandable picture of your Tesla's condition – before any major problems arise.

• Factory diagnostics and error code reading
• Battery and charging system basic check
• Heating and AC system operation test
• Suspension and chassis visual inspection
• Brake condition assessment
• Underbody and main structural elements review
• Software status check
• Brief condition report + recommendations`,
    },
    battery: {
      title: "Annual Inspection",
      description: "Mandatory annual battery and system check",
      duration: "45 min",
      price: "31 750 Ft",
      details: `The annual Tesla inspection ensures your vehicle's long-term reliability and value retention. This service is especially important before buying a used Tesla, after warranty expiration, or simply for peace of mind.

Why is the annual inspection important?
Tesla's electric powertrain requires less maintenance than a traditional car – but that doesn't mean regular checks aren't necessary. Battery condition, brake system, suspension, and software are all critical components that wear over time or require updates.

What does the inspection include?

• Battery State of Health (SoH) measurement
• Charging system and charge port inspection
• 12V battery condition assessment
• Brake system and brake fluid check
• Suspension and shock absorber inspection
• Tire condition and wear pattern check
• Climate and heating system test
• Factory diagnostics and error code reading
• Body and underbody visual inspection
• Detailed condition report and recommendations

The price includes a personal consultation where we discuss the results and answer all your questions.`,
    },
    brake: {
      title: "Brake Service",
      description: "Brake pad inspection and replacement",
      duration: "1-2 hours",
    },
    // Heating & Cooling
    ac: {
      title: "AC Service",
      description: "Air conditioning cleaning and recharge",
      duration: "1-2 hours",
      price: "Repair cost based on preliminary assessment",
    },
    heatpump: {
      title: "Supermanifold Issue",
      description: "Heat pump system diagnostics and repair",
      duration: "1-2 hours",
      price: "Repair cost based on preliminary assessment",
    },
    heating: {
      title: "Pollen Filter Replacement",
      description: "Cabin air filter replacement for clean air",
      duration: "30 min",
      price: "19 900 Ft",
    },
    hepa: {
      title: "HEPA Filter Replacement",
      description: "Premium HEPA filter replacement for Model Y",
      duration: "30 min",
      price: "58 000 Ft",
    },
    ptcheater: {
      title: "PTC Heater Replacement",
      description: "Electric auxiliary heater replacement for efficient heating in cold weather",
      duration: "3-4 hours",
      price: "370 000 Ft",
    },
    // Extra Features
    software: {
      title: "Boombox Activation",
      description: "Custom sounds and melodies for external speaker",
      duration: "10 min",
      price: "10 000 Ft",
    },
    autopilot: {
      title: "Interior Lighting Activation",
      description: "Custom ambient lighting setup",
      duration: "10 min",
      price: "10 000 Ft",
    },
    multimedia: {
      title: "Multimedia Update",
      description: "Infotainment system update and repair",
      duration: "30 mins",
    },
    // Other Services
    body: {
      title: "Body Repair",
      description: "Dent removal and paint touch-ups",
      duration: "Varies",
    },
    warranty: {
      title: "Warranty Service",
      description: "Covered repairs and replacements",
      duration: "Varies",
    },
    tires: {
      title: "Tire Service",
      description: "Tire replacement and balancing",
      duration: "1 hour",
    },
  },

  // Vehicle Selector
  selectVehicle: "Select Your Vehicle",
  chooseVehicleModel: "Choose your vehicle model for accurate service options",
  fromProfile: "From profile",

  // Vehicle Types
  vehicleTypes: {
    Sedan: "Sedan",
    SUV: "SUV",
    Truck: "Truck",
    Sports: "Sports",
  },

  // Appointment Form
  scheduleAppointment: "Schedule Appointment",
  chooseDateTimeLocation: "Choose your preferred date, time, and location",
  selectDate: "Select Date",
  pickDate: "Pick a date",
  selectTime: "Select Time",
  selectLocation: "Select Location",
  contactInformation: "Contact Information",
  fullName: "Full Name",
  email: "Email",
  phone: "Phone",
  confirmAppointment: "Confirm Appointment",
  booking: "Booking...",

  // Locations
  locationsList: {
    nagytarcsa: { name: "TESLAND Nagytarcsa", address: "Ganz Ábrahám utca 3, Nagytarcsa, Hungary" },
  },

  // Confirmation
  appointmentConfirmed: "Appointment Confirmed!",
  confirmationEmailSent: "A confirmation email has been sent to",
  appointmentDetails: "Appointment Details",
  serviceLabel: "Service",
  vehicleLabel: "Vehicle",
  dateLabel: "Date",
  timeLabel: "Time",
  locationLabel: "Location",
  scheduleAnother: "Schedule Another",
  addToCalendar: "Add to Calendar",
  payOnline: "Pay Online",
  payNow: "Pay Now",
  paymentProcessing: "Processing payment...",
  paymentSuccess: "Payment successful!",
  paymentCancelled: "Payment cancelled",
  paymentFailed: "Payment failed",
  totalToPay: "Total to pay",
  orPayOnSite: "or pay on-site",

  // Auth
  adminSignIn: "Admin Sign In",
  signInToAccess: "Sign in to access the admin dashboard",
  signInToYourAccount: "Sign in to your account",
  createAccount: "Create Account",
  createAccountToStart: "Create an account to get started",
  password: "Password",
  dontHaveAccount: "Don't have an account?",
  signUp: "Sign up",
  alreadyHaveAccount: "Already have an account?",
  checkEmailVerify: "Check your email to verify your account!",
  welcomeBack: "Welcome back!",
  backToHome: "Back to Home",
  continueWithGoogle: "Continue with Google",
  continueWithApple: "Continue with Apple",
  continueWithTesla: "Continue with Tesla",
  teslaLoginFailed: "Failed to sign in with Tesla",
  orContinueWith: "or continue with email",
  rememberMe: "Remember me",
  login: "Login",
  forgotPassword: "Forgot password?",
  resetPassword: "Reset Password",
  resetPasswordDesc: "Enter your email to receive a password reset link",
  sendResetLink: "Send Reset Link",
  sending: "Sending...",
  resetEmailSent: "Password reset email sent! Check your inbox.",
  newPassword: "New Password",
  confirmPassword: "Confirm Password",
  updatePassword: "Update Password",
  updating: "Updating...",
  passwordUpdated: "Password updated successfully!",
  passwordsDoNotMatch: "Passwords do not match",
  backToLogin: "Back to Login",
  invalidEmail: "Invalid email address",
  passwordTooShort: "Password must be at least 6 characters",
  passwordNeedsUppercase: "Password must contain an uppercase letter",
  passwordNeedsNumber: "Password must contain a number",
  emailRequired: "Email is required",
  passwordRequired: "Password is required",
  passwordStrength: "Password strength",
  passwordWeak: "Weak",
  passwordFair: "Fair",
  passwordGood: "Good",
  passwordStrong: "Strong",
  passwordMinLength: "At least 6 characters",
  passwordHasUppercase: "Uppercase letter",
  passwordHasNumber: "Number",
  passwordHasSpecial: "Special character",
  resendVerification: "Resend Verification Email",
  resendVerificationDesc: "Enter your email to resend the verification link",
  resendEmail: "Resend Email",
  resending: "Sending...",
  verificationEmailResent: "Verification email sent! Check your inbox.",
  didntReceiveEmail: "Didn't receive the email?",
  resendIt: "Resend it",

  // Profile
  profile: "Profile",
  personalInfo: "Personal Info",
  address: "Address",
  preferences: "Preferences",
  displayName: "Display Name",
  displayNamePlaceholder: "Enter your name",
  displayNameTooLong: "Display name must be less than 100 characters",
  phonePlaceholder: "Enter your phone number",
  phoneTooLong: "Phone must be less than 20 characters",
  emailCannotBeChanged: "Email cannot be changed",
  addressLine1: "Address Line 1",
  addressLine1Placeholder: "Street address",
  addressLine2: "Address Line 2",
  addressLine2Placeholder: "Apartment, suite, etc.",
  city: "City",
  cityPlaceholder: "City",
  postalCode: "Postal Code",
  postalCodePlaceholder: "Postal code",
  country: "Country",
  countryPlaceholder: "Country",
  saveChanges: "Save Changes",
  profileUpdated: "Profile updated successfully",
  failedToSaveProfile: "Failed to save profile",
  avatarUpdated: "Avatar updated successfully",
  failedToUploadAvatar: "Failed to upload avatar",
  invalidFileType: "Please select an image file",
  fileTooLarge: "Image must be less than 5MB",
  emailNotifications: "Email Notifications",
  emailNotificationsDesc: "Receive appointment reminders via email",
  smsNotifications: "SMS Notifications",
  smsNotificationsDesc: "Receive appointment reminders via SMS",
  preferencesUpdated: "Preferences updated",
  failedToUpdatePreferences: "Failed to update preferences",
  myProfile: "My Profile",
  dangerZone: "Danger Zone",
  dangerZoneDesc: "Irreversible and destructive actions",
  deleteAccount: "Delete Account",
  deleteAccountTitle: "Delete Account",
  deleteAccountWarning: "This action cannot be undone. This will permanently delete your account and remove all your data from our servers.",
  enterPasswordToConfirm: "Enter your password to confirm",
  deleteAccountConfirm: "Yes, delete my account",
  invalidPassword: "Invalid password",
  notAuthenticated: "Not authenticated",
  failedToDeleteAccount: "Failed to delete account",
  accountDeleted: "Your account has been deleted",

  // Vehicle Profile
  vehicleModel: "Tesla Model",
  selectModel: "Select model",
  vehicleType: "Variant/Type",
  vehicleTypePlaceholder: "e.g., Long Range, Performance, Standard Range",
  vehicleYear: "Year",
  vehicleYearPlaceholder: "e.g., 2023",
  vehicleVin: "VIN",
  vehicleVinPlaceholder: "Vehicle Identification Number",
  vinHelp: "17 character Vehicle Identification Number",
  decodeVin: "Decode VIN",
  decodingVin: "Decoding...",
  vinDecoded: "Vehicle data filled successfully",
  vinDecodeFailed: "Failed to decode VIN",
  onlyTeslaSupported: "Only Tesla vehicles are supported",
  invalidVinLength: "VIN must be exactly 17 characters",
  vehiclePlate: "License Plate",
  vehiclePlatePlaceholder: "e.g., ABC-123",
  vehicleImage: "Vehicle Image",
  uploadVehicleImage: "Upload Image",
  vehicleImageUpdated: "Vehicle image updated successfully",
  failedToUploadVehicleImage: "Failed to upload vehicle image",
  removeVehicleImage: "Remove Image",
  vehicleImageRemoved: "Vehicle image removed",
  clickToUploadVehicleImage: "Click to upload vehicle image",
  platePosition: "Plate Position",
  platePositionX: "Horizontal Position",
  platePositionY: "Vertical Position",
  plateSize: "Plate Size",
  plateSizeSmall: "Small",
  plateSizeMedium: "Medium",
  plateSizeLarge: "Large",

  // Admin Dashboard
  admin: "Admin",
  appointmentsDashboard: "Appointments Dashboard",
  viewManageAppointments: "View and manage all booked service appointments",
  refresh: "Refresh",
  noAppointments: "No appointments found",
  customer: "Customer",
  status: "Status",
  actions: "Actions",
  confirmed: "Confirmed",

  // Manage Appointment
  manageAppointment: "Manage Appointment",
  manageAppointmentDesc: "View, reschedule, or cancel your appointment",
  enterEmailToFind: "Enter your email to find your appointment",
  noAppointmentsFound: "No appointments found",
  reschedule: "Reschedule",
  cancel: "Cancel",
  cancelAppointment: "Cancel Appointment",
  cancelConfirmation: "Are you sure you want to cancel this appointment? This action cannot be undone.",
  confirmCancel: "Confirm Cancellation",
  rescheduleAppointment: "Reschedule Appointment",
  selectNewDateTime: "Select a new date and time",
  confirmReschedule: "Confirm Reschedule",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
  appointmentCancelled: "Appointment cancelled successfully",
  appointmentRescheduled: "Appointment rescheduled successfully",
  failedToCancel: "Failed to cancel appointment",
  failedToReschedule: "Failed to reschedule appointment",
  manageMyAppointment: "Manage Appointment",

  // Toast Messages
  appointmentBookedSuccess: "Appointment booked successfully! Check your email for confirmation.",
  failedToBook: "Failed to book appointment. Please try again.",
  slotAlreadyTaken: "This time slot is already booked. Please choose a different time.",
  pushNotificationsEnabled: "Push notifications enabled for appointment reminders!",
  appointmentDeleted: "Appointment deleted",
  failedToDelete: "Failed to delete appointment",
  failedToLoad: "Failed to load appointments",
  onlyAdminsCanDelete: "Only admins can delete appointments",
};

export type Language = "hu" | "en";
export type Translations = typeof hu;

export const translations = { hu, en };
