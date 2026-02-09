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
  vehicle_vin: string | null;
  service: string;
  appointment_date: string;
}

interface AdminWorkSheetsProps {
  language: string;
}

const vehicleLabels: Record<string, string> = {
  "model-s": "Model S",
  "model-3": "Model 3",
  "model-x": "Model X",
  "model-y": "Model Y",
  cybertruck: "Cybertruck",
  roadster: "Roadster",
};

const getVehicleLabel = (v: string) => {
  const key = v.split("-").slice(0, 2).join("-");
  return vehicleLabels[key] || v;
};

const AdminWorkSheets = ({ language }: AdminWorkSheetsProps) => {
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
    description: "",
    notes: "",
  });

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
          description: "",
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
      description: "",
      notes: "",
    });
  };

  const handlePrint = (sheet: WorkSheet) => {
    setViewSheet(sheet);
    setTimeout(() => {
      const printContent = printRef.current;
      if (!printContent) return;
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Munkalap - ${sheet.customer_name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1a1a1a; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; }
            .logo { font-size: 24px; font-weight: 700; letter-spacing: 2px; }
            .title { font-size: 20px; font-weight: 300; text-transform: uppercase; letter-spacing: 3px; }
            .meta { font-size: 12px; color: #666; margin-top: 4px; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 8px; font-weight: 600; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .field { margin-bottom: 12px; }
            .field-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
            .field-value { font-size: 14px; margin-top: 2px; }
            .description { white-space: pre-wrap; font-size: 14px; line-height: 1.6; padding: 16px; background: #f8f8f8; border-radius: 4px; min-height: 100px; }
            .footer { margin-top: 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
            .signature { border-top: 1px solid #ccc; padding-top: 8px; font-size: 12px; color: #888; text-align: center; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">TESLAND</div>
              <div class="meta">Tesla szerviz és szolgáltató</div>
            </div>
            <div style="text-align: right;">
              <div class="title">Munkalap</div>
              <div class="meta">${format(new Date(sheet.created_at), "yyyy. MMM d.", { locale: hu })}</div>
              <div class="meta">#${sheet.id.slice(0, 8).toUpperCase()}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Ügyfél adatok</div>
            <div class="grid">
              <div class="field">
                <div class="field-label">Név</div>
                <div class="field-value">${sheet.customer_name}</div>
              </div>
              <div class="field">
                <div class="field-label">E-mail</div>
                <div class="field-value">${sheet.customer_email}</div>
              </div>
              <div class="field">
                <div class="field-label">Telefon</div>
                <div class="field-value">${sheet.customer_phone || "—"}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Jármű adatok</div>
            <div class="grid">
              <div class="field">
                <div class="field-label">Jármű</div>
                <div class="field-value">${getVehicleLabel(sheet.vehicle)}</div>
              </div>
              <div class="field">
                <div class="field-label">VIN</div>
                <div class="field-value">${sheet.vehicle_vin || "—"}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Szolgáltatás</div>
            <div class="grid">
              <div class="field">
                <div class="field-label">Típus</div>
                <div class="field-value">${sheet.service}</div>
              </div>
              <div class="field">
                <div class="field-label">Dátum</div>
                <div class="field-value">${format(new Date(sheet.service_date), "yyyy. MMM d.", { locale: hu })}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Elvégzett munka leírása</div>
            <div class="description">${sheet.description || "—"}</div>
          </div>

          ${sheet.notes ? `
          <div class="section">
            <div class="section-title">Megjegyzések</div>
            <div class="description">${sheet.notes}</div>
          </div>
          ` : ""}

          <div class="footer">
            <div>
              <div class="signature">Szerviz aláírás</div>
            </div>
            <div>
              <div class="signature">Ügyfél aláírás</div>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }, 100);
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
