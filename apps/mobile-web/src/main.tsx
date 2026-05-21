import { createBrowserRouter, RouterProvider, useRouteError } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";

import { AppShell } from "./app/AppShell";
import { HostsPage } from "./features/HostsPage";
import { ProjectsPage } from "./features/ProjectsPage";
import { SessionPage } from "./features/SessionPage";
import { ApprovalsPage } from "./features/ApprovalsPage";
import "./styles.css";

function ErrorBoundary() {
  const error = useRouteError() as Error & { status?: number; statusText?: string; data?: string };
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <p className="text-sm font-medium text-[var(--color-text-primary)]">
        {error.status ? `${error.status}` : "出错了"}
      </p>
      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
        {error.message ?? error.statusText ?? error.data ?? "页面未找到"}
      </p>
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
      { path: "approvals", element: <ApprovalsPage /> },
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
