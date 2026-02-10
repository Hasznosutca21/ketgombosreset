import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Printer, Loader2, RefreshCw, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import teslandLogo from "@/assets/tesland-logo.png";

interface WorkSheet {
  id: string;
  appointment_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  vehicle: string;
  vehicle_vin: string | null;
  service: string;
  service_date: string;
  description: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  vehicle: string;
  vehicle_vin?: string | null;
  service: string;
  appointment_date: string;
}

interface AdminWorkSheetsProps {
  language: string;
  prefillAppointment?: Appointment | null;
}

const vehicleLabels: Record<string, string> = {
  "model-s": "Model S",
  "model-3": "Model 3",
  "model-x": "Model X",
  "model-y": "Model Y",
  cybertruck: "Cybertruck",
  roadster: "Roadster",
};

const DEFAULT_DESCRIPTION = `Jelen munkalap a Tesla gyártmányú gépjárművek szervizelése, műszaki állapotfelmérése és diagnosztikai vizsgálata során végzett tevékenységek dokumentálására szolgál. A dokumentum célja az elvégzett ellenőrzések, mérések, beavatkozások és megállapítások pontos, egységes és visszakövethető rögzítése.

A munkalap tartalmazza a jármű azonosításához szükséges adatokat, beleértve a gyártmányt, típust, alvázszámot (VIN), gyártási évet, futásteljesítményt, valamint a tulajdonos és a szervizszolgáltató azonosító adatait. Rögzíti továbbá a szervizelés időpontját, jogcímét és jellegét.

A dokumentum kiterjed különösen az alábbi területekre:

a nagyfeszültségű akkumulátorrendszer állapotának vizsgálata,
a hajtáslánc és kapcsolódó rendszerek ellenőrzése,
a jármű elektronikus és szoftveres diagnosztikája, hibakód-ellenőrzés,
biztonsági és mechanikai elemek állapotának felmérése,
a mért értékek, megállapítások és szakmai észrevételek rögzítése.

A munkalap a szervizelési tevékenység hivatalos dokumentumának minősül, amely alkalmas belső nyilvántartási, ügyfél-tájékoztatási, valamint jogi és adminisztratív célú felhasználásra. A dokumentumban rögzített adatok az ellenőrzés időpontjában fennálló állapotot tükrözik.`;

const getVehicleLabel = (v: string) => {
  const key = v.split("-").slice(0, 2).join("-");
  return vehicleLabels[key] || v;
};

