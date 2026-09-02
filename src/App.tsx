import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LandingPage from "./pages/Landingpage";
import LoginPage from "./pages/Loginpage";
import SignupPage from "./pages/Signuppage";
import DashboardPage from "./pages/dashboardpage/DashboardPage";
import SettingsPage from "./pages/dashboardpage/SettingsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/settings" element={<SettingsPage />} />
     
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;