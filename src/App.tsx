import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Report from './pages/Report'
import Track from './pages/Track'
import Services from './pages/Services'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import OfficerLogin from './pages/OfficerLogin'
import OfficerPortal from './pages/OfficerPortal'
import { ThemeProvider } from './lib/theme'

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <Routes>
        {/* Public pages — shared Navbar + Footer */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<Report />} />
          <Route path="/track" element={<Track />} />
          <Route path="/services" element={<Services />} />
          <Route path="/login" element={<Login />} />
        </Route>
        {/* Standalone pages — own layout/header */}
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/officer-login" element={<OfficerLogin />} />
        <Route path="/officer-portal" element={<OfficerPortal />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  )
}
