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
    setDoc,
    deleteDoc,
    onSnapshot,
    getFirestore,
    addDoc,
    query,
    where,
    writeBatch,
    getDocs,
    Timestamp, // Import Timestamp
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue, set, update, off, remove } from "firebase/database"; // Import remove
import LoadingOverlay from "../components/LoadingOverlay";
import { format } from 'date-fns';

const ControlsContent = ({ app }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        medicineName: "",
        medicineDose: "",
        time: "",
        intervalType: "once",
        intervalValue: '',
        date: null,
    });
    const [lowStockAlert, setLowStockAlert] = useState(false);
    const [notifyCaregiver, setNotifyCaregiver] = useState(true);
    const [loading, setLoading] = useState(true);
    const [userUid, setUserUid] = useState(null);
    const [stockLevels, setStockLevels] = useState({});
    const [isDispensing, setIsDispensing] = useState(false);
    const [inputErrors, setInputErrors] = useState({});
    const [editIndex, setEditIndex] = useState(null);

    const auth = getAuth(app);
    const realtimeDb = getDatabase(app);
    const firestoreDb = getFirestore(app);

    const cleanupRefs = useRef([]);

    const addCleanup = useCallback((cleanupFn) => {
        cleanupRefs.current.push(cleanupFn);
    }, []);

    const runCleanup = useCallback(() => {
        cleanupRefs.current.forEach((cleanupFn) => {
            if (typeof cleanupFn === 'function') {
                cleanupFn();
            }
        });
        cleanupRefs.current = [];
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
                    const scheduleCollectionRef = collection(firestoreDb, "medicines", userUid, "schedules");
                    const unsubscribeSchedule = onSnapshot(scheduleCollectionRef, (scheduleSnapshot) => {
                        const schedulesArray = scheduleSnapshot.docs.map(doc => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                medicineName: data.medicineName,
                                medicineDose: data.medicineDose,
                                time: data.time,
                                intervalType: data.intervalType,
                                intervalValue: data.intervalValue,
                                date: data.date ? data.date.toDate() : null, // Convert Timestamp to Date
                            };
                        });
                        setSchedules(schedulesArray);
                    });
                    addCleanup(() => unsubscribeSchedule());

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

            setTimeout(async () => {
                setIsDispensing(false);
                await updateRealtimeData(`config/${userUid}/isDispensing`, false);
            }, 2000);
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
            return;
        }

        if (newSchedule.medicineName && newSchedule.time && newSchedule.medicineDose && userUid) {
            try {
                const scheduleCollectionRef = collection(firestoreDb, "medicines", userUid, "schedules");
                const historyCollectionRef = collection(firestoreDb, "history", userUid, "medications");

                const selectedTime = newSchedule.time;
                const [hours, minutes] = selectedTime.split(':').map(Number);
                const now = new Date();
                now.setHours(hours);
                now.setMinutes(minutes);
                const scheduledDateTime = Timestamp.fromDate(now);

                if (editIndex !== null) {
                    const scheduleIdToUpdate = schedules[editIndex].id;
                    const scheduleDocRef = doc(scheduleCollectionRef, scheduleIdToUpdate);
                    await setDoc(scheduleDocRef, {
                        medicineName: newSchedule.medicineName,
                        medicineDose: newSchedule.medicineDose,
                        time: newSchedule.time,
                        date: scheduledDateTime,
                        intervalType: newSchedule.intervalType,
                        intervalValue: newSchedule.intervalValue,
                    });

                    // Delete old history entry and add new one
                    const historyQuery = query(
                        historyCollectionRef,
                        where("medicineName", "==", schedules[editIndex].medicineName),
                        where("dose", "==", schedules[editIndex].medicineDose),
                        where("scheduledTime", "==", schedules[editIndex].time)
                    );
                    const historyDocs = await getDocs(historyQuery);

                    const batch = writeBatch(firestoreDb);
                    for (const hDoc of historyDocs.docs) {
                        batch.delete(doc(historyCollectionRef, hDoc.id));
                    }

                    // Add new history entry with "Scheduled" status
                    batch.set(doc(historyCollectionRef), {
                        medicineName: newSchedule.medicineName,
                        dose: newSchedule.medicineDose,
                        scheduledTime: newSchedule.time,
                        time: scheduledDateTime,
                        status: "Scheduled",
                    });
                    await batch.commit();

                } else {
                    await addDoc(scheduleCollectionRef, {
                        medicineName: newSchedule.medicineName,
                        medicineDose: newSchedule.medicineDose,
                        time: newSchedule.time,
                        date: scheduledDateTime,
                        intervalType: newSchedule.intervalType,
                        intervalValue: newSchedule.intervalValue,
                    });

                    await addDoc(historyCollectionRef, {
                        medicineName: newSchedule.medicineName,
                        dose: newSchedule.medicineDose,
                        scheduledTime: newSchedule.time,
                        time: scheduledDateTime, // Store the current time as Timestamp
                        status: "Scheduled",
                    });

                    if (!stockLevels[newSchedule.medicineName]) {
                        const newStockLevels = { ...stockLevels };
                        newStockLevels[newSchedule.medicineName] = 0;
                        setStockLevels(newStockLevels);
                        await updateRealtimeData(`config/${userUid}/stockLevels`, newStockLevels);
                    }
                }

                setNewSchedule({ medicineName: "", medicineDose: "", time: "", intervalType: "once", intervalValue: '', date: null });
                setOpenScheduleDialog(false);
                setInputErrors({});
                setEditIndex(null);
            } catch (error) {
                console.error("Error adding/editing schedule:", error);
            }
        }
    };

    const handleDeleteSchedule = async (index) => {
        if (userUid) {
            try {
                const scheduleIdToDelete = schedules[index].id;
                const scheduleCollectionRef = collection(firestoreDb, "medicines", userUid, "schedules");
                const scheduleDocRef = doc(scheduleCollectionRef, scheduleIdToDelete);
                const historyCollectionRef = collection(firestoreDb, "history", userUid, "medications");
                const deletedMedicineName = schedules[index].medicineName;
                const deletedMedicineDose = schedules[index].medicineDose;
                const deletedMedicineTime = schedules[index].time;

                // Delete the schedule
                await deleteDoc(scheduleDocRef);

                // Delete related history entries
                const historyQuery = query(historyCollectionRef,
                    where("medicineName", "==", deletedMedicineName),
                    where("dose", "==", deletedMedicineDose),
                    where("scheduledTime", "==", deletedMedicineTime)
                );
                const historyDocs = await getDocs(historyQuery);
                const batch = writeBatch(firestoreDb);
                historyDocs.forEach(hDoc => {
                    batch.delete(doc(historyCollectionRef, hDoc.id));
                });
                await batch.commit();

                // Remove stock level
                if (deletedMedicineName) {
                    const stockLevelRef = ref(realtimeDb, `config/${userUid}/stockLevels/${deletedMedicineName}`);
                    await remove(stockLevelRef);
                    const newStockLevels = { ...stockLevels };
                    delete newStockLevels[deletedMedicineName];
                    setStockLevels(newStockLevels);
                }
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
            date: scheduleToEdit.date,
        });
        setEditIndex(index);
        setOpenScheduleDialog(true);
    };

    const getIntervalDisplay = (intervalType, intervalValue) => {
        if (intervalType === 'once') {
            return 'Once';
        } else if (intervalType === 'hourly') {
            return 'Every Hour';
        } else if (intervalType === 'interval' && intervalValue) {
            return `Every ${intervalValue} hours`;
        }
        return '';
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
                            <InventoryIcon sx={{ mr: 1 }} /> Medicines / Medication Schedule
                        </Typography>
                        {schedules.length === 0 ? (
                            <Typography color="textSecondary">No schedules added.</Typography>
                        ) : (
                            <List>
                                {schedules.map((schedule, index) => {
                                    const formattedDate = schedule.date
                                        ? format(schedule.date, 'PPP')
                                        : 'No Date';
                                    return (
                                        <ListItem
                                            key={index}
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
                                            <ListItemText
                                                primary={`${schedule.medicineName} - ${schedule.medicineDose}`}
                                                secondary={`Scheduled at ${schedule.time} on ${formattedDate} (${getIntervalDisplay(schedule.intervalType, schedule.intervalValue)})`}
                                            />
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                        <Button startIcon={<AddIcon />} variant="outlined" onClick={() => {
                            setEditIndex(null);
                            setNewSchedule({ medicineName: "", medicineDose: "", time: "", intervalType: "once", intervalValue: '', date: null });
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
                            onChange={(e) => {
                                const intervalType = e.target.value;
                                let intervalValue = 0;
                                if (intervalType === 'hourly') {
                                    intervalValue = 1;
                                } else if (intervalType === 'once') {
                                    intervalValue = 0
                                }
                                setNewSchedule({
                                    ...newSchedule,
                                    intervalType: intervalType,
                                    intervalValue: intervalValue,
                                });
                            }}

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
                            type="text"
                            value={newSchedule.intervalValue}
                            onChange={(e) => {
                                const numValue = parseInt(e.target.value, 10);
                                if (!isNaN(numValue) || e.target.value === '') {
                                    setNewSchedule({
                                        ...newSchedule,
                                        intervalValue: e.target.value === '' ? '' : numValue,
                                    });
                                }
                            }}
                            sx={{ mt: 2 }}
                            inputProps={{
                                pattern: "[0-9]*",
                                min: "1",
                            }}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setOpenScheduleDialog(false);
                        setInputErrors({});
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
