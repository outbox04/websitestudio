import { Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/components/dashboard/Dashboard";
import { CardImportPage } from "@/pages/CardImportPage";
import { CustomerAlbumsPage } from "@/pages/CustomerAlbumsPage";
import { EditSyncPage } from "@/pages/EditSyncPage";
import { AccountingPage } from "@/pages/AccountingPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { GoogleOAuthCallbackPage } from "@/pages/GoogleOAuthCallbackPage";

export default function App() {
  return (
    <Routes>
      <Route path="oauth/google/callback" element={<GoogleOAuthCallbackPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="nhap-the-nho" element={<CardImportPage />} />
        <Route path="album-khach-hang" element={<CustomerAlbumsPage />} />
        <Route path="dong-bo-chinh-sua" element={<EditSyncPage />} />
        <Route path="ke-toan" element={<AccountingPage />} />
        <Route path="khach-hang" element={<CustomersPage />} />
        <Route path="cai-dat" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