const AdminWorkSheets = ({ language, prefillAppointment }: AdminWorkSheetsProps) => {
  const { user } = useAuth();
  const [workSheets, setWorkSheets] = useState<WorkSheet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewSheet, setViewSheet] = useState<WorkSheet | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Form state
  const [selectedAppointment, setSelectedAppointment] = useState<string>("manual");
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    vehicle: "",
    vehicle_vin: "",
    service: "",
    service_date: format(new Date(), "yyyy-MM-dd"),
    description: DEFAULT_DESCRIPTION,
    notes: "",
  });

  // Auto-fill from customers table based on email
  useEffect(() => {
    if (selectedAppointment !== "manual") return; // skip if prefilled from appointment
    const email = form.customer_email.trim();
    if (!email || !email.includes("@")) return;

    const timeout = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("customers")
          .select("first_name, last_name, phone, address")
          .eq("email", email)
          .maybeSingle();
        if (data) {
          setForm((prev) => ({
            ...prev,
            customer_name: prev.customer_name || `${data.last_name} ${data.first_name}`.trim(),
            customer_phone: prev.customer_phone || data.phone || "",
          }));
        }
      } catch (e) {
        console.error("Customer lookup error:", e);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [form.customer_email, selectedAppointment]);

  const dateLocale = language === "hu" ? hu : enUS;
  const t = {
    workSheets: language === "hu" ? "Munkalapok" : "Work Sheets",
    workSheetsDesc: language === "hu" ? "Elvégzett szolgáltatások munkalapjai" : "Work sheets for completed services",
    createWorkSheet: language === "hu" ? "Új munkalap" : "New Work Sheet",
    fromAppointment: language === "hu" ? "Foglalásból" : "From appointment",
    manualEntry: language === "hu" ? "Kézi kitöltés" : "Manual entry",
    customerName: language === "hu" ? "Ügyfél neve" : "Customer Name",
    customerEmail: language === "hu" ? "E-mail" : "Email",
    customerPhone: language === "hu" ? "Telefon" : "Phone",
    vehicle: language === "hu" ? "Jármű" : "Vehicle",
    vin: "VIN",
    service: language === "hu" ? "Szolgáltatás" : "Service",
    serviceDate: language === "hu" ? "Szolgáltatás dátuma" : "Service Date",
    description: language === "hu" ? "Elvégzett munka leírása" : "Work Description",
    notes: language === "hu" ? "Megjegyzések" : "Notes",
    save: language === "hu" ? "Mentés" : "Save",
    print: language === "hu" ? "Nyomtatás / PDF" : "Print / PDF",
    noWorkSheets: language === "hu" ? "Nincsenek munkalapok" : "No work sheets",
    refresh: language === "hu" ? "Frissítés" : "Refresh",
    date: language === "hu" ? "Dátum" : "Date",
    customer: language === "hu" ? "Ügyfél" : "Customer",
    actions: language === "hu" ? "Műveletek" : "Actions",
    selectAppointment: language === "hu" ? "Válasszon foglalást" : "Select appointment",
    workSheet: language === "hu" ? "Munkalap" : "Work Sheet",
    savedSuccess: language === "hu" ? "Munkalap mentve" : "Work sheet saved",
    deletedSuccess: language === "hu" ? "Munkalap törölve" : "Work sheet deleted",
    failedToSave: language === "hu" ? "Mentés sikertelen" : "Failed to save",
  };

  useEffect(() => {
    fetchWorkSheets();
    fetchAppointments();
  }, []);

  // Handle prefill from appointment
  useEffect(() => {
    if (prefillAppointment) {
      setForm({
        customer_name: prefillAppointment.name,
        customer_email: prefillAppointment.email,
        customer_phone: prefillAppointment.phone || "",
        vehicle: prefillAppointment.vehicle,
        vehicle_vin: prefillAppointment.vehicle_vin || "",
        service: prefillAppointment.service,
        service_date: prefillAppointment.appointment_date,
        description: DEFAULT_DESCRIPTION,
        notes: "",
      });
      setSelectedAppointment(prefillAppointment.id);
      setCreateOpen(true);
    }
  }, [prefillAppointment]);

  const fetchWorkSheets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("work_sheets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setWorkSheets(data || []);
    } catch (e) {
      console.error("Error fetching work sheets:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, name, email, phone, vehicle, vehicle_vin, service, appointment_date")
        .in("status", ["confirmed", "rescheduled"])
        .order("appointment_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      setAppointments(data || []);
    } catch (e) {
      console.error("Error fetching appointments:", e);
    }
  };

  const handleAppointmentSelect = (value: string) => {
    setSelectedAppointment(value);
    if (value !== "manual") {
      const apt = appointments.find((a) => a.id === value);
      if (apt) {
        setForm({
          customer_name: apt.name,
          customer_email: apt.email,
          customer_phone: apt.phone || "",
          vehicle: apt.vehicle,
          vehicle_vin: apt.vehicle_vin || "",
          service: apt.service,
          service_date: apt.appointment_date,
          description: DEFAULT_DESCRIPTION,
          notes: "",
        });
      }
    }
  };

  const handleSave = async () => {
    if (!form.customer_name || !form.vehicle || !form.service || !user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from("work_sheets").insert({
        appointment_id: selectedAppointment !== "manual" ? selectedAppointment : null,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone || null,
        vehicle: form.vehicle,
        vehicle_vin: form.vehicle_vin || null,
        service: form.service,
        service_date: form.service_date,
        description: form.description || null,
        notes: form.notes || null,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success(t.savedSuccess);
      setCreateOpen(false);
      resetForm();
      fetchWorkSheets();
    } catch (e) {
      console.error("Error saving work sheet:", e);
      toast.error(t.failedToSave);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("work_sheets").delete().eq("id", id);
      if (error) throw error;
      setWorkSheets((prev) => prev.filter((ws) => ws.id !== id));
      toast.success(t.deletedSuccess);
    } catch (e) {
      console.error("Error deleting work sheet:", e);
    }
  };

  const resetForm = () => {
    setSelectedAppointment("manual");
    setForm({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      vehicle: "",
      vehicle_vin: "",
      service: "",
      service_date: format(new Date(), "yyyy-MM-dd"),
      description: DEFAULT_DESCRIPTION,
      notes: "",
    });
  };

  const handlePrint = (sheet: WorkSheet) => {
    const docNumber = `TG-${new Date(sheet.created_at).getFullYear()}-${sheet.id.slice(0, 3).toUpperCase()}`;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Munkalap - ${sheet.customer_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 32px 40px; color: #1a1a1a; font-size: 13px; line-height: 1.5; }
          
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
          .header-left { display: flex; gap: 16px; align-items: flex-start; }
          .header-logo img { height: 64px; }
          .header-company { font-size: 13px; }
          .header-company strong { font-size: 14px; }
          .header-right { text-align: left; font-size: 13px; color: #333; }
          
          .title-bar { border-top: 3px solid #1a1a1a; border-bottom: 1px solid #ccc; padding: 12px 0; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .title-bar h1 { font-size: 22px; font-weight: 800; letter-spacing: 1px; }
          .title-bar .doc-number { font-size: 14px; color: #555; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 20px; }
          .info-section { padding: 12px 0; }
          .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; font-weight: 600; }
          .info-section p { margin: 2px 0; }
          .info-section strong { font-weight: 600; }
          
          .section { margin-bottom: 20px; }
          .section-title { font-size: 13px; font-weight: 700; border-bottom: 2px solid #1a1a1a; padding-bottom: 4px; margin-bottom: 10px; }
          .description-text { font-size: 13px; line-height: 1.7; white-space: pre-wrap; padding: 12px 0; }
          
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 12px; }
          .items-table th { text-align: left; padding: 8px 6px; border-bottom: 2px solid #1a1a1a; font-weight: 600; font-size: 11px; }
          .items-table td { padding: 8px 6px; border-bottom: 1px solid #eee; }
          
          .totals { margin-left: auto; width: 280px; font-size: 13px; }
          .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
          .totals .row.total { font-weight: 700; border-top: 2px solid #1a1a1a; padding-top: 6px; margin-top: 4px; }
          
          .legal { margin-top: 20px; font-size: 11.5px; line-height: 1.6; color: #333; }
          .legal p { margin: 3px 0; }
          
          .signatures { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
          .sig-block { }
          .sig-block .sig-text { font-size: 12px; color: #333; margin-bottom: 24px; min-height: 36px; }
          .sig-line { border-top: 1px solid #999; width: 200px; }
          
          .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 8px; font-size: 10px; color: #999; }
          
          @media print { 
            body { padding: 16px 24px; } 
            @page { margin: 12mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <div class="header-company">
              <strong>Tesland | Mediavox Multimedia KFT</strong><br>
              Nagytarcsa, Ganz Ábrahám utca 3.<br>
              Tel: +36209355355<br>
              Email: info@tesland.hu
            </div>
          </div>
          <div class="header-right">
            Megrendelés dátuma: ${format(new Date(sheet.service_date), "yyyy-MM-dd")}<br>
            Határidő: <br>
            Szerelő: <br>
            Munkalap megnevezése: ${sheet.service}
          </div>
        </div>

        <div class="title-bar">
          <h1>ÁRAJÁNLAT / MUNKALAP</h1>
          <span class="doc-number">${docNumber}</span>
        </div>

        <div class="info-grid">
          <div class="info-section">
            <div class="info-label">Ügyfél</div>
            <p><strong>${sheet.customer_name}</strong></p>
            <p>${sheet.customer_phone || ""}</p>
            <p>${sheet.customer_email}</p>
          </div>
          <div class="info-section">
            <div class="info-label">Gépjármű</div>
            <p><strong>${sheet.vehicle_vin ? sheet.vehicle_vin + ", " : ""}TESLA ${getVehicleLabel(sheet.vehicle)}</strong></p>
            <p>Alvázszám: ${sheet.vehicle_vin || "—"}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Hiba leírása</div>
          <div class="description-text">${sheet.description || "—"}</div>
        </div>

        <div class="section">
          <table class="items-table">
            <thead>
              <tr>
                <th>Azonosító</th>
                <th>Megnevezés</th>
                <th>Menny.</th>
                <th>Nettó Egységár</th>
                <th>Nettó ár</th>
                <th>ÁFA</th>
                <th>Bruttó ár</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01</td>
                <td>${sheet.service}</td>
                <td></td>
                <td></td>
                <td></td>
                <td>27%</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <div class="totals">
            <div class="row"><span>Nettó számla érték:</span><span></span></div>
            <div class="row"><span>ÁFA:</span><span></span></div>
            <div class="row total"><span>Bruttó számla érték:</span><span></span></div>
          </div>
        </div>

        ${sheet.notes ? `
        <div class="section">
          <div class="section-title">Megjegyzések</div>
          <div class="description-text">${sheet.notes}</div>
        </div>
        ` : ""}

        <div class="legal">
          <p>[x] A szerviz a munkáért garanciát vállal.</p>
          <p>[x] A lecserélt alkatrészek tulajdonjogáról a szolgáltató részére lemondok.</p>
          <p>&nbsp;&nbsp;&nbsp;&nbsp;A szerviz általános szerződési feltételeit és adatkezelési tájékoztatóját megismertem azokat elfogadom.</p>
          <p>[ ] Hozzájárulok, hogy a szerviz, mint adatkezelő a személyes adataimat marketing célokra kezelje, részemre akcióiról, szolgáltatásairól, tájékoztatókat és ajánlatokat küldjön.</p>
        </div>

        <div class="signatures">
          <div class="sig-block">
            <div class="sig-text">Az ajánlatot elfogadom, a munkát megrendelem.</div>
            <div class="sig-line"></div>
          </div>
          <div class="sig-block">
            <div class="sig-text">A megrendelésben szereplő munka elvégzésére a gépjárművet átvettem.</div>
            <div class="sig-line"></div>
          </div>
          <div class="sig-block">
            <div class="sig-text">A javított gépjárművet átvettem.</div>
            <div class="sig-line"></div>
          </div>
          <div class="sig-block">
            <div class="sig-text">Az elvégzett munkákról tájékoztattam az ügyfelet.</div>
            <div class="sig-line"></div>
          </div>
        </div>

        <div class="footer">
          <span>Tesland | Mediavox Multimedia KFT</span>
          <span>1/ 1</span>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {t.workSheets}
          </CardTitle>
          <CardDescription>{t.workSheetsDesc}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchWorkSheets} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {t.refresh}
          </Button>
          <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            {t.createWorkSheet}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : workSheets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.noWorkSheets}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{t.date}</TableHead>
                  <TableHead>{t.customer}</TableHead>
                  <TableHead>{t.vehicle}</TableHead>
                  <TableHead>{t.service}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workSheets.map((ws) => (
                  <TableRow key={ws.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {ws.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {format(new Date(ws.service_date), language === "hu" ? "yyyy. MMM d." : "MMM d, yyyy", { locale: dateLocale })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ws.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{ws.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getVehicleLabel(ws.vehicle)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ws.service}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handlePrint(ws)} title={t.print}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ws.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Hidden print ref */}
      <div ref={printRef} className="hidden" />

      {/* Create Work Sheet Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.createWorkSheet}</DialogTitle>
            <DialogDescription>{t.workSheetsDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t.fromAppointment}</Label>
              <Select value={selectedAppointment} onValueChange={handleAppointmentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectAppointment} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{t.manualEntry}</SelectItem>
                  {appointments.map((apt) => (
                    <SelectItem key={apt.id} value={apt.id}>
                      {apt.name} — {getVehicleLabel(apt.vehicle)} — {format(new Date(apt.appointment_date), "MM.dd")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t.customerName}</Label>
                <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div>
                <Label>{t.customerEmail}</Label>
                <Input value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t.customerPhone}</Label>
                <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
              </div>
              <div>
                <Label>{t.serviceDate}</Label>
                <Input type="date" value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t.vehicle}</Label>
                <Input value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} />
              </div>
              <div>
                <Label>{t.vin}</Label>
                <Input value={form.vehicle_vin} onChange={(e) => setForm({ ...form, vehicle_vin: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>{t.service}</Label>
              <Input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
            </div>

            <div>
              <Label>{t.description}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                placeholder={language === "hu" ? "Részletes leírás az elvégzett munkáról..." : "Detailed description of work performed..."}
              />
            </div>

            <div>
              <Label>{t.notes}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder={language === "hu" ? "Egyéb megjegyzések..." : "Additional notes..."}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {language === "hu" ? "Mégse" : "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.customer_name || !form.vehicle || !form.service}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminWorkSheets;
