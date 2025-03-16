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
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import WarningIcon from "@mui/icons-material/Warning";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import MedicationIcon from "@mui/icons-material/Medication";
import InventoryIcon from "@mui/icons-material/Inventory";
import useMedicine from "../hooks/useMedicine";

const MAX_MEDICINES = 3;

const ControlsContent = ({ uid = '' }) => {
  const {
    medicinesData = [],  // Defaulting to empty array
    schedulesData = [],  // Defaulting to empty array
    addMedicine,
    editMedicine,
    deleteMedicine,
    addSchedule,
    editSchedule,
    deleteSchedule,
  } = useMedicine('medicines', 'schedules');
  
  
  const [isLocked, setIsLocked] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [openMedicineDialog, setOpenMedicineDialog] = useState(false);
  const [openEditScheduleDialog, setOpenEditScheduleDialog] = useState(false);
  const [openEditMedicineDialog, setOpenEditMedicineDialog] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ medicine: "", dose: "", time: "" });
  const [newMedicine, setNewMedicine] = useState({ name: "", dose: "" });
  const [editScheduleData, setEditScheduleData] = useState({ id: "", medicine: "", dose: "", time: "" });
  const [editMedicineData, setEditMedicineData] = useState({ id: "", name: "", dose: "" });

  const handleLockToggle = () => {
    setIsLocked((prev) => !prev);
  };

  const handleDispense = () => {
    alert("Medicine Dispensed!");
  };

  const handleAddSchedule = () => {
    if (newSchedule.medicine && newSchedule.dose && newSchedule.time) {
      addSchedule({...newSchedule,uid});
      setNewSchedule({ medicine: "", dose: "", time: "" });
      setOpenScheduleDialog(false);
    }
  };

  const handleAddMedicine = () => {
    if (newMedicine.name && newMedicine.dose) {
      if (medicinesData.length >= MAX_MEDICINES) {
        alert(`You can only add up to ${MAX_MEDICINES} medicines.`);
        return;
      }

      addMedicine({...newMedicine,uid});
      setNewMedicine({ name: "", dose: ""});
      setOpenMedicineDialog(false);
    }
  };

  const handleEditSchedule = () => {
    console.log("Editing schedule:", editScheduleData);  // Debugging
  
    if (editScheduleData.medicine && editScheduleData.dose && editScheduleData.time) {
      editSchedule(editScheduleData.id, editScheduleData);
      setOpenEditScheduleDialog(false);
      setEditScheduleData({ id: "", medicine: "", dose: "", time: "" });
    }
  };
  

  const handleEditMedicine = () => {
    if (editMedicineData.name && editMedicineData.dose) {
      editMedicine(editMedicineData);
      setOpenEditMedicineDialog(false);
      setEditMedicineData({ id: "", name: "", dose: "" });
    }
  };

  const handleDeleteSchedule = (id) => {
    deleteSchedule(id);
  };

  const handleDeleteMedicine = (id) => {
    deleteMedicine(id);
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
              {schedulesData.map((schedule) => (
                <ListItem
                  key={schedule.id}
                  secondaryAction={
                    <>
                      <IconButton color="primary" onClick={() => {
                        setEditScheduleData(schedule);
                        setOpenEditScheduleDialog(true);
                      }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteSchedule(schedule.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </>
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
              {medicinesData.map((medicine) => (
                <ListItem
                  key={medicine.id}
                  secondaryAction={
                    <>
                      <IconButton color="primary" onClick={() => {
                        setEditMedicineData(medicine);
                        setOpenEditMedicineDialog(true);
                      }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteMedicine(medicine.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                >
                  <ListItemText primary={`${medicine.name} - ${medicine.dose}`} />
                </ListItem>
              ))}
            </List>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => setOpenMedicineDialog(true)}
              disabled={medicinesData.length >= MAX_MEDICINES}
            >
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
            <Typography color="error">
              <WarningIcon sx={{ verticalAlign: "middle", mr: 1 }} /> Paracetamol is running low! Only 5 tablets left.
            </Typography>
          </CardContent>
        </Card>

        {/* Notifications & Alerts */}
        <Card>
          <CardContent>
            <Typography variant="h6">
              <NotificationsActiveIcon sx={{ mr: 1 }} /> Notifications & Alerts
            </Typography>
            <FormControlLabel
              control={<Switch checked={true} />}
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

      {/* Edit Schedule Dialog */}
      <Dialog open={openEditScheduleDialog} onClose={() => setOpenEditScheduleDialog(false)}>
        <DialogTitle>Edit Schedule</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Medicine Name"
            value={editScheduleData.medicine}
            onChange={(e) => setEditScheduleData({ ...editScheduleData, medicine: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Dose"
            value={editScheduleData.dose}
            onChange={(e) => setEditScheduleData({ ...editScheduleData, dose: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Time"
            type="time"
            value={editScheduleData.time}
            onChange={(e) => setEditScheduleData({ ...editScheduleData, time: e.target.value })}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditScheduleDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleEditSchedule}>
            Save
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

      {/* Edit Medicine Dialog */}
      <Dialog open={openEditMedicineDialog} onClose={() => setOpenEditMedicineDialog(false)}>
        <DialogTitle>Edit Medicine</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Medicine Name"
            value={editMedicineData.name}
            onChange={(e) => setEditMedicineData({ ...editMedicineData, name: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Dose"
            value={editMedicineData.dose}
            onChange={(e) => setEditMedicineData({ ...editMedicineData, dose: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditMedicineDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleEditMedicine}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ControlsContent;