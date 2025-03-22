import React, { useState, useEffect, useCallback, useRef } from "react";
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
    getFirestore,
    addDoc,
    query,
    where,
    writeBatch,
    getDocs
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue, set, update, off } from "firebase/database";
import LoadingOverlay from "../components/LoadingOverlay";
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const ControlsContent = ({ app }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
    const [openMedicineDialog, setOpenMedicineDialog] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        medicineId: "",
        time: "",
        intervalType: "once",
        intervalValue: 1,
    });
    const [newMedicine, setNewMedicine] = useState({ name: "", dose: "" });
    const [lowStockAlert, setLowStockAlert] = useState(false);
    const [notifyCaregiver, setNotifyCaregiver] = useState(true);
    const [loading, setLoading] = useState(true);
    const [userUid, setUserUid] = useState(null);
    const [stockLevels, setStockLevels] = useState({});
    const [isDispensing, setIsDispensing] = useState(false);

    const auth = getAuth(app);
    const realtimeDb = getDatabase(app);
    const firestoreDb = getFirestore(app);
    const navigate = useNavigate(); // Initialize useNavigate

    // Cleanup function to store unsubscribe functions.
    const cleanupRefs = useRef([]);

    // Function to add cleanup functions.
    const addCleanup = useCallback((cleanupFn) => {
        cleanupRefs.current.push(cleanupFn);
    }, []);

    // Function to execute all cleanup functions.
    const runCleanup = useCallback(() => {
        cleanupRefs.current.forEach((cleanupFn) => {
            if (typeof cleanupFn === 'function') { // Check if it's a function
                cleanupFn();
            }
        });
        cleanupRefs.current = []; // Clear the array
    }, []);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserUid(user.uid);
            } else {
                setUserUid(null);
                setLoading(false);
            }
        });
        // Add auth unsubscribe to cleanup
        addCleanup(() => unsubscribeAuth());

        return () => {
            runCleanup();
        };
    }, [auth, addCleanup, runCleanup]);

    useEffect(() => {
        if (userUid) {
            const fetchInitialData = async () => {
                setLoading(true);
                try {
                    // Fetch Medicines and set up real-time listener (Firestore)
                    const medicineDocRef = doc(firestoreDb, "medicine", userUid);

                    const unsubscribeMedicine = onSnapshot(medicineDocRef, (medicineDocSnap) => {
                        if (medicineDocSnap.exists()) {
                            const medicineData = medicineDocSnap.data();
                            const medicinesArray = Object.entries(medicineData).map(([id, { name, dose }]) => ({
                                id,
                                name,
                                dose,
                            }));
                            setMedicines(medicinesArray);

                            // Fetch Schedules and set up real-time listener (Firestore)
                            const scheduleDocRef = doc(firestoreDb, "schedule", userUid);

                            const unsubscribeSchedule = onSnapshot(scheduleDocRef, (scheduleDocSnap) => {
                                if (scheduleDocSnap.exists()) {
                                    const scheduleData = scheduleDocSnap.data();
                                    const schedulesArray = Object.entries(scheduleData).map(([id, { medicineId, time, intervalType, intervalValue }]) => {
                                        const medicine = medicinesArray.find((m) => m.id === medicineId); // Use medicinesArray here
                                        return {
                                            id,
                                            medicineName: medicine ? medicine.name : "Unknown",
                                            dose: medicine ? medicine.dose : "Unknown",
                                            medicineId,
                                            time,
                                            intervalType,
                                            intervalValue,
                                        };
                                    });
                                    setSchedules(schedulesArray);
                                } else {
                                    setSchedules([]);
                                }
                            });
                            addCleanup(() => unsubscribeSchedule()); // Add schedule unsubscribe

                        } else {
                            setMedicines([]);
                            setSchedules([]); // Ensure schedules are also cleared if no medicines
                        }
                    });

                    // Add medicine unsubscribe to cleanup
                    addCleanup(() => unsubscribeMedicine());

                    // Fetch config and stock levels from Realtime Database
                    const configRef = ref(realtimeDb, `config/${userUid}`);
                    const unsubscribeConfig = onValue(configRef, (snapshot) => {
                        const configData = snapshot.val();
                        if (configData) {
                            setIsLocked(configData.isLocked || false);
                            setNotifyCaregiver(configData.notifyCaregiver);
                            setStockLevels(configData.stockLevels || {});
                            setIsDispensing(configData.isDispensing || false);
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
                    addCleanup(() => {
                        try {
                            off(configRef, 'value', unsubscribeConfig);
                        } catch (e) {
                            console.error("Error detaching config listener", e);
                        }
                    });

                    setLoading(false);
                } catch (error) {
                    console.error("Error fetching data:", error);
                    setLoading(false);
                }
            };
            fetchInitialData();
        }

        return () => {
            runCleanup();
        };
    }, [firestoreDb, realtimeDb, userUid, addCleanup, runCleanup]);

    const updateFirestoreData = async (collectionName, docId, data) => {
        try {
            const docRef = doc(firestoreDb, collectionName, docId);
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
            setIsDispensing(true);
            await updateRealtimeData(`config/${userUid}/isDispensing`, true);

            await new Promise((resolve) => setTimeout(resolve, 2000));

            setIsDispensing(false);
            await updateRealtimeData(`config/${userUid}/isDispensing`, false);
        }
    };

    const handleAddSchedule = async () => {
        if (newSchedule.medicineId && newSchedule.time && userUid) {
            const newScheduleId = Date.now().toString();
            const scheduleData = {
                [newScheduleId]: {
                    medicineId: newSchedule.medicineId,
                    time: newSchedule.time,
                    intervalType: newSchedule.intervalType,
                    intervalValue: newSchedule.intervalValue,
                },
            };

            try {
                const scheduleDocRef = doc(firestoreDb, "schedule", userUid);
                const scheduleDocSnap = await getDoc(scheduleDocRef);
                let currentScheduleData = {};
                if (scheduleDocSnap.exists()) {
                    currentScheduleData = scheduleDocSnap.data();
                }
                const updatedScheduleData = { ...currentScheduleData, ...scheduleData };

                await setDoc(scheduleDocRef, updatedScheduleData);

                const historyCollectionRef = collection(firestoreDb, "history", userUid, "medications");
                const medicine = medicines.find((m) => m.id === newSchedule.medicineId);
                if (medicine) {
                    await addDoc(historyCollectionRef, {
                        medicineName: medicine.name,
                        dose: medicine.dose,
                        time: new Date(),
                        scheduledTime: newSchedule.time,
                        taken: false,
                        status: "Scheduled",
                    });
                }

                setNewSchedule({ medicineId: "", time: "", intervalType: "once", intervalValue: 1 });
                setOpenScheduleDialog(false);
                // No navigation here.  The onSnapshot listener updates the UI.
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
                const medicineDocRef = doc(firestoreDb, "medicine", userUid);
                const medicineDocSnap = await getDoc(medicineDocRef);
                let currentMedicineData = {};
                if (medicineDocSnap.exists()) {
                    currentMedicineData = medicineDocSnap.data();
                }
                const updatedMedicineData = { ...currentMedicineData, ...medicineData };
                await setDoc(medicineDocRef, updatedMedicineData);

                await updateRealtimeData(`config/${userUid}/stockLevels/${newMedicine.name}`, 0);

                const historyCollectionRef = collection(firestoreDb, "history", userUid, "medications");

                setNewMedicine({ name: "", dose: "" });
                setOpenMedicineDialog(false);
                // No navigation here. The onSnapshot listener updates the UI.
            } catch (error) {
                console.error("Error adding medicine:", error);
            }
        }
    };

    const handleDeleteSchedule = async (id) => {
        if (userUid) {
            try {
                const scheduleDocRef = doc(firestoreDb, "schedule", userUid);
                const scheduleDocSnap = await getDoc(scheduleDocRef);
                if (scheduleDocSnap.exists()) {
                    const currentScheduleData = scheduleDocSnap.data();
                    const updatedScheduleData = { ...currentScheduleData };
                    delete updatedScheduleData[id];
                    await setDoc(scheduleDocRef, updatedScheduleData);
                }
                // No navigation. The onSnapshot listener updates the UI.
            } catch (error) {
                console.error("Error deleting schedule:", error);
            }
        }
    };

    const handleDeleteMedicine = async (id) => {
        if (userUid) {
            try {
                const medicineToDelete = medicines.find((med) => med.id === id);
                const medicineNameToDelete = medicineToDelete ? medicineToDelete.name : null;

                const medicineDocRef = doc(firestoreDb, "medicine", userUid);
                const medicineDocSnap = await getDoc(medicineDocRef);
                if (medicineDocSnap.exists()) {
                    const currentMedicineData = medicineDocSnap.data();
                    const updatedMedicineData = { ...currentMedicineData };
                    delete updatedMedicineData[id];
                    await setDoc(medicineDocRef, updatedMedicineData);
                }

                if (medicineNameToDelete) {
                    const stockLevelRef = ref(realtimeDb, `config/${userUid}/stockLevels`);
                    const updates = {};
                    updates[`/${medicineNameToDelete}`] = null;
                    await update(stockLevelRef, updates);
                }

                if (medicineNameToDelete) {
                    const historyCollectionRef = collection(firestoreDb, "history", userUid, "medications");
                    const historyQuery = query(historyCollectionRef, where("medicineName", "==", medicineNameToDelete));
                    const historySnapshot = await getDocs(historyQuery);

                    const batch = writeBatch(firestoreDb);

                    historySnapshot.forEach((doc) => {
                        batch.delete(doc.ref);
                    });

                    await batch.commit();
                }

                const scheduleDocRef = doc(firestoreDb, "schedule", userUid);
                const scheduleDocSnap = await getDoc(scheduleDocRef);

                if (scheduleDocSnap.exists()) {
                    const currentScheduleData = scheduleDocSnap.data();
                    const updatedScheduleData = { ...currentScheduleData };

                    for (const scheduleId in currentScheduleData) {
                        if (currentScheduleData[scheduleId].medicineId === id) {
                            delete updatedScheduleData[scheduleId];
                        }
                    }
                    await setDoc(scheduleDocRef, updatedScheduleData);
                }
                // No navigation. The onSnapshot listener updates the UI.

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
                            disabled={isDispensing}
                        >
                            {isDispensing ? 'Dispensing...' : 'Dispense Now'}
                        </Button>
                    </CardContent>
                </Card>

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
                                        <ListItemText primary={`${schedule.medicineName} - ${schedule.dose} at ${schedule.time} (${schedule.intervalType}${schedule.intervalType !== 'once' ? `: ${schedule.intervalValue}` : ''})`} />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                        <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setOpenScheduleDialog(true)}>
                            Add Schedule
                        </Button>
                    </CardContent>
                </Card>

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
                            onChange={(e) => setNewSchedule({ ...newSchedule, medicineId: e.target.value })}
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

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel id="interval-type-label">Interval</InputLabel>
                        <Select
                            labelId="interval-type-label"
                            id="interval-type"
                            value={newSchedule.intervalType}
                            label="Interval"
                            onChange={(e) =>
                                setNewSchedule({
                                    ...newSchedule,
                                    intervalType: e.target.value,
                                    intervalValue: 1,
                                })
                            }
                        >
                            <MenuItem value="once">Once</MenuItem>
                            <MenuItem value="hourly">Every Hour</MenuItem>
                            <MenuItem value="interval">Every...</MenuItem>
                        </Select>
                    </FormControl>

                    {newSchedule.intervalType === "interval" && (
                        <TextField
                            fullWidth
                            label="Interval Value (hours)"
                            type="number"
                            value={newSchedule.intervalValue}
                            onChange={(e) =>
                                setNewSchedule({
                                    ...newSchedule,
                                    intervalValue: parseInt(e.target.value, 10) || 1,
                                })
                            }
                            sx={{ mt: 2 }}
                            min="1"
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenScheduleDialog(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={handleAddSchedule}>
                        Add
                    </Button>
                </DialogActions>
            </Dialog>

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
