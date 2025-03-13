import React, { useState } from "react";
import {
  Container,
  Typography,
  Button,
  Switch,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Grid,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import MedicationIcon from "@mui/icons-material/Medication";
import InventoryIcon from "@mui/icons-material/Inventory";

const initialSchedules = [
  { id: 1, medicine: "Paracetamol", dose: "500mg", time: "08:00 AM" },
  { id: 2, medicine: "Aspirin", dose: "250mg", time: "12:00 PM" },
];

const initialMedicines = [
  { id: 1, name: "Paracetamol", dose: "500mg" },
  { id: 2, name: "Aspirin", dose: "250mg" },
];

const ControlsContent = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [schedules, setSchedules] = useState(initialSchedules);
  const [medicines, setMedicines] = useState(initialMedicines);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [openMedicineDialog, setOpenMedicineDialog] = useState(false); // New state for medicine dialog
  const [newSchedule, setNewSchedule] = useState({ medicine: "", dose: "", time: "" });
  const [newMedicine, setNewMedicine] = useState({ name: "", dose: "" }); // New state for new medicine details
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [notifyCaregiver, setNotifyCaregiver] = useState(true);

  const handleLockToggle = () => {
    setIsLocked((prev) => !prev);
  };

  const handleDispense = () => {
    alert("Medicine Dispensed!");
  };

  const handleAddSchedule = () => {
    if (newSchedule.medicine && newSchedule.dose && newSchedule.time) {
      setSchedules([...schedules, { id: Date.now(), ...newSchedule }]);
      setNewSchedule({ medicine: "", dose: "", time: "" });
      setOpenScheduleDialog(false);
    }
  };

  const handleAddMedicine = () => {
    if (newMedicine.name && newMedicine.dose) {
      setMedicines([...medicines, { id: Date.now(), ...newMedicine }]);
      setNewMedicine({ name: "", dose: "" });
      setOpenMedicineDialog(false);
    }
  };

  const handleDeleteSchedule = (id) => {
    setSchedules(schedules.filter((schedule) => schedule.id !== id));
  };

  const handleDeleteMedicine = (id) => {
    setMedicines(medicines.filter((medicine) => medicine.id !== id));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 12 }}>
      <Typography variant="h4" fontWeight="bold" align="center" gutterBottom>
        Controls
      </Typography>

      <Stack spacing={3}>
        {/* Dispense Medicine Button */}
        <Card>
          <CardContent>
            <Typography variant="h6">
              <MedicationIcon sx={{ mr: 1 }} /> Dispense Medicine
            </Typography>
            <Button variant="contained" color="primary" onClick={handleDispense} sx={{ mt: 1 }}>
              Dispense Now
            </Button>
          </CardContent>
        </Card>

        {/* Medicine Schedule Management */}
        <Card>
          <CardContent>
            <Typography variant="h6">
              <InventoryIcon sx={{ mr: 1 }} /> Medicine Schedule
            </Typography>
            <List>
              {schedules.map((schedule) => (
                <ListItem
                  key={schedule.id}
                  secondaryAction={
                    <IconButton color="error" onClick={() => handleDeleteSchedule(schedule.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary={`${schedule.medicine} - ${schedule.dose} at ${schedule.time}`} />
                </ListItem>
              ))}
            </List>
            <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setOpenScheduleDialog(true)}>
              Add Schedule
            </Button>
          </CardContent>
        </Card>

        {/* Medicine Management */}
        <Card>
          <CardContent>
            <Typography variant="h6">
              <InventoryIcon sx={{ mr: 1 }} /> Medicines
            </Typography>
            <List>
              {medicines.map((medicine) => (
                <ListItem
                  key={medicine.id}
                  secondaryAction={
                    <IconButton color="error" onClick={() => handleDeleteMedicine(medicine.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary={`${medicine.name} - ${medicine.dose}`} />
                </ListItem>
              ))}
            </List>
            <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setOpenMedicineDialog(true)}>
              Add Medicine
            </Button>
          </CardContent>
        </Card>

        {/* Lock/Unlock Dispenser */}
        <Card>
          <CardContent>
            <Typography variant="h6">
              {isLocked ? <LockIcon sx={{ mr: 1 }} /> : <LockOpenIcon sx={{ mr: 1 }} />} Dispenser Lock
            </Typography>
            <FormControlLabel
              control={<Switch checked={isLocked} onChange={handleLockToggle} />}
              label={isLocked ? "Dispenser Locked" : "Dispenser Unlocked"}
            />
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardContent>
            <Typography variant="h6">
              <InventoryIcon sx={{ mr: 1 }} /> Refill & Inventory
            </Typography>
            {lowStockAlert ? (
              <Typography color="error">
                <WarningIcon sx={{ verticalAlign: "middle", mr: 1 }} /> Paracetamol is running low! Only 5 tablets left.
              </Typography>
            ) : (
              <Typography color="success">
                <CheckCircleIcon sx={{ verticalAlign: "middle", mr: 1 }} /> All medicines are well-stocked.
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Notifications & Alerts */}
        <Card>
          <CardContent>
            <Typography variant="h6">
              <NotificationsActiveIcon sx={{ mr: 1 }} /> Notifications & Alerts
            </Typography>
            <FormControlLabel
              control={<Switch checked={notifyCaregiver} onChange={() => setNotifyCaregiver(!notifyCaregiver)} />}
              label="Notify Caregiver When a Dose is Missed"
            />
          </CardContent>
        </Card>
      </Stack>

      {/* Add Schedule Dialog */}
      <Dialog open={openScheduleDialog} onClose={() => setOpenScheduleDialog(false)}>
        <DialogTitle>Add New Schedule</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Medicine Name"
            value={newSchedule.medicine}
            onChange={(e) => setNewSchedule({ ...newSchedule, medicine: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Dose"
            value={newSchedule.dose}
            onChange={(e) => setNewSchedule({ ...newSchedule, dose: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Time"
            type="time"
            value={newSchedule.time}
            onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenScheduleDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleAddSchedule}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Medicine Dialog */}
      <Dialog open={openMedicineDialog} onClose={() => setOpenMedicineDialog(false)}>
        <DialogTitle>Add New Medicine</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Medicine Name"
            value={newMedicine.name}
            onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Dose"
            value={newMedicine.dose}
            onChange={(e) => setNewMedicine({ ...newMedicine, dose: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMedicineDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleAddMedicine}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ControlsContent;
