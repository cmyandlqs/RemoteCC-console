import { createBrowserRouter, RouterProvider, useRouteError } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";

import { AppShell } from "./app/AppShell";
import { HostsPage } from "./features/HostsPage";
import { ProjectsPage } from "./features/ProjectsPage";
import { SessionPage } from "./features/SessionPage";
import "./styles.css";

function ErrorBoundary() {
  const error = useRouteError() as Error & { status?: number; statusText?: string; data?: string };
  return (
    <div style={{ padding: 24 }}>
      <h2>Error: {error.status ?? "Unknown"}</h2>
      <p>{error.message ?? error.statusText ?? error.data ?? JSON.stringify(error)}</p>
      <pre style={{ fontSize: 12, overflow: "auto", background: "#f5f5f5", padding: 12 }}>
        {error.stack ?? ""}
      </pre>
    </div>
  );
}

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <HostsPage /> },
      { path: "projects/:projectId", element: <ProjectsPage /> },
    ],
  },
  {
    path: "/sessions/:sessionId",
    element: <AppShell />,
    errorElement: <ErrorBoundary />,
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