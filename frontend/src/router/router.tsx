import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import UploadReportPage from "@/pages/UploadReportPage";
import RoutePlannerPage from "@/pages/RoutePlannerPage";
import NotFoundPage from "@/pages/NotFoundPage";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import ChatPage from "@/pages/ChatPage";

/**
 * Centralized route configuration.
 */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "upload", element: <UploadReportPage /> },
      { path: "route-planner", element: <RoutePlannerPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignUpPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "chat", element: <ChatPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
