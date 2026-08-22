import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import RegisterFarmPage from './pages/RegisterFarmPage'
import FarmsListPage from './pages/FarmsListPage'
import DashboardPage from './pages/DashboardPage'
import SatelliteViewPage from './pages/SatelliteViewPage'
import ClaimVerificationPage from './pages/ClaimVerificationPage'
import LedgerPage from './pages/LedgerPage'
import InsurerDashboardPage from './pages/InsurerDashboardPage'
import FarmerOnboardPage from './pages/FarmerOnboardPage'
import WeatherForecastPage from './pages/WeatherForecastPage'
import MarketInsightsPage from './pages/MarketInsightsPage'
import PitchDeckPage from './pages/PitchDeckPage'
import CropDoctorPage from './pages/CropDoctorPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 w-full overflow-x-hidden pt-16">
          <Routes>
            <Route path="/"                              element={<LandingPage />} />
            <Route path="/onboard"                      element={<FarmerOnboardPage />} />
            <Route path="/register"                      element={<RegisterFarmPage />} />
            <Route path="/farms"                         element={<FarmsListPage />} />
            <Route path="/doctor"                        element={<CropDoctorPage />} />
            <Route path="/weather"                       element={<WeatherForecastPage />} />
            <Route path="/market"                        element={<MarketInsightsPage />} />
            <Route path="/dashboard/:farmId"             element={<DashboardPage />} />
            <Route path="/dashboard/:farmId/satellite"   element={<SatelliteViewPage />} />
            <Route path="/claim/:claimId"                element={<ClaimVerificationPage />} />
            <Route path="/ledger"                        element={<LedgerPage />} />
            <Route path="/insurer"                       element={<InsurerDashboardPage />} />
            <Route path="/pitch"                          element={<PitchDeckPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
