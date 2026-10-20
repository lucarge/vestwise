import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react"

import "./index.css"
import { AppLayout } from "@/components/app-layout"
import { ThemeProvider } from "@/components/theme-provider"
import { BackupSyncProvider } from "@/hooks/use-backup-sync"
import { captureGrantHandoff } from "@/lib/grant-handoff"
import { DashboardPage } from "@/pages/dashboard"
import { GrantsPage } from "@/pages/grants"
import { NewGrantPage } from "@/pages/new-grant"
import { PotentialPage } from "@/pages/potential"
import { SettingsPage } from "@/pages/settings"
import { ValuationsPage } from "@/pages/valuations"

// Before anything renders: a grant link's terms leave the address bar here
captureGrantHandoff()

// Analytics reports the full address, fragment included. Grant links are gone
// before its script loads; this keeps any fragment out of reports regardless.
function withoutFragment(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: event.url.split("#")[0] }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BackupSyncProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="grants" element={<GrantsPage />} />
              <Route path="grants/new" element={<NewGrantPage />} />
              <Route path="valuations" element={<ValuationsPage />} />
              <Route path="potential" element={<PotentialPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </BackupSyncProvider>
    </ThemeProvider>
    <Analytics beforeSend={withoutFragment} />
  </StrictMode>
)
