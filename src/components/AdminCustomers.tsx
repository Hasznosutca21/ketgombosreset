import { useState, useEffect } from "react";
import { Users, Search, Edit2, Trash2, Loader2, Phone, Mail, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  note: string | null;
  birthday: string | null;
  privacy_policy_accepted_at: string | null;
  marketing_notifications_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminCustomersProps {
  language: "hu" | "en";
}

const translations = {
  hu: {
    customers: "Ügyfelek",
    customersDescription: "Reservio-ból importált ügyfél-nyilvántartás",
    searchPlaceholder: "Keresés név, email vagy telefon alapján...",
    name: "Név",
    email: "Email",
    phone: "Telefon",
    address: "Cím",
    note: "Megjegyzés",
    actions: "Műveletek",
    noCustomers: "Nincsenek ügyfelek",
    editCustomer: "Ügyfél szerkesztése",
    deleteCustomer: "Ügyfél törlése",
    deleteConfirmation: "Biztosan törölni szeretné ezt az ügyfelet?",
    save: "Mentés",
    cancel: "Mégse",
    delete: "Törlés",
    customerUpdated: "Ügyfél frissítve",
    customerDeleted: "Ügyfél törölve",
    failedToUpdate: "Nem sikerült frissíteni",
    failedToDelete: "Nem sikerült törölni",
    firstName: "Keresztnév",
    lastName: "Vezetéknév",
    marketingAccepted: "Marketing elfogadva",
    total: "Összesen",
  },
  en: {
    customers: "Customers",
    customersDescription: "Customer database imported from Reservio",
    searchPlaceholder: "Search by name, email or phone...",
    name: "Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    note: "Note",
    actions: "Actions",
    noCustomers: "No customers",
    editCustomer: "Edit Customer",
    deleteCustomer: "Delete Customer",
    deleteConfirmation: "Are you sure you want to delete this customer?",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    customerUpdated: "Customer updated",
    customerDeleted: "Customer deleted",
    failedToUpdate: "Failed to update",
    failedToDelete: "Failed to delete",
    firstName: "First Name",
    lastName: "Last Name",
    marketingAccepted: "Marketing accepted",
    total: "Total",
  },
};

const AdminCustomers = ({ language }: AdminCustomersProps) => {
  const t = translations[language];
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.first_name.toLowerCase().includes(query) ||
            c.last_name.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query) ||
            (c.phone && c.phone.includes(query))
        )
      );
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error(language === "hu" ? "Hiba az ügyfelek betöltésekor" : "Error loading customers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer({ ...customer });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingCustomer) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          first_name: editingCustomer.first_name,
          last_name: editingCustomer.last_name,
          email: editingCustomer.email,
          phone: editingCustomer.phone,
          address: editingCustomer.address,
          note: editingCustomer.note,
        })
        .eq("id", editingCustomer.id);

      if (error) throw error;

      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? editingCustomer : c))
      );
      toast.success(t.customerUpdated);
      setEditDialogOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error(t.failedToUpdate);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerToDelete.id);

      if (error) throw error;

      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
      toast.success(t.customerDeleted);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error(t.failedToDelete);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              {t.customers}
            </CardTitle>
            <CardDescription>
              {t.customersDescription} • {t.total}: {customers.length}
            </CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.noCustomers}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.email}</TableHead>
                  <TableHead>{t.phone}</TableHead>
                  <TableHead>{t.note}</TableHead>
                  <TableHead className="w-[100px]">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <p className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`mailto:${customer.email}`}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <a
                          href={`tel:${customer.phone}`}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {customer.note || "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(customer)}
                          title={t.editCustomer}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(customer)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title={t.deleteCustomer}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.editCustomer}</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.firstName}</Label>
                  <Input
                    value={editingCustomer.first_name}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.lastName}</Label>
                  <Input
                    value={editingCustomer.last_name}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.email}</Label>
                <Input
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t.phone}</Label>
                <Input
                  value={editingCustomer.phone || ""}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, phone: e.target.value || null })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t.address}</Label>
                <Input
                  value={editingCustomer.address || ""}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, address: e.target.value || null })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t.note}</Label>
                <Textarea
                  value={editingCustomer.note || ""}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, note: e.target.value || null })
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              {t.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteCustomer}</DialogTitle>
            <DialogDescription>{t.deleteConfirmation}</DialogDescription>
          </DialogHeader>
          {customerToDelete && (
            <p className="text-sm text-muted-foreground">
              {customerToDelete.first_name} {customerToDelete.last_name} ({customerToDelete.email})
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminCustomers;
