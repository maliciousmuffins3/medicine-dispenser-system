import React, { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  Container,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth"; // Import authentication hook

const ForgotPassword = () => {
  const { resetPassword } = useAuth(); // Function to handle password reset
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    try {
      await resetPassword(email);
      setMessage("Password reset link sent! Check your email.");
    } catch (err) {
      console.log("Reset Password Error:", err.message);
      setError("Failed to send password reset email. Try again.");
    }
  };

  return (
    <Container maxWidth="xs">
      <Card sx={{ mt: 8, p: 3, textAlign: "center", boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" color="green" mb={2}>
            Forgot Password
          </Typography>

          {/* Display success or error messages */}
          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Enter your email"
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            fullWidth
            variant="contained"
            color="success"
            sx={{ mt: 2, mb: 2 }}
            onClick={handleReset}
          >
            Reset Password
          </Button>

          <Typography variant="body2">
            Remembered your password? {" "}
            <span
              style={{ color: "green", cursor: "pointer" }}
              onClick={() => navigate("/login")}
            >
              Sign In
            </span>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ForgotPassword;
