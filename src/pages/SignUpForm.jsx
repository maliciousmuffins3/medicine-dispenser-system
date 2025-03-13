// import React, { useState } from "react";
// import {
//   TextField,
//   Button,
//   Container,
//   Typography,
//   Box,
//   Paper,
//   InputAdornment,
//   IconButton,
//   Link
// } from "@mui/material";
// import { Visibility, VisibilityOff } from "@mui/icons-material";
// import { useForm } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as yup from "yup";
// import GoogleIcon from "@mui/icons-material/Google";
// import { signUpWithEmail, signInWithGoogle } from "../firebaseConfig"; // Firebase functions
// import { useNavigate } from "react-router-dom"; // Navigation

// // Validation Schema
// const schema = yup.object().shape({
//   email: yup.string().email("Invalid email").required("Email is required"),
//   password: yup.string().min(6, "Minimum 6 characters").required("Password is required"),
//   confirmPassword: yup
//     .string()
//     .oneOf([yup.ref("password"), null], "Passwords must match")
//     .required("Confirm password is required"),
// });

// const SignUp = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const navigate = useNavigate();

//   const togglePasswordVisibility = () => {
//     setShowPassword((prev) => !prev);
//   };

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm({ resolver: yupResolver(schema) });

//   const handleSignUp = async (data) => {
//     try {
//       await signUpWithEmail(data.email, data.password);
//       console.log("User signed up:", data);
//       navigate("/"); // Redirect to sign-in page after successful sign-up
//     } catch (error) {
//       console.error(error.message);
//     }
//   };

//   return (
//     <Container component="main" maxWidth="xs">
//       <Paper elevation={6} sx={{ p: 4, mt: 6, borderRadius: 3, textAlign: "center" }}>
//         <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>Sign Up</Typography>
        
//         <Box component="form" onSubmit={handleSubmit(handleSignUp)} sx={{ width: "100%" }}>
//           <TextField
//             fullWidth
//             label="Email Address"
//             margin="normal"
//             {...register("email")}
//             error={!!errors.email}
//             helperText={errors.email?.message}
//           />

//           <TextField
//             fullWidth
//             label="Password"
//             type={showPassword ? "text" : "password"}
//             margin="normal"
//             {...register("password")}
//             error={!!errors.password}
//             helperText={errors.password?.message}
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position="end">
//                   <IconButton onClick={togglePasswordVisibility}>
//                     {showPassword ? <VisibilityOff /> : <Visibility />}
//                   </IconButton>
//                 </InputAdornment>
//               ),
//             }}
//           />

//           <TextField
//             fullWidth
//             label="Confirm Password"
//             type="password"
//             margin="normal"
//             {...register("confirmPassword")}
//             error={!!errors.confirmPassword}
//             helperText={errors.confirmPassword?.message}
//           />

//           <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 2 }}>
//             Sign Up
//           </Button>

//           <Typography variant="body2" sx={{ mt: 2 }}>or</Typography>

//           <Button
//             fullWidth
//             variant="outlined"
//             sx={{ mt: 2, color: "#4285F4", borderColor: "#4285F4" }}
//             onClick={signInWithGoogle}
//           >
//             <GoogleIcon sx={{ color: "#4285F4", mr: 1 }} />
//             Sign up with Google
//           </Button>

//           <Box sx={{ mt: 3 }}>
//             <Typography variant="body2">
//               Already have an account?{" "}
//               <Link component="button" onClick={() => navigate("/")} sx={{ color: "#4285F4" }}>
//                 Sign In
//               </Link>
//             </Typography>
//           </Box>
//         </Box>
//       </Paper>
//     </Container>
//   );
// };

// export default SignUp;
