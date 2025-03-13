// import React, { useState } from "react";
// import {
//   TextField,
//   Button,
//   Container,
//   Typography,
//   Box,
//   Paper,
//   Divider,
//   IconButton,
//   InputAdornment,
//   Link
// } from "@mui/material";
// import { Visibility, VisibilityOff } from "@mui/icons-material"; // Import Visibility Icons
// import { useForm } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as yup from "yup";
// import GoogleIcon from '@mui/icons-material/Google'; // Import Google Icon from MUI
// import { signInWithGoogle, loginUser } from "../firebaseConfig"; // Import Firebase functions

// // Validation Schema
// const schema = yup.object().shape({
//   email: yup.string().email("Invalid email").required("Email is required"),
//   password: yup.string().min(6, "Minimum 6 characters").required("Password is required"),
// });

// const SignInForm = ({ onSubmit, onSignUp, onForgotPassword }) => {
//   const [showPassword, setShowPassword] = useState(false); // Password visibility state

//   const togglePasswordVisibility = () => {
//     setShowPassword((prev) => !prev);
//   };

//   const handleGoogleSignIn = async () => {
//     try {
//       const userData = await signInWithGoogle();
//       console.log("User signed in:", userData);
//     } catch (error) {
//       console.error(error.message);
//     }
//   };

//   const handleEmailLogIn = async (data) => {
//     try {
//       const userData = await loginUser(data.email, data.password);
//       console.log("User logged in:", userData);
//     } catch (error) {
//       console.error(error.message);
//     }
//   };

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm({ resolver: yupResolver(schema) });

//   return (
//     <Container component="main" maxWidth="xs">
//       <Paper
//         elevation={6}
//         sx={{
//           p: 4,
//           mt: 6,
//           borderRadius: 3,
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           boxShadow: "0 6px 20px rgba(0, 0, 0, 0.1)",
//         }}
//       >
//         <Typography variant="h4" align="center" sx={{ fontWeight: 600, mb: 4 }}>
//           Sign In
//         </Typography>

//         <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ width: "100%" }}>
//           <TextField
//             fullWidth
//             label="Email Address"
//             margin="normal"
//             {...register("email")}
//             error={!!errors.email}
//             helperText={errors.email?.message}
//             sx={{
//               mb: 2,
//               "& .MuiInputLabel-root": { color: "#555" },
//               "& .MuiInputBase-root": { borderRadius: "8px" },
//             }}
//           />

//           <TextField
//             fullWidth
//             label="Password"
//             type={showPassword ? "text" : "password"} // Toggle type
//             margin="normal"
//             {...register("password")}
//             error={!!errors.password}
//             helperText={errors.password?.message}
//             sx={{
//               mb: 1,
//               "& .MuiInputLabel-root": { color: "#555" },
//               "& .MuiInputBase-root": { borderRadius: "8px" },
//             }}
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position="end">
//                   <IconButton onClick={togglePasswordVisibility} edge="end">
//                     {showPassword ? <VisibilityOff /> : <Visibility />}
//                   </IconButton>
//                 </InputAdornment>
//               ),
//             }}
//           />

//           {/* Forgot Password Link */}
//           <Box sx={{ textAlign: "right", width: "100%", mb: 2 }}>
//             <Link component="button" variant="body2" onClick={onForgotPassword} sx={{ textDecoration: "none", color: "#4285F4", ":hover": { textDecoration: "underline" } }}>
//               Forgot Password?
//             </Link>
//           </Box>

//           <Button
//             type="submit"
//             fullWidth
//             variant="contained"
//             color="primary"
//             sx={{
//               mt: 1,
//               padding: "12px 0",
//               fontWeight: 600,
//               textTransform: "none",
//               borderRadius: "20px",
//               boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
//             }}
//             onClick={handleSubmit(handleEmailLogIn)}
//           >
//             Sign In
//           </Button>

//           <Box sx={{ textAlign: "center", mt: 2 }}>
//             <Typography variant="body2" color="textSecondary">
//               or
//             </Typography>
//           </Box>

//           {/* Divider between form and Google button */}
//           <Divider sx={{ my: 2 }} />

//           {/* Google Sign-In Button */}
//           <Button
//             fullWidth
//             variant="outlined"
//             sx={{
//               mt: 2,
//               padding: "12px 0",
//               fontWeight: 600,
//               textTransform: "none",
//               borderColor: "#4285F4",
//               color: "#4285F4",
//               borderRadius: "20px",
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
//               ":hover": {
//                 borderColor: "#357AE8",
//                 color: "#357AE8",
//                 backgroundColor: "#f1f1f1",
//               },
//             }}
//             onClick={handleGoogleSignIn}
//           >
//             <GoogleIcon sx={{ color: "#4285F4", marginRight: 2 }} />
//             Sign in with Google
//           </Button>

//           {/* New User - Create Account */}
//           <Box sx={{ textAlign: "center", mt: 3 }}>
//             <Typography variant="body2">
//               Don't have an account?{" "}
//               <Link component="button" variant="body2" onClick={onSignUp} sx={{ textDecoration: "none", color: "#4285F4", ":hover": { textDecoration: "underline" } }}>
//                 Sign Up
//               </Link>
//             </Typography>
//           </Box>
//         </Box>
//       </Paper>
//     </Container>
//   );
// };

// export default SignInForm;
