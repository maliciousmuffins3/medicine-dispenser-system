import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    Paper,
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
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DevicesIcon from "@mui/icons-material/Devices";
import LogoutIcon from "@mui/icons-material/Logout";
import useAuth from "../hooks/useAuth";
import { getDatabase, ref, onValue } from "firebase/database";

// SettingsContent Component
const SettingsContent = ({ displayName = 'guest ', email = 'example@gmail.com', app }) => {
    const [darkMode, setDarkMode] = useState(false);
    const [deviceConnected, setDeviceConnected] = useState(false);
    const { logout, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const realtimeDb = getDatabase(app);

    const [userData, setUserData] = useState({
        name: displayName,
        email: email,
        profilePic: "https://via.placeholder.com/100",
    });

    useEffect(() => {
        if (user) {
            const configRef = ref(realtimeDb, `config/${user.uid}`);
            const unsubscribeConfig = onValue(configRef, (snapshot) => {
                const configData = snapshot.val();
                if (configData) {
                    setDarkMode(configData.darkMode || false);
                }
                setLoading(false);
            });

            // ***CRITICAL:*** Use the *user's* UID to get the device status.
            const deviceStatusRef = ref(realtimeDb, `/config/${user.uid}/device/connected`);  // ***CHANGED PATH***
            const unsubscribeDevice = onValue(deviceStatusRef, (snapshot) => {
                const isConnected = snapshot.val();
                console.log("Device Status from Firebase:", isConnected);
                setDeviceConnected(isConnected === true);
            });

            setUserData({
                name: user.displayName || displayName,
                email: email || email,
                profilePic: user.photoURL || "https://via.placeholder.com/100"
            });

            return () => {
                unsubscribeConfig();
                unsubscribeDevice();
            };
        } else {
            setLoading(false);
        }
    }, [realtimeDb, user, displayName, email]);



    const handleDarkModeChange = (checked) => {
        setDarkMode(checked);
    };

    const handleLogout = () => {
        logout().then(() => {
            window.location.reload(); // Reload the page after successful logout
        });
    };

    if (loading) {
        return <></>;
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 8, mb: 12 }}>
            <Typography variant="h4" fontWeight="bold" align="center" gutterBottom>
                Settings
            </Typography>

            <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mt: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Profile
                </Typography>
                <Grid container alignItems="center" spacing={2}>
                    <Grid item>
                        <Avatar src={userData.profilePic} sx={{ width: 70, height: 70 }} />
                    </Grid>
                    <Grid item>
                        <Typography variant="h6">{userData.name}</Typography>
                        <Typography color="textSecondary">{userData.email}</Typography>
                    </Grid>
                </Grid>
                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Preferences
                </Typography>
                <List>
                    <ListItem>
                        <ListItemIcon>
                            <DarkModeIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Dark Mode" />
                        <Switch
                            checked={darkMode}
                            onChange={(e) => handleDarkModeChange(e.target.checked)}
                        />
                    </ListItem>
                </List>
                <Divider sx={{ my: 3 }} />

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


                <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    sx={{ mt: 2 }}
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout} // Use the new handleLogout function
                >
                    Logout
                </Button>
            </Paper>
        </Container>
    );
};

export default SettingsContent;
