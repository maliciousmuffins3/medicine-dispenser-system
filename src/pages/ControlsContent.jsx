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
import { getDatabase, ref, onValue, set } from "firebase/database";
import LoadingOverlay from "../components/LoadingOverlay";

const ControlsContent = ({ db, app }) => { // Receive the Firebase app instance
    const [isLocked, setIsLocked] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
    const [openMedicineDialog, setOpenMedicineDialog] = useState(false);
    const [newSchedule, setNewSchedule] = useState({ medicine: "", dose: "", time: "" });
    const [newMedicine, setNewMedicine] = useState({ name: "", dose: "" });
    const [lowStockAlert, setLowStockAlert] = useState(false); // Now a boolean, set based on stockLevels
    const [notifyCaregiver, setNotifyCaregiver] = useState(true);
    const [loading, setLoading] = useState(true);
    const [userUid, setUserUid] = useState(null);
    const [stockLevels, setStockLevels] = useState({}); // { [medicineName]: stockCount }

    const auth = getAuth();
    const realtimeDb = getDatabase(app); // Use the Firebase app instance

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
                            const schedulesArray = Object.entries(scheduleData).map(([id, { medicine, dose, time }]) => ({
                                id,
                                medicine,
                                dose,
                                time,
                            }));
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
                            setStockLevels(configData.stockLevels || {}); // Get stock levels
                            // Determine lowStockAlert.  Now it's based on the fetched stock levels.
                            let hasLowStock = false;
                            for (const medicineName in configData.stockLevels) {
                                if (configData.stockLevels[medicineName] <= 5) { // Example threshold: 5
                                    hasLowStock = true;
                                    break;
                                }
                            }
                            setLowStockAlert(hasLowStock);

                        } else {
                            setIsLocked(false);
                            setNotifyCaregiver(true);
                            setStockLevels({});
                            setLowStockAlert(false); //  Initialize
                        }
                    });

                    setLoading(false);

                    // Return unsubscribe functions to detach listeners
                    return () => {
                        unsubscribeMedicine();
                        unsubscribeSchedule();
                        unsubscribeConfig(); // Detach Realtime listener
                    };
                } catch (error) {
                    console.error("Error fetching data:", error);
                    setLoading(false);
                }
            };
            fetchInitialData();
        }
    }, [db, realtimeDb, userUid]); // Include realtimeDb in dependency array

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

    const handleDispense = () => {
        alert("Medicine Dispensed!");
    };

    const handleAddSchedule = async () => {
        if (newSchedule.medicine && newSchedule.dose && newSchedule.time && userUid) {
            const newScheduleId = Date.now().toString();
            const scheduleData = {
                [newScheduleId]: {
                    medicine: newSchedule.medicine,
                    dose: newSchedule.dose,
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
                setNewSchedule({ medicine: "", dose: "", time: "" });
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

                // Also add to stock levels in RTDB, initialize with 10.
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
                const medicineDocRef = doc(db, "medicine", userUid);
                const medicineDocSnap = await getDoc(medicineDocRef);
                if (medicineDocSnap.exists()) {
                    const currentMedicineData = medicineDocSnap.data();
                    const updatedMedicineData = { ...currentMedicineData };
                    delete updatedMedicineData[id];

                    await setDoc(medicineDocRef, updatedMedicineData);
                }
                // Remove from stock levels in RTDB
                const medicineNameToDelete = medicines.find(med => med.id === id)?.name; //find name
                if (medicineNameToDelete) {
                    await updateRealtimeData(`config/${userUid}/stockLevels/${medicineNameToDelete}`, null); // Use null to remove
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

                {/* Medicine Schedule Management (Firestore) */}
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

                {/* Medicine Management (Firestore) */}
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
                        {lowStockAlert ? (
                            <Typography color="error">
                                <WarningIcon sx={{ verticalAlign: "middle", mr: 1 }} /> Paracetamol is running low! Only {stockLevels["Paracetamol"] || 0} tablets left.
                            </Typography>
                        ) : (
                            <Typography color="success">
                                <CheckCircleIcon sx={{ verticalAlign: "middle", mr: 1 }} /> All medicines are well-stocked.
                            </Typography>
                        )}
                        {/* Display individual stock levels with buttons to adjust */}
                        {Object.entries(stockLevels).map(([medicineName, stockCount]) => (
                            <div key={medicineName} style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                                <Typography style={{ marginRight: '12px' }}>
                                    {medicineName}: {stockCount} tablets
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleUpdateStock(medicineName, stockCount + 10)} // Increase by 10
                                >
                                    Add 10
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleUpdateStock(medicineName, Math.max(0, stockCount - 10))} // Decrease by 10, min 0
                                    style={{ marginLeft: '8px' }}
                                >
                                    Use 10
                                </Button>
                            </div>
                        ))}
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
