import React from "react";
import { CircularProgress, Backdrop } from "@mui/material";

const LoadingOverlay = ({ open }) => {
  return (
    <Backdrop
      sx={{ 
        color: "#4CAF50", 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: "white" // Set background to white
      }} 
      open={open}
    >
      <CircularProgress size={60} sx={{ color: "#4CAF50" }} />
    </Backdrop>
  );
};

export default LoadingOverlay;