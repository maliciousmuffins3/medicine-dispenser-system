import React from 'react';
import { Box, Container, Typography, Button, Paper, Grid, Card, CardContent } from '@mui/material';
import AlarmIcon from '@mui/icons-material/Alarm';
import MedicationIcon from '@mui/icons-material/Medication';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ElderlyIcon from '@mui/icons-material/Elderly';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockIcon from '@mui/icons-material/Lock';

const features = [
    { title: "Automated Reminders", icon: <AlarmIcon fontSize="large" />, desc: "Timely alerts for scheduled medications." },
    { title: "Smart Dispenser", icon: <MedicationIcon fontSize="large" />, desc: "Dispenses the right medicine at the right time." },
    { title: "Caregiver Notifications", icon: <NotificationsActiveIcon fontSize="large" />, desc: "Keeps family and doctors informed." },
    { title: "Elderly-Friendly UI", icon: <ElderlyIcon fontSize="large" />, desc: "Simple and intuitive interface." },
    { title: "Accurate Medication Tracking", icon: <AccessTimeIcon fontSize="large" />, desc: "Logs and monitors patient medication history." },
    { title: "User Authentication", icon: <LockIcon fontSize="large" />, desc: "Secure access to personalized medication plans." }, // New card
  ];

const HomeContent = () => (
    <>
        <Box
            sx={{
                background: "linear-gradient(to right, #388E3C, #2C6B2F)",
                color: "white",
                textAlign: "center",
                py: 8,
                px: 3,
            }}
        >
            <Container maxWidth="lg">
                <Typography
                    variant="h3"
                    fontWeight="bold"
                    gutterBottom
                    sx={{
                        fontSize: "clamp(2rem, 5vw, 3.5rem)",
                    }}
                >
                    Medication Management System for the Elderly
                </Typography>
                <Typography
                    variant="h6"
                    sx={{
                        maxWidth: "700px",
                        margin: "auto",
                        opacity: 0.9,
                        fontSize: "clamp(1rem, 4vw, 1.5rem)",
                    }}
                >
                    A comprehensive solution to help elderly patients manage their medications accurately, track their medical history, and ensure timely dispensing.
                </Typography>
                <Box sx={{ mt: 4 }}>
                    <Button variant="contained" size="large" sx={{ backgroundColor: "#388E3C", padding: "12px 30px" }} href="#features">
                        Explore Features
                    </Button>
                </Box>
            </Container>
        </Box>

        <Container maxWidth="lg" sx={{ mt: 8 }}>
            <Paper elevation={4} sx={{ p: 5, borderRadius: 3, textAlign: "center" }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Why This Matters
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ maxWidth: "900px", margin: "auto" }}>
                    Millions of elderly individuals rely on medications to maintain their health. Forgetting to take prescribed
                    medicine or incorrect dosages can lead to severe health issues. Our solution reduces human error and ensures
                    timely medication intake.
                </Typography>
            </Paper>
        </Container>

        <Container maxWidth="lg" sx={{ mt: 8, mb: 12 }} id="features">
            <Typography variant="h5" fontWeight="bold" align="center" gutterBottom sx={{ marginBottom: '20px' }}>
                Key Features
            </Typography>
            <Grid container spacing={4} justifyContent="center">
                {features.map((feature, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card
                            elevation={3}
                            sx={{
                                 p: 3,
                                borderRadius: 3,
                                height: "100%",
                                display: "flex",
                                alignItems: "center", // Align items horizontally
                            }}
                        >
                            <Box sx={{ color: "#388E3C", fontSize: 50, mr: 2 }}>{feature.icon}</Box>
                            <CardContent sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight="bold">{feature.title}</Typography>
                                <Typography variant="body2" color="textSecondary">{feature.desc}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    </>
);

export default HomeContent;