// /firebase/realtimeDBHelper.js
import { ref, set, get, update, remove, onValue } from "firebase/database";
import { rtdb } from "./firebaseConfig";

// Add or update data
export const setData = (path, data) => {
  return set(ref(rtdb, path), data);
};

// Get data once
export const getData = async (path) => {
  const snapshot = await get(ref(rtdb, path));
  return snapshot.exists() ? snapshot.val() : null;
};

// Update data
export const updateData = (path, data) => {
  return update(ref(rtdb, path), data);
};

// Delete data
export const deleteData = (path) => {
  return remove(ref(rtdb, path));
};

// Subscribe to realtime changes
export const subscribeToData = (path, callback) => {
  const dataRef = ref(rtdb, path);
  onValue(dataRef, (snapshot) => {
    callback(snapshot.val());
  });
};
