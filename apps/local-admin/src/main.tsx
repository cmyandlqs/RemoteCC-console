import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";

import { AppShell } from "./app/AppShell";
import { OverviewPage } from "./features/OverviewPage";
import { ProjectsPage } from "./features/ProjectsPage";
import { ProjectSessionsPage } from "./features/ProjectSessionsPage";
import { ApprovalsPage } from "./features/ApprovalsPage";
import { PairingPage } from "./features/PairingPage";
import "./styles.css";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:projectId/sessions", element: <ProjectSessionsPage /> },
      { path: "approvals", element: <ApprovalsPage /> },
      { path: "pairing", element: <PairingPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);