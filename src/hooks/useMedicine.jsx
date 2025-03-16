import { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig"; // Import the Firestore configuration
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";

// Custom hook for managing medicine and schedule CRUD operations
const useMedicine = (medicinesCollection, schedulesCollection) => {
  // State to store medicines and schedules data
  const [medicinesData, setMedicinesData] = useState([]);
  const [schedulesData, setSchedulesData] = useState([]);
  
  const [loading, setLoading] = useState(true); // To indicate loading state
  const [error, setError] = useState(null); // Error state to handle any errors

  // Fetch medicines data using Firestore real-time updates
  useEffect(() => {
    const medicinesRef = collection(db, medicinesCollection); // Reference to the Firestore collection for medicines
    const schedulesRef = collection(db, schedulesCollection); // Reference to the Firestore collection for schedules

    // Real-time listener for medicines Firestore updates
    const unsubscribeMedicines = onSnapshot(
      medicinesRef,
      (snapshot) => {
        const medicines = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setMedicinesData(medicines); // Set medicines data in state
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    // Real-time listener for schedules Firestore updates
    const unsubscribeSchedules = onSnapshot(
      schedulesRef,
      (snapshot) => {
        const schedules = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setSchedulesData(schedules); // Set schedules data in state
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    // Clean up listeners when the component unmounts
    return () => {
      unsubscribeMedicines();
      unsubscribeSchedules();
    };
  }, [medicinesCollection, schedulesCollection]);

  // Add a new medicine to the collection
  const addMedicine = async (data) => {
    try {
      const newDocRef = doc(collection(db, medicinesCollection)); // Reference to the new document
      await setDoc(newDocRef, data); // Set document data in Firestore
      console.log("Successfully added a new medicine!");
    } catch (e) {
      console.error("Error adding medicine: ", e);
    }
  };

  // Edit an existing medicine in the collection
  const editMedicine = async (id, data) => {
    try {
      const docRef = doc(db, medicinesCollection, id); // Reference to the document to edit
      await updateDoc(docRef, data); // Update the document in Firestore
      console.log("Successfully updated the medicine!");
    } catch (e) {
      console.error("Error updating medicine: ", e);
    }
  };

  // Delete a medicine from the collection
  const deleteMedicine = async (id) => {
    try {
      const docRef = doc(db, medicinesCollection, id); // Reference to the document to delete
      await deleteDoc(docRef); // Delete the document from Firestore
      console.log("Successfully deleted the medicine!");
    } catch (e) {
      console.error("Error deleting medicine: ", e);
    }
  };

  // Add a new schedule to the collection
  const addSchedule = async (data) => {
    try {
      const newDocRef = doc(collection(db, schedulesCollection)); // Reference to the new schedule document
      await setDoc(newDocRef, data); // Set schedule data in Firestore
      console.log("Successfully added a new schedule!");
    } catch (e) {
      console.error("Error adding schedule: ", e);
    }
  };

  // Edit an existing schedule in the collection
  const editSchedule = async (id, data) => {
    try {
      const docRef = doc(db, schedulesCollection, id); // Reference to the document to edit
      await updateDoc(docRef, data); // Update the schedule in Firestore
      console.log("Successfully updated the schedule!");
    } catch (e) {
      console.error("Error updating schedule: ", e);
    }
  };

  // Delete a schedule from the collection
  const deleteSchedule = async (id) => {
    try {
      const docRef = doc(db, schedulesCollection, id); // Reference to the schedule to delete
      await deleteDoc(docRef); // Delete the schedule document from Firestore
      console.log("Successfully deleted the schedule!");
    } catch (e) {
      console.error("Error deleting schedule: ", e);
    }
  };

  // Return the medicines data, schedules data, loading, error state, and CRUD functions
  return {
    medicinesData,
    schedulesData,
    loading,
    error,
    addMedicine,
    editMedicine,
    deleteMedicine,
    addSchedule,
    editSchedule,
    deleteSchedule,
  };
};

export default useMedicine;