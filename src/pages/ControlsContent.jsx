import React, { useState, useEffect } from "react";
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
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    FormHelperText,
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
import {
    collection,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue, set, update } from "firebase/database"; // Import update
import LoadingOverlay from "../components/LoadingOverlay";

const ControlsContent = ({ db, app }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
    const [openMedicineDialog, setOpenMedicineDialog] = useState(false);
    const [newSchedule, setNewSchedule] = useState({ medicineId: "", time: "" }); // Changed:  medicineId, no dose
    const [newMedicine, setNewMedicine] = useState({ name: "", dose: "" });
    const [lowStockAlert, setLowStockAlert] = useState(false);
    const [notifyCaregiver, setNotifyCaregiver] = useState(true);
    const [loading, setLoading] = useState(true);
    const [userUid, setUserUid] = useState(null);
    const [stockLevels, setStockLevels] = useState({});
    const [isDispensing, setIsDispensing] = useState(false); // New state for dispensing status

    const auth = getAuth();
    const realtimeDb = getDatabase(app);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserUid(user.uid);
            } else {
                setUserUid(null);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, [auth]);

    useEffect(() => {
        if (userUid) {
            const fetchInitialData = async () => {
                setLoading(true);
                try {
                    // Fetch Medicines and set up real-time listener (Firestore)
                    const medicineDocRef = doc(db, "medicine", userUid);

                    const unsubscribeMedicine = onSnapshot(medicineDocRef, (medicineDocSnap) => {
                        if (medicineDocSnap.exists()) {
                            const medicineData = medicineDocSnap.data();
                            const medicinesArray = Object.entries(medicineData).map(([id, { name, dose }]) => ({
                                id,
                                name,
                                dose,
                            }));
                            setMedicines(medicinesArray);
                        } else {
                            setMedicines([]);
                        }
                    });

                    // Fetch Schedules and set up real-time listener (Firestore)
                    const scheduleDocRef = doc(db, "schedule", userUid);
                    const unsubscribeSchedule = onSnapshot(scheduleDocRef, (scheduleDocSnap) => {
                        if (scheduleDocSnap.exists()) {
                            const scheduleData = scheduleDocSnap.data();
                            const schedulesArray = Object.entries(scheduleData).map(([id, { medicineId, time }]) => { // Changed: medicineId
                                const medicine = medicines.find((m) => m.id === medicineId); // Find medicine
                                return {
                                    id,
                                    medicineName: medicine ? medicine.name : "Unknown", // Store name,
                                    dose: medicine ? medicine.dose : "Unknown",     //and dose
                                    medicineId, // Keep the ID
                                    time,
                                };
                            });
                            setSchedules(schedulesArray);
                        } else {
                            setSchedules([]);
                        }
                    });

                    // Fetch config and stock levels from Realtime Database
                    const configRef = ref(realtimeDb, `config/${userUid}`);
                    const unsubscribeConfig = onValue(configRef, (snapshot) => {
                        const configData = snapshot.val();
                        if (configData) {
                            setIsLocked(configData.isLocked || false);
                            setNotifyCaregiver(configData.notifyCaregiver);
                            setStockLevels(configData.stockLevels || {});
                            setIsDispensing(configData.isDispensing || false); // Get dispensing status
                            let hasLowStock = false;
                            for (const medicineName in configData.stockLevels) {
                                if (configData.stockLevels[medicineName] <= 5) {
                                    hasLowStock = true;
                                    break;
                                }
                            }
                            setLowStockAlert(hasLowStock);
                        } else {
                            setIsLocked(false);
                            setNotifyCaregiver(true);
                            setStockLevels({});
                            setLowStockAlert(false);
                            setIsDispensing(false);
                        }
                    });

                    setLoading(false);
                    return () => {
                        unsubscribeMedicine();
                        unsubscribeSchedule();
                        unsubscribeConfig();
                    };
                } catch (error) {
                    console.error("Error fetching data:", error);
                    setLoading(false);
                }
            };
            fetchInitialData();
        }
    }, [db, realtimeDb, userUid, medicines]);

    const updateFirestoreData = async (collectionName, docId, data) => {
        try {
            const docRef = doc(db, collectionName, docId);
            await setDoc(docRef, data);
        } catch (error) {
            console.error(`Error updating ${collectionName}:`, error);
        }
    };

    const updateRealtimeData = async (path, data) => {
        try {
            const dataRef = ref(realtimeDb, path);
            await set(dataRef, data);
        } catch (error) {
            console.error("Error updating Realtime Database:", error);
        }
    };

    const handleLockToggle = async () => {
        const newLockState = !isLocked;
        setIsLocked(newLockState);
        if (userUid) {
            await updateRealtimeData(`config/${userUid}/isLocked`, newLockState);
        }
    };

    const handleDispense = async () => {
        if (userUid) {
            setIsDispensing(true); // Set local state immediately
            await updateRealtimeData(`config/${userUid}/isDispensing`, true); // Set in DB

            // Simulate the 2-second delay using a Promise
            await new Promise(resolve => setTimeout(resolve, 2000));

            setIsDispensing(false);  // Update local state
            await updateRealtimeData(`config/${userUid}/isDispensing`, false); // Reset in DB
        }
    };

    const handleAddSchedule = async () => {
        if (newSchedule.medicineId && newSchedule.time && userUid) { // Changed: Check for medicineId
            const newScheduleId = Date.now().toString();
            const scheduleData = {
                [newScheduleId]: {
                    medicineId: newSchedule.medicineId, // Store ID
                    time: newSchedule.time,
                },
            };

            try {
                const scheduleDocRef = doc(db, "schedule", userUid);
                const scheduleDocSnap = await getDoc(scheduleDocRef);
                let currentScheduleData = {};
                if (scheduleDocSnap.exists()) {
                    currentScheduleData = scheduleDocSnap.data();
                }
                const updatedScheduleData = { ...currentScheduleData, ...scheduleData };

                await setDoc(scheduleDocRef, updatedScheduleData);
                setNewSchedule({ medicineId: "", time: "" }); // Clear
                setOpenScheduleDialog(false);
            } catch (error) {
                console.error("Error adding schedule:", error);
            }
        }
    };

    const handleAddMedicine = async () => {
        if (newMedicine.name && newMedicine.dose && userUid) {
            const newMedicineId = Date.now().toString();
            const medicineData = {
                [newMedicineId]: {
                    name: newMedicine.name,
                    dose: newMedicine.dose,
                },
            };

            try {
                const medicineDocRef = doc(db, "medicine", userUid);
                const medicineDocSnap = await getDoc(medicineDocRef);
                let currentMedicineData = {};
                if (medicineDocSnap.exists()) {
                    currentMedicineData = medicineDocSnap.data();
                }
                const updatedMedicineData = { ...currentMedicineData, ...medicineData };
                await setDoc(medicineDocRef, updatedMedicineData);

                // Also add to stock levels in RTDB, initialize with 0.
                await updateRealtimeData(`config/${userUid}/stockLevels/${newMedicine.name}`, 0);
                setNewMedicine({ name: "", dose: "" });
                setOpenMedicineDialog(false);
            } catch (error) {
                console.error("Error adding medicine:", error);
            }
        }
    };

    const handleDeleteSchedule = async (id) => {
        if (userUid) {
            try {
                const scheduleDocRef = doc(db, "schedule", userUid);
                const scheduleDocSnap = await getDoc(scheduleDocRef);
                if (scheduleDocSnap.exists()) {
                    const currentScheduleData = scheduleDocSnap.data();
                    const updatedScheduleData = { ...currentScheduleData };
                    delete updatedScheduleData[id];

                    await setDoc(scheduleDocRef, updatedScheduleData);
                }
            } catch (error) {
                console.error("Error deleting schedule:", error);
            }
        }
    };

    const handleDeleteMedicine = async (id) => {
        if (userUid) {
            try {
                // Delete from Firestore
                const medicineDocRef = doc(db, "medicine", userUid);
                const medicineDocSnap = await getDoc(medicineDocRef);
                if (medicineDocSnap.exists()) {
                    const currentMedicineData = medicineDocSnap.data();
                    const updatedMedicineData = { ...currentMedicineData };
                    delete updatedMedicineData[id];  // Delete the medicine
                    await setDoc(medicineDocRef, updatedMedicineData);
                }

                // Remove from stock levels in RTDB
                const medicineNameToDelete = medicines.find(med => med.id === id)?.name;
                if (medicineNameToDelete) {
                    const stockLevelRef = ref(realtimeDb, `config/${userUid}/stockLevels`);
                    const updates = {};
                    updates[`/${medicineNameToDelete}`] = null; // Use null to remove the key
                    await update(stockLevelRef, updates);
                }

            } catch (error) {
                console.error("Error deleting medicine:", error);
            }
        }
    };

    const handleNotifyCaregiverChange = async () => {
        const newNotifyCaregiver = !notifyCaregiver;
        setNotifyCaregiver(newNotifyCaregiver);
        if (userUid) {
            await updateRealtimeData(`config/${userUid}/notifyCaregiver`, newNotifyCaregiver);
        }
    };

    // Function to handle updating stock level (Realtime Database)
    const handleUpdateStock = async (medicineName, newStock) => {
        if (userUid) {
            await updateRealtimeData(`config/${userUid}/stockLevels/${medicineName}`, newStock);
        }
    };

    if (loading) {
        return <LoadingOverlay />;
    }

    if (!userUid) {
        return <Typography align="center">Please sign in to manage controls.</Typography>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 12 }}>
            <Typography variant="h4" fontWeight="bold" align="center" gutterBottom>
                Controls
            </Typography>

            <Stack spacing={3}>
                {/* Dispense Medicine Button (Realtime Database) */}
                <Card>
                    <CardContent>
                        <Typography variant="h6">
                            <MedicationIcon sx={{ mr: 1 }} /> Dispense Medicine
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleDispense}
                            sx={{ mt: 1 }}
                            disabled={isDispensing} // Disable during dispensing
                        >
                            {isDispensing ? 'Dispensing...' : 'Dispense Now'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Medicine Schedule Management (Firestore) */}
                <Card>
                    <CardContent>
                        <Typography variant="h6">
                            <InventoryIcon sx={{ mr: 1 }} /> Medicine Schedule
                        </Typography>
                        {schedules.length === 0 ? (
                            <Typography color="textSecondary">No schedules added.</Typography>
                        ) : (
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
                                        <ListItemText primary={`${schedule.medicineName} - ${schedule.dose} at ${schedule.time}`} /> {/* Display name and dose */}
                                    </ListItem>
                                ))}
                            </List>
                        )}
                        <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setOpenScheduleDialog(true)}>
                            Add Schedule
                        </Button>
                    </CardContent>
                </Card>

                {/* Medicine Management (Firestore) */}
                <Card>
                    <CardContent>
                        <Typography variant="h6">
                            <InventoryIcon sx={{ mr: 1 }} /> Medicines
                        </Typography>
                        {medicines.length === 0 ? (
                            <Typography color="textSecondary">No medicines added.</Typography>
                        ) : (
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
                        )}
                        <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setOpenMedicineDialog(true)}>
                            Add Medicine
                        </Button>
                    </CardContent>
                </Card>

                {/* Lock/Unlock Dispenser (Realtime Database) */}
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

                {/* Refill & Inventory (Realtime Database - lowStockAlert) */}
                <Card>
                    <CardContent>
                        <Typography variant="h6">
                            <InventoryIcon sx={{ mr: 1 }} /> Refill & Inventory
                        </Typography>
                        {Object.keys(stockLevels).length === 0 ? (
                            <Typography color="textSecondary">No medicines added. Add a medicine to see stock levels.</Typography>
                        ) : (
                            <>
                                {lowStockAlert ? (
                                    <Typography color="error">
                                        <WarningIcon sx={{ verticalAlign: "middle", mr: 1 }} /> Paracetamol is running low!
                                    </Typography>
                                ) : (
                                    <Typography color="success">
                                        <CheckCircleIcon sx={{ verticalAlign: "middle", mr: 1 }} /> All medicines are well-stocked.
                                    </Typography>
                                )}
                                {Object.entries(stockLevels).map(([medicineName, stockCount]) => (
                                    <div key={medicineName} style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                                        <Typography style={{ marginRight: '12px' }}>
                                            {medicineName}: {stockCount} tablets
                                        </Typography>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleUpdateStock(medicineName, stockCount + 10)}
                                        >
                                            Add 10
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleUpdateStock(medicineName, Math.max(0, stockCount - 10))}
                                            style={{ marginLeft: '8px' }}
                                        >
                                            Use 10
                                        </Button>
                                    </div>
                                ))}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Notifications & Alerts (Realtime Database) */}
                <Card>
                    <CardContent>
                        <Typography variant="h6">
                            <NotificationsActiveIcon sx={{ mr: 1 }} /> Notifications & Alerts
                        </Typography>
                        <FormControlLabel
                            control={<Switch checked={notifyCaregiver} onChange={handleNotifyCaregiverChange} />}
                            label="Notify Caregiver When a Dose is Missed"
                        />
                    </CardContent>
                </Card>
            </Stack>

            {/* Add Schedule Dialog (Firestore) */}
            <Dialog open={openScheduleDialog} onClose={() => setOpenScheduleDialog(false)}>
                <DialogTitle>Add New Schedule</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel id="medicine-select-label">Medicine</InputLabel>
                        <Select
                            labelId="medicine-select-label"
                            id="medicine-select"
                            value={newSchedule.medicineId}
                            label="Medicine"
                            onChange={(e) => setNewSchedule({ ...newSchedule, medicineId: e.target.value })} // Just store the ID
                        >
                            {medicines.length === 0 ? (
                                <MenuItem value="" disabled>No medicines available</MenuItem>
                            ) : (
                                medicines.map((medicine) => (
                                    <MenuItem key={medicine.id} value={medicine.id}>
                                        {medicine.name} - {medicine.dose}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>

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

            {/* Add Medicine Dialog (Firestore) */}
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
