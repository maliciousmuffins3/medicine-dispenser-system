import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import TuneIcon from '@mui/icons-material/Tune';
import SettingsIcon from '@mui/icons-material/Settings';

const BottomNav = () => {
    const location = useLocation();
    const [selectedSection, setSelectedSection] = useState(location.pathname);
  
    useEffect(() => {
      setSelectedSection(location.pathname);
    }, [location]);
  
    return (
      <BottomNavigation
        sx={{
          position: "fixed",
          bottom: 0,
          width: "100%",
          backgroundColor: "#FFFFFF",
          boxShadow: "0px -2px 5px rgba(0, 0, 0, 0.1)", // Add shadow
        }}
        value={selectedSection}
        onChange={(event, newValue) => setSelectedSection(newValue)}
      >
        <BottomNavigationAction
          label="Home"
          value="/home"
          icon={<HomeIcon />}
          component={Link}
          to="/home"
          showLabel={true}
          sx={{
            backgroundColor: selectedSection === "/home" ? "#388E3C" : "transparent",
            color: selectedSection === "/home" ? "#FFFFFF" : "#388E3C",
            borderRadius: "0px", // Ensure no rounded corners
            "& .MuiBottomNavigationAction-label": { color: selectedSection === "/home" ? "#FFFFFF" : "#388E3C" },
            "& .MuiSvgIcon-root": { color: selectedSection === "/home" ? "#FFFFFF" : "#388E3C" }, // Icon color
          }}
        />
        <BottomNavigationAction
          label="History"
          value="/history"
          icon={<HistoryIcon />}
          component={Link}
          to="/history"
          showLabel={true}
          sx={{
            backgroundColor: selectedSection === "/history" ? "#388E3C" : "transparent",
            color: selectedSection === "/history" ? "#FFFFFF" : "#388E3C",
            borderRadius: "0px", // Ensure no rounded corners
            "& .MuiBottomNavigationAction-label": { color: selectedSection === "/history" ? "#FFFFFF" : "#388E3C" },
            "& .MuiSvgIcon-root": { color: selectedSection === "/history" ? "#FFFFFF" : "#388E3C" }, // Icon color
          }}
        />
        <BottomNavigationAction
          label="Controls"
          value="/controls"
          icon={<TuneIcon />}
          component={Link}
          to="/controls"
          showLabel={true}
          sx={{
            backgroundColor: selectedSection === "/controls" ? "#388E3C" : "transparent",
            color: selectedSection === "/controls" ? "#FFFFFF" : "#388E3C",
            borderRadius: "0px", // Ensure no rounded corners
            "& .MuiBottomNavigationAction-label": { color: selectedSection === "/controls" ? "#FFFFFF" : "#388E3C" },
            "& .MuiSvgIcon-root": { color: selectedSection === "/controls" ? "#FFFFFF" : "#388E3C" }, // Icon color
          }}
        />
        <BottomNavigationAction
          label="Settings"
          value="/settings"
          icon={<SettingsIcon />}
          component={Link}
          to="/settings"
          showLabel={true}
          sx={{
            backgroundColor: selectedSection === "/settings" ? "#388E3C" : "transparent",
            color: selectedSection === "/settings" ? "#FFFFFF" : "#388E3C",
            borderRadius: "0px", // Ensure no rounded corners
            "& .MuiBottomNavigationAction-label": { color: selectedSection === "/settings" ? "#FFFFFF" : "#388E3C" },
            "& .MuiSvgIcon-root": { color: selectedSection === "/settings" ? "#FFFFFF" : "#388E3C" }, // Icon color
          }}
        />
      </BottomNavigation>
    );
  };
  
export default BottomNav;