import { createBrowserRouter } from "react-router";
import { RootLayout, ProtectedRoute } from "./layouts/RootLayout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ProfileSetup } from "./pages/ProfileSetup";
import { Dashboard } from "./pages/Dashboard";
import { Applications } from "./pages/Applications";
import { AddApplication } from "./pages/AddApplication";
import { ApplicationDetail } from "./pages/ApplicationDetail";
import { Resumes } from "./pages/Resumes";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Login },
      { path: "register", Component: Register },
      { path: "setup", Component: ProfileSetup },
      { 
        path: "dashboard", 
        element: <ProtectedRoute><Dashboard /></ProtectedRoute> 
      },
      { 
        path: "applications", 
        element: <ProtectedRoute><Applications /></ProtectedRoute> 
      },
      { 
        path: "add-application", 
        element: <ProtectedRoute><AddApplication /></ProtectedRoute> 
      },
      { 
        path: "application/:id", 
        element: <ProtectedRoute><ApplicationDetail /></ProtectedRoute> 
      },
      { 
        path: "resumes", 
        element: <ProtectedRoute><Resumes /></ProtectedRoute> 
      },
      { 
        path: "analytics", 
        element: <ProtectedRoute><Analytics /></ProtectedRoute> 
      },
      { 
        path: "settings", 
        element: <ProtectedRoute><Settings /></ProtectedRoute> 
      },
    ],
  },
]);
