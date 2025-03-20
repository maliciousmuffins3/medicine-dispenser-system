import { Typography, Box, AppBar, Toolbar } from "@mui/material";
import BottomNav from "./components/BottomNav";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import logo from "./assets/logo.png";
import SettingsContent from "./pages/SettingsContent";
import HomeContent from "./pages/HomeContent";
import HistoryContent from "./pages/HistoryContent";
import ControlsContent from "./pages/ControlsContent";
import useAuth from "./hooks/useAuth";
import Login from "./pages/Login";
import LoadingOverlay from "./components/LoadingOverlay";
import { useEffect, useState } from "react";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import {db, app} from './firebase/firebaseConfig'

const App = () => {
  const { user, loading, logout } = useAuth(); // Get user & loading state

  // If loading, show loading overlay
  if (loading) {
    return <LoadingOverlay open={loading} />;
  }

  return (
<Router>
  {loading ? (
    <LoadingOverlay open={loading} />
  ) : user ? (
    <>
      <AppBar position="sticky" sx={{ backgroundColor: "#FFFFFF", padding: "10px 0" }}>
        <Toolbar sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box component="img" src={logo} alt="Logo" sx={{ height: { xs: 40, sm: 50, md: 60 }, width: "auto" }} />
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ color: "#388E3C", flexGrow: 1, textAlign: { xs: "center", md: "left" }, fontSize: "clamp(1rem, 2.5vw, 1.8rem)" }}
          >
            Medication Management System
          </Typography>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<HomeContent />} />
        <Route path="/home" element={<HomeContent />} />
        <Route path="/history" element={<HistoryContent />} />
        <Route path="/controls" element={<ControlsContent userUid={user.uid}/>} />
        <Route path="/settings" element={<SettingsContent displayName={user.displayName} email={user.email} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <BottomNav />
    </>
  ) : (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ForgotPassword />} />
      <Route path="*" element={<Navigate to="/login" />} />
      <Route path="/sign-up" element={<SignUp />} />
    </Routes>
  )}
</Router>

  );
};

export default App;
