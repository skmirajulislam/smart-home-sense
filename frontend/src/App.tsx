import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import RoomDetail from "./pages/RoomDetail";
import { AlertsPage } from "./pages/AlertsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();
const router = createBrowserRouter(
  [
    {
      path: "/",
      element: (
        <AppLayout>
          <Outlet />
        </AppLayout>
      ),
      children: [
        { index: true, element: <Dashboard /> },
        { path: "room/:id", element: <RoomDetail /> },
        { path: "alerts", element: <AlertsPage /> },
        { path: "settings", element: <SettingsPage /> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => {
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (!theme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        localStorage.setItem('theme', 'light');
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
