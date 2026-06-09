import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import UploadReportPage from "@/pages/UploadReportPage";
import RoutePlannerPage from "@/pages/RoutePlannerPage";
import NotFoundPage from "@/pages/NotFoundPage";

/**
 * Centralized route configuration.
 *
 * Adding a new page is a single entry in the `children` array —
 * no structural rewrites needed.
 */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "upload", element: <UploadReportPage /> },
      { path: "route-planner", element: <RoutePlannerPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
