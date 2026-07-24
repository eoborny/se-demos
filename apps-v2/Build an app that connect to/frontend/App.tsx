import { Routes, Route, Navigate } from "react-router-dom"
import "./brand.css"
import { OnboardingProvider } from "./store/OnboardingStore"
import { BrandHeader } from "./components/onboarding/BrandHeader"
import EmployeesPage from "./pages/EmployeesPage"
import EmployeeDetailPage from "./pages/EmployeeDetailPage"

export default function App() {
  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-background text-foreground">
        <BrandHeader />
        <Routes>
          <Route path="/" element={<EmployeesPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </OnboardingProvider>
  )
}
