import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Header } from "@/components/Header";
import { OfflineWatcher } from "@/components/OfflineWatcher";
import { Home } from "@/pages/Home";
import { Details } from "@/pages/Details";
import { Favorites } from "@/pages/Favorites";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main
            id="main"
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"
          >
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/meal/:id" element={<Details />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <footer className="border-t py-6 text-center text-sm text-muted-foreground">
            Recipes PWA · data via TheMealDB proxy · favorites stored locally
          </footer>
        </div>
        <OfflineWatcher />
        <Toaster richColors position="bottom-center" closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
