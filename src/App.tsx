import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/lib/auth";
import { ArticleFormPage } from "@/pages/articles/ArticleFormPage";
import { ArticlesPage } from "@/pages/articles/ArticlesPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { GalleryPage } from "@/pages/gallery/GalleryPage";
import { LoginPage } from "@/pages/LoginPage";
import { MedicineFormPage } from "@/pages/medicines/MedicineFormPage";
import { MedicinesListPage } from "@/pages/medicines/MedicinesListPage";

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "not-configured"}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/medicines" element={<MedicinesListPage />} />
                  <Route path="/medicines/new" element={<MedicineFormPage />} />
                  <Route
                    path="/medicines/:id/edit"
                    element={<MedicineFormPage />}
                  />
                  <Route path="/articles" element={<ArticlesPage />} />
                  <Route path="/articles/new" element={<ArticleFormPage />} />
                  <Route
                    path="/articles/:id/edit"
                    element={<ArticleFormPage />}
                  />
                  <Route path="/gallery" element={<GalleryPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
