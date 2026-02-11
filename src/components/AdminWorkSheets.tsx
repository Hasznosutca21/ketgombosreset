import { useLanguage } from "@/hooks/useLanguage";

const AdminWorkSheets = () => {
  const { language } = useLanguage();
  return (
    <div className="text-center py-8 text-muted-foreground">
      {language === "hu" ? "Munkalapok átállítás alatt az új API-ra." : "Work sheets migration to new API in progress."}
    </div>
  );
};

export default AdminWorkSheets;
