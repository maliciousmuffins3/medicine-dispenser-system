import React from "react";
import { Container, Typography, Card, CardContent, Grid, Divider, List, ListItem, ListItemText, Box } from "@mui/material";

// Dummy history data (Replace with API data)
const historyData = [
  {
    id: 1,
    medicine: "Paracetamol",
    dose: "500mg",
    time: "08:00 AM",
    status: "Taken",
    previousHistory: [
      { time: "08:00 AM (Yesterday)", status: "Taken" },
      { time: "08:00 AM (2 days ago)", status: "Missed" },
      { time: "08:00 AM (3 days ago)", status: "Taken" },
    ],
  },
  {
    id: 2,
    medicine: "Aspirin",
    dose: "250mg",
    time: "12:00 PM",
    status: "Missed",
    previousHistory: [
      { time: "12:00 PM (Yesterday)", status: "Taken" },
      { time: "12:00 PM (2 days ago)", status: "Missed" },
      { time: "12:00 PM (3 days ago)", status: "Missed" },
    ],
  },
  {
    id: 3,
    medicine: "Vitamin C",
    dose: "1000mg",
    time: "06:00 PM",
    status: "Taken",
    previousHistory: [
      { time: "06:00 PM (Yesterday)", status: "Missed" },
      { time: "06:00 PM (2 days ago)", status: "Taken" },
      { time: "06:00 PM (3 days ago)", status: "Taken" },
    ],
  },
];

const HistoryCard = ({ medicine, dose, time, status, previousHistory }) => (
  <Box sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}> {/* Outer box to group both cards */}
    {/* Current Medication Record */}
    <Card
      sx={{
        backgroundColor: status === "Missed" ? "#ffebee" : "#e8f5e9",
        borderRadius: "12px 12px 0 0", // Rounded top corners only
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight="bold">{medicine}</Typography>
        <Typography variant="body2">Dose: {dose}</Typography>
        <Typography variant="body2">Time: {time}</Typography>
        <Typography variant="body2" color={status === "Missed" ? "error" : "success"}>
          Status: {status}
        </Typography>
      </CardContent>
    </Card>

    {/* Previous History List Below (Connected to first card) */}
    <Card sx={{ backgroundColor: "#f5f5f5", borderRadius: "0 0 12px 12px" }}> {/* Rounded bottom corners */}
      <CardContent>
        <Typography variant="subtitle1" fontWeight="bold">
          Previous Dispensing History
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <List sx={{ maxHeight: 150, overflow: "auto" }}> {/* Scrollable */}
          {previousHistory.map((record, index) => (
            <ListItem key={index} sx={{ py: 0 }}>
              <ListItemText
                primary={record.time}
                secondary={
                  <Typography color={record.status === "Missed" ? "error" : "success"} variant="body2">
                    Status: {record.status}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  </Box>
);

const HistoryContent = () => (
  <Container maxWidth="md" sx={{ mt: 4 }}>
    <Typography variant="h4" fontWeight="bold" align="center" gutterBottom>
      Medication History
    </Typography>
    <Grid container spacing={2}>
      {historyData.map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item.id}>
          <HistoryCard {...item} />
        </Grid>
      ))}
    </Grid>
    <Container sx={{ mt: 4 }}>
  <Typography variant="h6" fontWeight="bold">Next Scheduled Dose</Typography>
  <Card sx={{ backgroundColor: "#e3f2fd", p: 2, mt: 1 }}>
    <Typography variant="body1"><strong>Paracetamol</strong> - 500mg</Typography>
    <Typography variant="body2">Scheduled at: 12:00 PM</Typography>
    <Typography variant="body2" color="primary">Next dose in: 1 hour 30 minutes</Typography>
  </Card>
</Container>

  </Container>
  
);

export default HistoryContent;
