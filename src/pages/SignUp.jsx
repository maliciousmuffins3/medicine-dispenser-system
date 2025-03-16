import React, { useState } from "react";
import {
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Typography,
  Box,
  Container,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import GoogleIcon from "@mui/icons-material/Google";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const { signUp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await signUp(email, password);
      console.log("User signed up successfully!");
      navigate("/home"); // Redirect after successful sign-up
    } catch (err) {
      console.log("Sign Up Error:", err.message);
      setError("Failed to create an account. Please try again.");
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    try {
      await loginWithGoogle();
      navigate("/home"); // Redirect after Google sign-up
    } catch (error) {
      console.log("Google Sign-Up Error:", error.message);
      setError("Google sign-up failed. Please try again.");
    }
  };

  return (
    <Container maxWidth="xs">
      <Card sx={{ mt: 8, p: 3, textAlign: "center", boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" color="green" mb={2}>
            Sign Up
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            fullWidth
            label="Password"
            variant="outlined"
            margin="normal"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleTogglePassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            variant="outlined"
            margin="normal"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleTogglePassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            variant="contained"
            color="success"
            sx={{ mt: 2, mb: 2 }}
            onClick={handleSignUp}
          >
            Sign Up
          </Button>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            sx={{ mb: 2 }}
            onClick={handleGoogleSignUp}
          >
            Sign up with Google
          </Button>

          <Typography variant="body2">
            Already have an account?{" "}
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

export default SignUp;
