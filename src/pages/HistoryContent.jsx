import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Grid, Divider, List, ListItem, ListItemText, Box } from "@mui/material";
import { doc, collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { format } from 'date-fns';
import { db } from '../firebase/firebaseConfig'; // Import the firebase config

// Utility function
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

    return (
        <Box sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
            {/* Current Medication Record */}
            <Card
                sx={{
                    backgroundColor: status === "Missed" ? "#ffebee" : status === "Taken" ? "#e0f7fa" : "#e8f5e9",
                    borderRadius: "12px 12px 0 0",
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
            <Card sx={{ backgroundColor: "#f5f5f5", borderRadius: "0 0 12px 12px" }}>
                <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Previous Dispensing History
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    <List sx={{ maxHeight: 150, overflow: "auto" }}>
                        {previousHistory.map((record, index) => {
                            const recordTime = record.time instanceof Timestamp
                                ? format(record.time.toDate(), 'PPPppp') // Format the timestamp
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
    const [takenHistory, setTakenHistory] = useState([]); // New state for "Taken" history
    const [missedHistory, setMissedHistory] = useState([]); // New state for "Missed" history
    const [currentDate, setCurrentDate] = useState('');


    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });

        // Get and set current date
        const today = new Date();
        const formattedDate = format(today, 'PPP'); // Using date-fns for formatting
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
                const fetchedHistory = [];

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
                        takenTime: data.takenTime, // Store takenTime

                    };

                    if (data.status === 'Taken') {
                        const takenTime = data.takenTime instanceof Timestamp
                            ? data.takenTime.toDate()
                            : data.takenTime;
                        fetchedTakenHistory.push({ ...historyItem, takenTime }); // Store takenTime
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


                const nextDose = finalHistoryData.find(item => item.status !== 'Taken');
                setNextScheduledDose(nextDose || null);

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

            {/* Missed Medications Card */}
            {missedHistory.length > 0 && (
                <Card sx={{ mb: 4 }}>
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
                <Card sx={{ mb: 4 }}>
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
                                            secondary={`Dose: ${item.dose}, Scheduled: ${item.scheduledTime}, Taken: ${takenTimeFormatted}`}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    </CardContent>
                </Card>
            )}

            <Grid container spacing={2}>
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
            {/* Next Scheduled Dose */}
            <Container sx={{ mt: 4 }}>
                <Typography variant="h6" fontWeight="bold">Next Scheduled Dose</Typography>
                {nextScheduledDose ? (
                    <Card sx={{ backgroundColor: "#e3f2fd", p: 2, mt: 1 }}>
                        <Typography variant="body1">
                            <strong>{nextScheduledDose.medicineName}</strong> - {nextScheduledDose.dose}
                        </Typography>
                        <Typography variant="body2">Scheduled at: {nextScheduledDose.scheduledTime}</Typography>
                    </Card>
                ) : (
                    <Typography variant="body2">No upcoming scheduled doses.</Typography>
                )}
            </Container>
        </Container>
    );
};

export default HistoryContent;
