// import React, { useState } from "react";
// import {
//   TextField,
//   Button,
//   Container,
//   Typography,
//   Box,
//   Paper,
//   Link
// } from "@mui/material";
// import { useForm } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as yup from "yup";
// import { resetPassword } from "../firebaseConfig"; // Firebase function
// import { useNavigate } from "react-router-dom";

// // Validation Schema
// const schema = yup.object().shape({
//   email: yup.string().email("Invalid email").required("Email is required"),
// });

// const ForgotPassword = () => {
//   const [message, setMessage] = useState("");
//   const navigate = useNavigate();

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm({ resolver: yupResolver(schema) });

//   const handlePasswordReset = async (data) => {
//     try {
//       await resetPassword(data.email);
//       setMessage("Password reset email sent! Check your inbox.");
//     } catch (error) {
//       setMessage(error.message);
//     }
//   };

//   return (
//     <Container component="main" maxWidth="xs">
//       <Paper elevation={6} sx={{ p: 4, mt: 6, borderRadius: 3, textAlign: "center" }}>
//         <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>Forgot Password</Typography>

//         {message && <Typography color="green">{message}</Typography>}

//         <Box component="form" onSubmit={handleSubmit(handlePasswordReset)} sx={{ width: "100%" }}>
//           <TextField
//             fullWidth
//             label="Email Address"
//             margin="normal"
//             {...register("email")}
//             error={!!errors.email}
//             helperText={errors.email?.message}
//           />

//           <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 2 }}>
//             Reset Password
//           </Button>

//           <Box sx={{ mt: 3 }}>
//             <Typography variant="body2">
//               Remembered your password?{" "}
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

// export default ForgotPassword;
