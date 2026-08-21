import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import RegisterFarmPage from './pages/RegisterFarmPage'
import FarmsListPage from './pages/FarmsListPage'
import DashboardPage from './pages/DashboardPage'
import SatelliteViewPage from './pages/SatelliteViewPage'
import ClaimVerificationPage from './pages/ClaimVerificationPage'
import LedgerPage from './pages/LedgerPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-900 flex flex-col">
        <Navbar />
        <main className="flex-1 w-full overflow-x-hidden">
          <Routes>
            <Route path="/"                              element={<LandingPage />} />
            <Route path="/register"                      element={<RegisterFarmPage />} />
            <Route path="/farms"                         element={<FarmsListPage />} />
            <Route path="/dashboard/:farmId"             element={<DashboardPage />} />
            <Route path="/dashboard/:farmId/satellite"   element={<SatelliteViewPage />} />
            <Route path="/claim/:claimId"                element={<ClaimVerificationPage />} />
            <Route path="/ledger"                        element={<LedgerPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
