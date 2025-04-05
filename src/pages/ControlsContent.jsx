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
    FormHelperText
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
    const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        medicineName: "",
        medicineDose: "",
        time: "",
        intervalType: "once",
        intervalValue: 1,
    });
    const [lowStockAlert, setLowStockAlert] = useState(false);
    const [notifyCaregiver, setNotifyCaregiver] = useState(true);
    const [loading, setLoading] = useState(true);
    const [userUid, setUserUid] = useState(null);
    const [stockLevels, setStockLevels] = useState({});
    const [isDispensing, setIsDispensing] = useState(false);
    const [inputErrors, setInputErrors] = useState({});
    const [editIndex, setEditIndex] = useState(null); // Track the index of the item being edited

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
                    // Fetch Schedules and set up real-time listener (Firestore)
                    const scheduleDocRef = doc(firestoreDb, "medicines", userUid); // Changed collection name
                    const unsubscribeSchedule = onSnapshot(scheduleDocRef, (scheduleDocSnap) => {
                        if (scheduleDocSnap.exists()) {
                            const scheduleData = scheduleDocSnap.data();
                            // Convert the object into an array of schedules.  The keys will be "med1", "med2", etc.
                            const schedulesArray = Object.entries(scheduleData).map(([, { medicineName, medicineDose, time, intervalType, intervalValue }]) => {
                                return {
                                    medicineName,
                                    medicineDose,
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
                    addCleanup(() => unsubscribeSchedule());

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
        let hasErrors = false;
        const newErrors = {};

        if (!newSchedule.medicineName) {
            newErrors.medicineName = "Medicine Name is required";
            hasErrors = true;
        }
        if (!newSchedule.medicineDose) {
            newErrors.medicineDose = "Medicine Dose is required";
            hasErrors = true;
        }
        if (!newSchedule.time) {
            newErrors.time = "Time is required";
            hasErrors = true;
        }

        if (schedules.length >= 5 && editIndex === null) {
            newErrors.maxLimit = "Maximum 5 medicines allowed.";
            hasErrors = true;
        }

        // Check for duplicates, excluding the item being edited
        if (schedules.some((schedule, index) =>
                index !== editIndex &&
                schedule.medicineName === newSchedule.medicineName &&
                schedule.medicineDose === newSchedule.medicineDose
        )) {
            newErrors.duplicate = "A schedule with this medicine name and dose already exists";
            hasErrors = true;
        }

        setInputErrors(newErrors);

        if (hasErrors) {
            return; // Stop if there are errors
        }

        if (newSchedule.medicineName && newSchedule.time && newSchedule.medicineDose && userUid) {
            try {
                const scheduleDocRef = doc(firestoreDb, "medicines", userUid); // Changed collection name
                const scheduleDocSnap = await getDoc(scheduleDocRef);
                let currentScheduleData = {};

                if (scheduleDocSnap.exists()) {
                    currentScheduleData = scheduleDocSnap.data();
                }

                let updatedScheduleData = {};
                if (editIndex !== null) {
                    // Edit existing schedule
                    const medicineKey = `med${editIndex + 1}`; // "med1", "med2", etc.
                    updatedScheduleData = {
                        ...currentScheduleData,
                        [medicineKey]: {
                            medicineName: newSchedule.medicineName,
                            medicineDose: newSchedule.medicineDose,
                            time: newSchedule.time,
                            intervalType: newSchedule.intervalType,
                            intervalValue: newSchedule.intervalValue,
                        }
                    };
                } else {
                  // Add new schedule
                    const nextMedicineKey = `med${schedules.length + 1}`;
                    updatedScheduleData = {
                        ...currentScheduleData,
                        [nextMedicineKey]: {
                            medicineName: newSchedule.medicineName,
                            medicineDose: newSchedule.medicineDose,
                            time: newSchedule.time,
                            intervalType: newSchedule.intervalType,
                            intervalValue: newSchedule.intervalValue,
                        }
                    };
                }
                await setDoc(scheduleDocRef, updatedScheduleData);

                const historyCollectionRef = collection(firestoreDb, "history", userUid, "medications");

                await addDoc(historyCollectionRef, {
                    medicineName: newSchedule.medicineName,
                    dose: newSchedule.medicineDose,
                    time: new Date(),
                    scheduledTime: newSchedule.time,
                    taken: false,
                    status: editIndex !== null ? "Updated" : "Scheduled",
                });

                setNewSchedule({ medicineName: "", medicineDose: "", time: "", intervalType: "once", intervalValue: 1 });
                setOpenScheduleDialog(false);
                setInputErrors({}); // Clear errors on success
                setEditIndex(null); // Reset edit index
                // No navigation here.  The onSnapshot listener updates the UI.
            } catch (error) {
                console.error("Error adding/editing schedule:", error);
            }
        }
    };

    const handleDeleteSchedule = async (index) => {
        if (userUid) {
            try {
                const scheduleDocRef = doc(firestoreDb, "medicines", userUid); // Changed collection name
                const scheduleDocSnap = await getDoc(scheduleDocRef);
                if (scheduleDocSnap.exists()) {
                    const currentScheduleData = scheduleDocSnap.data();
                    const updatedScheduleData = {};
                    let count = 1;
                    for (const key in currentScheduleData) {
                        if (key !== `med${index + 1}`) {
                            updatedScheduleData[`med${count}`] = currentScheduleData[key];
                            count++;
                        }
                    }
                    await setDoc(scheduleDocRef, updatedScheduleData);
                }
                // No navigation. The onSnapshot listener updates the UI.
            } catch (error) {
                console.error("Error deleting schedule:", error);
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

    const handleEditSchedule = (index) => {
        const scheduleToEdit = schedules[index];
        setNewSchedule({
            medicineName: scheduleToEdit.medicineName,
            medicineDose: scheduleToEdit.medicineDose,
            time: scheduleToEdit.time,
            intervalType: scheduleToEdit.intervalType,
            intervalValue: scheduleToEdit.intervalValue,
        });
        setEditIndex(index);
        setOpenScheduleDialog(true);
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
                            <InventoryIcon sx={{ mr: 1 }} /> Medication Schedule
                        </Typography>
                        {schedules.length === 0 ? (
                            <Typography color="textSecondary">No schedules added.</Typography>
                        ) : (
                            <List>
                                {schedules.map((schedule, index) => (
                                    <ListItem
                                        key={index} // Use index as key
                                        secondaryAction={
                                            <>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleEditSchedule(index)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleDeleteSchedule(index)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </>
                                        }
                                    >
                                        <ListItemText primary={`${schedule.medicineName} - ${schedule.medicineDose} at ${schedule.time} (${schedule.intervalType}${schedule.intervalType !== 'once' ? `: ${schedule.intervalValue}` : ''})`} />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                        <Button startIcon={<AddIcon />} variant="outlined" onClick={() => {
                            setEditIndex(null);
                            setNewSchedule({ medicineName: "", medicineDose: "", time: "", intervalType: "once", intervalValue: 1 });
                            setOpenScheduleDialog(true);
                        }}>
                            Add Schedule
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        {isLocked ? <LockIcon sx={{ mr: 1 }} /> : <LockOpenIcon sx={{ mr: 1 }} />}
                        <Typography variant="h6">
                            Dispenser Lock
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

            <Dialog open={openScheduleDialog} onClose={() => {
                setOpenScheduleDialog(false);
                setInputErrors({});
                setEditIndex(null);
            }}>
                <DialogTitle>{editIndex !== null ? "Edit Schedule" : "Add New Schedule"}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Medicine Name"
                        value={newSchedule.medicineName}
                        onChange={(e) => setNewSchedule({ ...newSchedule, medicineName: e.target.value })}
                        sx={{ mt: 2 }}
                        error={!!inputErrors.medicineName}
                        helperText={inputErrors.medicineName}
                    />
                    <TextField
                        fullWidth
                        label="Medicine Dose"
                        value={newSchedule.medicineDose}
                        onChange={(e) => setNewSchedule({ ...newSchedule, medicineDose: e.target.value })}
                        sx={{ mt: 2 }}
                        error={!!inputErrors.medicineDose}
                        helperText={inputErrors.medicineDose}
                    />
                    <TextField
                        fullWidth
                        label="Time"
                        type="time"
                        value={newSchedule.time}
                        onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                        sx={{ mt: 2 }}
                        InputLabelProps={{ shrink: true }}
                        error={!!inputErrors.time}
                        helperText={inputErrors.time}
                    />

                    <FormControl fullWidth sx={{ mt: 2 }} error={!!inputErrors.duplicate || !!inputErrors.maxLimit}>
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
                        {(inputErrors.duplicate || inputErrors.maxLimit) && (
                            <FormHelperText>{inputErrors.duplicate || inputErrors.maxLimit}</FormHelperText>
                        )}
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
                    <Button onClick={() => {
                        setOpenScheduleDialog(false);
                        setInputErrors({}); // Clear errors on cancel
                        setEditIndex(null);
                    }}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={handleAddSchedule}>
                        {editIndex !== null ? "Update" : "Add"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ControlsContent;
