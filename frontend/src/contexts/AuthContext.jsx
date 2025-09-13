import axios from "axios";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: "http://localhost:8000/api/v1/users", // or use your `server` variable
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState(authContext);
  const router = useNavigate();

  // Register
  const handleRegister = async (name, username, password) => {
    try {
      const request = await client.post("/register", {
        name,
        username,
        password,
      });

      if (request.status === 201) {
        return request.data.message;
      }
    } catch (error) {
      throw error;
    }
  };

  // Login
  const handleLogin = async (username, password) => {
    try {
      const request = await client.post("/login", {
        username,
        password,
      });

      if (request.status === 200) {
        localStorage.setItem("token", request.data.token);
        router("/home"); // changed to match your previous logic
      }
    } catch (error) {
      throw error;
    }
  };

  const addToUserHistory = async (meetingCode) => {
    const token = localStorage.getItem("token");
    try {
      const request = await client.post(
        "/add_to_activity",
        { meeting_code: meetingCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (request.status !== 201) {
        throw new Error(request.data.message || "Failed to add to history");
      }

      return request;
    } catch (error) {
      console.error("addToUserHistory failed:", error);
      throw error;
    }
  };

  const getHistoryOfUser = async () => {
    const token = localStorage.getItem("token");
    try {
      const request = await client.get("/get_all_activity", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return request.data;
    } catch (error) {
      throw error;
    }
  };

  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    addToUserHistory,
    getHistoryOfUser,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
