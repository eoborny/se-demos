import { Routes, Route, Navigate } from 'react-router-dom'
import './appTheme.css'
import { ConsoleProvider, useConsole } from './context/ConsoleContext'
import { Layout } from './components/console/Layout'
import { Toaster } from './lib/shadcn/sonner'
import { Role } from './lib/console/types'
import QueuePage from './pages/QueuePage'
import DraftReviewPage from './pages/DraftReviewPage'
import ApproverQueuePage from './pages/ApproverQueuePage'
import AnalyticsPage from './pages/AnalyticsPage'
import AuditLogPage from './pages/AuditLogPage'
import AdminPage from './pages/AdminPage'
import PlaybooksPage from './pages/PlaybooksPage'
import PlaybookDetailPage from './pages/PlaybookDetailPage'
import ExperimentResultsPage from './pages/ExperimentResultsPage'
import { ShieldAlert } from 'lucide-react'

function AccessDenied() {
  return (
    <div className="mx-auto max-w-md p-10 text-center">
      <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
      <h2 className="text-lg font-semibold text-foreground">You don&apos;t have access to this view</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your role doesn&apos;t include this area. Switch roles from the menu in the top-right to explore other views.
      </p>
    </div>
  )
}

function Guard({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const { role } = useConsole()
  return allow.includes(role) ? <>{children}</> : <AccessDenied />
}

function IndexRoute() {
  const { role } = useConsole()
  if (role === 'approver') return <Navigate to="/approvals" replace />
  if (role === 'revops') return <Navigate to="/analytics" replace />
  return <QueuePage />
}

function Shell() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<IndexRoute />} />
        <Route path="/draft/:id" element={<DraftReviewPage />} />
        <Route path="/approvals" element={<Guard allow={['approver', 'admin']}><ApproverQueuePage /></Guard>} />
        <Route path="/analytics" element={<Guard allow={['manager', 'admin', 'revops']}><AnalyticsPage /></Guard>} />
        <Route path="/playbooks" element={<Guard allow={['manager', 'admin', 'revops']}><PlaybooksPage /></Guard>} />
        <Route path="/playbooks/:id" element={<Guard allow={['manager', 'admin', 'revops']}><PlaybookDetailPage /></Guard>} />
        <Route path="/experiments/:id" element={<Guard allow={['manager', 'admin', 'revops']}><ExperimentResultsPage /></Guard>} />
        <Route path="/audit" element={<Guard allow={['manager', 'admin', 'approver']}><AuditLogPage /></Guard>} />
        <Route path="/admin" element={<Guard allow={['admin']}><AdminPage /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <ConsoleProvider>
      <Shell />
      <Toaster />
    </ConsoleProvider>
  )
}
