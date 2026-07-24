import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/support/Layout'
import { Toaster } from './lib/shadcn/sonner'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tickets" element={<Tickets />} />
      </Routes>
      <Toaster />
    </Layout>
  )
}
