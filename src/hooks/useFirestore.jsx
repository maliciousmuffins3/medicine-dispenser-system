// /hooks/useFirestore.js
import { useEffect, useState } from "react";
import { getCollection, addDocument, updateDocument, deleteDocument } from "../firebase/firestoreHelper";

const useFirestore = (collectionName) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getCollection(collectionName);
      setData(result);
    };
    fetchData();
  }, [collectionName]);

  const add = async (newData) => {
    const id = await addDocument(collectionName, newData);
    setData([...data, { id, ...newData }]);
  };

  const update = async (id, updatedData) => {
    await updateDocument(collectionName, id, updatedData);
    setData(data.map((item) => (item.id === id ? { ...item, ...updatedData } : item)));
  };

  const remove = async (id) => {
    await deleteDocument(collectionName, id);
    setData(data.filter((item) => item.id !== id));
  };

  return { data, add, update, remove };
};

export default useFirestore;
