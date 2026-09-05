import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import LandingPage from "./pages/Landingpage";
import LoginPage from "./pages/Loginpage";
import SignupPage from "./pages/Signuppage";
import DashboardPage from "./pages/dashboardpage/DashboardPage";
import NewChatPage from "./pages/dashboardpage/NewChatPage";
import SettingsPage from "./pages/dashboardpage/SettingsPage";
import socket from "./lib/socket";

function App() {

useEffect(() => {
    const handleConnect = () => {
      console.log("Connected to socket:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("Disconnected from socket");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Connect socket
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/new-chat" element={<NewChatPage />} />
      <Route path="/settings" element={<SettingsPage />} />
     
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;