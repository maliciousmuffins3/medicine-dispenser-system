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
  Alert, // For error messages
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import GoogleIcon from "@mui/icons-material/Google";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom"; // For redirecting after login

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate(); // Hook to navigate between routes

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(""); // To handle login error messages

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      await login(email, password);
      console.log("User logged in successfully!");
      navigate("/home"); // Redirect to homepage after successful login
    } catch (err) {
      console.log("Login Error:", err.message);
      setError("Invalid email or password. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    setError(""); // Clear previous errors
    try {
      await loginWithGoogle();
      navigate("/home"); // Redirect to homepage after successful login
    } catch (error) {
      console.log("Google Login Error:", error.message);
      setError("Google sign-in failed. Please try again.");
    }
  };

  return (
    <Container maxWidth="xs">
      <Card sx={{ mt: 8, p: 3, textAlign: "center", boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" color="green" mb={2}>
            Sign In
          </Typography>

          {/* Displaying error message */}
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

          <Box textAlign="right">
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: "pointer" }}
              onClick={() => navigate("/forgot-password")} // Redirect to forgot password page
            >
              Forgot Password?
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            color="success"
            sx={{ mt: 2, mb: 2 }}
            onClick={handleLogin}
          >
            Sign In
          </Button>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            sx={{ mb: 2 }}
            onClick={handleGoogleLogin}
          >
            Sign in with Google
          </Button>

          <Typography variant="body2">
            Don't have an account?{" "}
            <span
              style={{ color: "green", cursor: "pointer" }}
              onClick={() => navigate("/sign-up")} // Redirect to sign-up page
            >
              Create one
            </span>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;
