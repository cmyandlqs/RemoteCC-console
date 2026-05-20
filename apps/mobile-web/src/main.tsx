import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";

import { AppShell } from "./app/AppShell";
import { HostsPage } from "./features/HostsPage";
import { ProjectsPage } from "./features/ProjectsPage";
import { SessionPage } from "./features/SessionPage";
import "./styles.css";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HostsPage /> },
      { path: "projects/:projectId", element: <ProjectsPage /> },
    ],
  },
  {
    path: "/sessions/:sessionId",
    element: <AppShell />,
    children: [{ path: "", element: <SessionPage /> }],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);