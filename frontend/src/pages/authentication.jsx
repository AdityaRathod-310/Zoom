import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  CssBaseline,
  TextField,
  Typography,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  Paper,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContext";

const theme = createTheme({
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
});

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0); // 0: login, 1: register
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleClose = () => setSnackbarOpen(false);

  const handleAuth = async () => {
    setError("");
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      } else {
        const result = await handleRegister(name, username, password);
        setMessage(result);
        setSnackbarOpen(true);
        setFormState(0);
        setName("");
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      const message = err?.response?.data?.message || "Something went wrong";
      setError(message);
      setSnackbarOpen(true);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f4f6f8",
          padding: 2,
        }}
      >
        <Paper
          elevation={2}
          sx={{
            width: "100%",
            maxWidth: 400,
            padding: isSmallScreen ? 3 : 4,
            borderRadius: 2,
            backgroundColor: "#fff",
          }}
        >
          <Box textAlign="center" mb={2}>
            <Avatar sx={{ bgcolor: "primary.main", mx: "auto", mb: 1 }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              {formState === 0 ? "Sign In" : "Sign Up"}
            </Typography>
          </Box>

          <ToggleButtonGroup
            color="primary"
            value={formState}
            exclusive
            onChange={(e, val) => val !== null && setFormState(val)}
            fullWidth
            sx={{
              mb: 2,
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontWeight: 500,
              },
              "& .Mui-selected": {
                backgroundColor: "#1976d2 !important",
                color: "#fff !important",
              },
            }}
          >
            <ToggleButton value={0}>Sign In</ToggleButton>
            <ToggleButton value={1}>Sign Up</ToggleButton>
          </ToggleButtonGroup>

          <Box component="form" noValidate>
            {formState === 1 && (
              <TextField
                fullWidth
                margin="normal"
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <TextField
              fullWidth
              margin="normal"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              variant="contained"
              fullWidth
              sx={{
                mt: 3,
                py: 1.5,
                textTransform: "none",
                fontWeight: "bold",
                borderRadius: 1,
              }}
              onClick={handleAuth}
            >
              {formState === 0 ? "Login" : "Register"}
            </Button>
          </Box>
        </Paper>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleClose}
            severity={error ? "error" : "success"}
            sx={{ width: "100%" }}
          >
            {error || message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
