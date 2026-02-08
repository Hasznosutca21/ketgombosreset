import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeleteAccountDialogProps {
  trigger?: React.ReactNode;
}

const DeleteAccountDialog = ({ trigger }: DeleteAccountDialogProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!password) {
      setError(t.passwordRequired || "Password is required");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError(t.notAuthenticated || "Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Invalid password") {
          setError(t.invalidPassword || "Invalid password");
        } else {
          setError(data.error || t.failedToDeleteAccount || "Failed to delete account");
        }
        return;
      }

      // Sign out and redirect
      await signOut();
      toast.success(t.accountDeleted || "Your account has been deleted");
      navigate("/");
    } catch (err) {
      console.error("Error deleting account:", err);
      setError(t.failedToDeleteAccount || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPassword("");
      setError(null);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" className="w-full">
            {t.deleteAccount || "Delete Account"}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t.deleteAccountTitle || "Delete Account"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              {t.deleteAccountWarning ||
                "This action cannot be undone. This will permanently delete your account and remove all your data from our servers."}
            </p>
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-password">
                {t.enterPasswordToConfirm || "Enter your password to confirm"}
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder={t.password}
                className={error ? "border-destructive" : ""}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t.cancel}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !password}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.deleteAccountConfirm || "Yes, delete my account"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
