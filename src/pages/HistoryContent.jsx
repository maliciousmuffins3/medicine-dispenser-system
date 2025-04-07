import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Grid, Divider, List, ListItem, ListItemText, Box, Button } from "@mui/material";
import { doc, collection, onSnapshot, Timestamp, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { format } from 'date-fns';
import { db } from '../firebase/firebaseConfig'; // Import the firebase config

// Utility function (moved to this file)
export const calculateNextInterval = (scheduledTime, intervalType, intervalValue) => {
    if (!scheduledTime || !intervalType || !intervalValue) {
        return null;
    }

    let nextScheduledTime;
    const now = new Date();

    const baseTime = scheduledTime instanceof Timestamp ? scheduledTime.toDate() : new Date(scheduledTime);

    switch (intervalType) {
        case 'hourly':
            nextScheduledTime = new Date(baseTime.getTime() + intervalValue * 60 * 60 * 1000);
            while (nextScheduledTime <= now) {
                nextScheduledTime = new Date(nextScheduledTime.getTime() + intervalValue * 60 * 60 * 1000);
            }
            break;
        case 'daily':
            nextScheduledTime = new Date(baseTime.getTime() + intervalValue * 24 * 60 * 60 * 1000);
            while (nextScheduledTime <= now) {
                nextScheduledTime = new Date(nextScheduledTime.getTime() + intervalValue * 24 * 60 * 60 * 1000);
            }
            break;
        case 'weekly':
            nextScheduledTime = new Date(baseTime.getTime() + intervalValue * 7 * 24 * 60 * 60 * 1000);
            while (nextScheduledTime <= now) {
                nextScheduledTime = new Date(nextScheduledTime.getTime() + intervalValue * 7 * 24 * 60 * 60 * 1000);
            }
            break;
        default:
            return null;
    }
    return nextScheduledTime;
};


const HistoryCard = ({ medicineName, dose, scheduledTime, status, previousHistory }) => {
    const hasPreviousHistory = previousHistory && previousHistory.length > 0;

    return (
        <Box sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
            {/* Current Medication Record */}
            <Card
                sx={{
                    backgroundColor: status === "Missed" ? "#ffebee" : status === "Taken" ? "#e0f7fa" : "#e8f5e9",
                    borderRadius: hasPreviousHistory ? "12px 12px 0 0" : "12px", // Only round top if there's previous history
                }}
            >
                <CardContent>
                    <Typography variant="h6" fontWeight="bold">{medicineName}</Typography>
                    <Typography variant="body2">Dose: {dose}</Typography>
                    <Typography variant="body2">Scheduled Time: {scheduledTime}</Typography>
                    <Typography variant="body2" color={
                        status === "Missed" ? "error" :
                            status === "Taken" ? "success" :
                                "success"
                    }>
                        Status: {status}
                    </Typography>
                </CardContent>
            </Card>

            {/* Previous History List */}
            {hasPreviousHistory && (
                <Card sx={{ backgroundColor: "#f5f5f5", borderRadius: "0 0 12px 12px" }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Previous Dispensing History
                        </Typography>
                        <Divider sx={{ mb: 1 }} />
                        <List sx={{ maxHeight: 150, overflow: "auto" }}>
                            {previousHistory.map((record, index) => {
                                const recordTime = record.time instanceof Timestamp
                                    ? format(record.time.toDate(), 'PPPppp')
                                    : record.time;
                                return (
                                    <ListItem key={index} sx={{ py: 0 }}>
                                        <ListItemText
                                            primary={recordTime}
                                            secondary={
                                                <Typography color={record.status === "Missed" ? "error" : "success"} variant="body2">
                                                    Status: {record.status}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

const HistoryContent = () => {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [nextScheduledDose, setNextScheduledDose] = useState(null);
    const [historyFetched, setHistoryFetched] = useState(false);
    const [takenHistory, setTakenHistory] = useState([]);
    const [missedHistory, setMissedHistory] = useState([]);
    const [currentDate, setCurrentDate] = useState('');
    const [targetMedicine, setTargetMedicine] = useState({ name: '', dose: '' }); // Define the target medicine
    const [specialDoseCard, setSpecialDoseCard] = useState(null);


    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });

        // Get and set current date
        const today = new Date();
        const formattedDate = format(today, 'PPP');
        setCurrentDate(formattedDate);

        return () => unsubscribeAuth();
    }, []);

    const fetchHistory = async (user) => {
        if (!user) {
            setLoading(false);
            if (historyFetched) {
                setHistoryData([]);
                setNextScheduledDose(null);
                setTakenHistory([]);
                setMissedHistory([]);
                setSpecialDoseCard(null);
            }
            return;
        }

        const userUid = user.uid;
        const historyCollectionRef = collection(db, "history", userUid, "medications");

        const unsubscribe = onSnapshot(historyCollectionRef, (snapshot) => {
            try {
                const fetchedHistoryData = [];
                const previousHistoryMap = new Map();
                const fetchedTakenHistory = [];
                const fetchedMissedHistory = [];
                let targetDose = null; // To store the target medicine
                let specialCard = null;
                let nextUpcomingDose = null;


                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const scheduledTime = data.scheduledTime instanceof Timestamp
                        ? data.scheduledTime.toDate().toLocaleString()
                        : data.scheduledTime;

                    const historyItem = {
                        id: doc.id,
                        medicineName: data.medicineName,
                        dose: data.dose,
                        scheduledTime: scheduledTime,
                        status: data.status,
                        rawScheduledTime: data.scheduledTime,
                        userUid: userUid,
                        medicationId: doc.id,
                        takenTime: data.takenTime,
                        intervalType: data.intervalType,
                        intervalValue: data.intervalValue,
                    };

                    if (data.status === 'Taken') {
                        const takenTime = data.takenTime instanceof Timestamp
                            ? data.takenTime.toDate()
                            : data.takenTime;
                        fetchedTakenHistory.push({ ...historyItem, takenTime });
                        if (!previousHistoryMap.has(data.medicineName)) {
                            previousHistoryMap.set(data.medicineName, []);
                        }
                        previousHistoryMap.get(data.medicineName).push({
                            time: data.rawScheduledTime || data.scheduledTime,
                            status: data.status,
                            formattedTime: scheduledTime,
                        });
                    } else if (data.status === 'Missed') {
                        fetchedMissedHistory.push(historyItem);
                        if (!previousHistoryMap.has(data.medicineName)) {
                            previousHistoryMap.set(data.medicineName, []);
                        }
                        previousHistoryMap.get(data.medicineName).push({
                            time: data.rawScheduledTime || data.scheduledTime,
                            status: data.status,
                            formattedTime: scheduledTime,
                        });
                    } else {
                        fetchedHistoryData.push(historyItem);
                        // Check for the next upcoming dose
                        if (!nextUpcomingDose) {
                            nextUpcomingDose = historyItem;
                        }
                        else {
                            const currentItemTime = historyItem.rawScheduledTime instanceof Timestamp ? historyItem.rawScheduledTime.toDate() : new Date(historyItem.rawScheduledTime);
                            const nextDoseTime = nextUpcomingDose.rawScheduledTime instanceof Timestamp ? nextUpcomingDose.toDate() : new Date(nextUpcomingDose.rawScheduledTime);

                            if (currentItemTime < nextDoseTime) {
                                nextUpcomingDose = historyItem;
                            }
                        }
                    }

                    // Check for the target medicine for the special card
                    if (data.medicineName === targetMedicine.name && data.dose === targetMedicine.dose) {
                        targetDose = historyItem;
                        specialCard = (
                            <Card key={doc.id} sx={{ backgroundColor: "#bbdefb", p: 2, mb: 2 }}>
                                <Typography variant="body1">
                                    <strong>{data.medicineName}</strong> - {data.dose}
                                </Typography>
                                <Typography variant="body2">Scheduled at: {scheduledTime}</Typography>
                                <Typography variant="body2">Status: {data.status}</Typography>
                            </Card>
                        );
                    }
                });

                previousHistoryMap.forEach((historyList, medicineName) => {
                    historyList.sort((a, b) => {
                        const timeA = a.time instanceof Timestamp ? a.time.toDate().getTime() : new Date(a.time).getTime();
                        const timeB = b.time instanceof Timestamp ? b.time.toDate().getTime() : new Date(b.time).getTime();
                        return timeB - timeA;
                    });
                });

                const finalHistoryData = fetchedHistoryData.map(item => {
                    const medicineName = item.medicineName;
                    const previousHistory = previousHistoryMap.get(medicineName) || [];
                    previousHistory.sort((a, b) => {
                        const timeA = a.time instanceof Timestamp ? a.time.toDate().getTime() : new Date(a.time).getTime();
                        const timeB = b.time instanceof Timestamp ? b.time.toDate().getTime() : new Date(b.time).getTime();
                        return timeB - timeA;
                    });
                    return {
                        ...item,
                        previousHistory: previousHistory
                    };
                });

                finalHistoryData.sort((a, b) => {
                    const timeA = a.rawScheduledTime instanceof Timestamp ? a.rawScheduledTime.toDate().getTime() : new Date(a.rawScheduledTime).getTime();
                    const timeB = b.rawScheduledTime instanceof Timestamp ? b.rawScheduledTime.toDate().getTime() : new Date(b.rawScheduledTime).getTime();
                    return timeB - timeA;
                });

                setHistoryData(finalHistoryData);
                setLoading(false);
                setHistoryFetched(true);
                setTakenHistory(fetchedTakenHistory);
                setMissedHistory(fetchedMissedHistory);
                setSpecialDoseCard(specialCard);

                // Set next scheduled dose
                if (targetDose && targetDose.status !== 'Taken') {
                    setNextScheduledDose(targetDose);
                } else {
                    setNextScheduledDose(nextUpcomingDose || null);
                }

            } catch (err) {
                setError(err);
                setLoading(false);
                console.error("Error fetching history:", err);
            }
        }, (err) => {
            setError(err);
            setLoading(false);
            console.error("Error with snapshot listener:", err);
        });

        return () => unsubscribe();
    };

    useEffect(() => {
        if (currentUser) {
            fetchHistory(currentUser);
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const handleDeleteHistory = async () => {
        if (!currentUser) return;

        const userUid = currentUser.uid;
        const historyCollectionRef = collection(db, "history", userUid, "medications");
        const batch = writeBatch(db);

        try {
            // Query for 'Taken' and 'Missed' records
            const q = query(historyCollectionRef, where("status", "in", ["Taken", "Missed"]));
            const snapshot = await getDocs(q);

            snapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Commit the batch deletion
            await batch.commit();

            // Refresh the history data
            fetchHistory(currentUser);
            console.log("Taken and Missed history deleted successfully.");
        } catch (error) {
            console.error("Error deleting history:", error);
            setError(error);
        }
    };


    if (loading) {
        return <Container><Typography>Loading medication history...</Typography></Container>;
    }

    if (error) {
        return <Container><Typography color="error">Error: {error.message}</Typography></Container>;
    }

    if (!currentUser && historyFetched) {
        return <Container><Typography>Please log in to view your medication history.</Typography></Container>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 12 }}>
            <Typography variant="h4" fontWeight="bold" align="center" gutterBottom>
                Medication History
            </Typography>
            <Typography variant="h6" align="center" gutterBottom>
                Date: {currentDate}
            </Typography>

            {/* Next Scheduled Dose */}
            {nextScheduledDose && (
                <Card sx={{ mt: 2, mb: 2, order: -3, backgroundColor: '#f0f4c3' }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold">Next Scheduled Dose</Typography>
                        <Typography variant="body1">Medicine: {nextScheduledDose.medicineName}</Typography>
                        <Typography variant="body1">Dose: {nextScheduledDose.dose}</Typography>
                        <Typography variant="body1">
                            Scheduled Time: {nextScheduledDose.scheduledTime}
                        </Typography>
                    </CardContent>
                </Card>
            )}
            {specialDoseCard}

            {/* Grid Container */}
            <Grid container spacing={2} sx={{ order: -4 }}>
                {historyData.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <HistoryCard
                            medicineName={item.medicineName}
                            dose={item.dose}
                            scheduledTime={item.scheduledTime}
                            status={item.status}
                            previousHistory={item.previousHistory}
                        />
                    </Grid>
                ))}
            </Grid>

                        {/* Delete History Button */}
                        <Box display="flex" justifyContent="center" mt={4} mb={2}>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleDeleteHistory}
                >
                    Delete Taken and Missed History
                </Button>
            </Box>

            {/* Missed Medications Card */}
            {missedHistory.length > 0 && (
                <Card sx={{ mb: 4, order: -2, }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Missed Medications ({currentDate})
                        </Typography>
                        <List>
                            {missedHistory.map((item) => (
                                <ListItem key={item.id}>
                                    <ListItemText
                                        primary={item.medicineName}
                                        secondary={`Dose: ${item.dose}, Scheduled: ${item.scheduledTime}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}

            {/* Taken Medications Card */}
            {takenHistory.length > 0 && (
                <Card sx={{ mb: 4, order: -1 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Taken Medications
                        </Typography>
                        <List>
                            {takenHistory.map((item) => {
                                const takenTimeFormatted = item.takenTime
                                    ? format(item.takenTime, 'PPPppp')
                                    : 'N/A';
                                return (
                                    <ListItem key={item.id}>
                                        <ListItemText
                                            primary={item.medicineName}
                                            secondary={`Dose: ${item.dose}, Scheduled: ${item.scheduledTime}`}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    </CardContent>
                </Card>
            )}



        </Container>
    );
};

export default HistoryContent;
