import { useState } from "react";
import {
  Container,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
  Button,
  Avatar,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DevicesIcon from "@mui/icons-material/Devices";
import LogoutIcon from "@mui/icons-material/Logout";
import useAuth from "../hooks/useAuth";

const SettingsContent = ({displayName = 'guest ',email = 'example@gmail.com' }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(true);
  const { logout } = useAuth();

  // Simulated User Data
  const user = {
    name: displayName,
    email: email,
    profilePic: "https://via.placeholder.com/100",
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 , mb: 12}}>
      {/* Page Title */}
      <Typography variant="h4" fontWeight="bold" align="center" gutterBottom>
        Settings
      </Typography>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mt: 4 }}>
        {/* User Profile */}
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Profile
        </Typography>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar src={user.profilePic} sx={{ width: 70, height: 70 }} />
          </Grid>
          <Grid item>
            <Typography variant="h6">{user.name}</Typography>
            <Typography color="textSecondary">{user.email}</Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />

        {/* Preferences */}
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Preferences
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <NotificationsActiveIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Enable Notifications" />
            <Switch
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <DarkModeIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Dark Mode" />
            <Switch
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
          </ListItem>
        </List>
        <Divider sx={{ my: 3 }} />

        {/* Device Connection */}
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Device Status
        </Typography>
        <ListItem>
          <ListItemIcon>
            <DevicesIcon color={deviceConnected ? "success" : "error"} />
          </ListItemIcon>
          <ListItemText
            primary={deviceConnected ? "Dispenser Connected" : "Disconnected"}
          />
        </ListItem>
        <Divider sx={{ my: 3 }} />

        {/* Logout Button */}
        <Button
          variant="contained"
          color="error"
          fullWidth
          sx={{ mt: 2 }}
          startIcon={<LogoutIcon />}
        onClick={logout}>
          Logout
        </Button>
      </Paper>
    </Container>
  );
};

export default SettingsContent;
