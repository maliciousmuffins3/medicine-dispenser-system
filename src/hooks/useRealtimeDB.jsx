// /hooks/useRealtimeDB.js
import { useEffect, useState } from "react";
import { getData, setData, updateData, deleteData, subscribeToData } from "../firebase/realtimeDBHelper";

const useRealtimeDB = (path) => {
  const [data, setDataState] = useState(null);

  useEffect(() => {
    subscribeToData(path, (newData) => setDataState(newData));
  }, [path]);

  const add = (newData) => setData(path, newData);
  const update = (updatedData) => updateData(path, updatedData);
  const remove = () => deleteData(path);

  return { data, add, update, remove };
};

export default useRealtimeDB;
