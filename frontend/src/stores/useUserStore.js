import { create } from "zustand";
import { toast } from "react-hot-toast";

import axios from "../lib/axios.js";

export const useUserStore = create((set, get) => ({
    user: null,
    loading: false,
    checkingAuth: true,

    signUpUser: async ({ name, email, password, confirmPassword }) => {

        set({ loading: true });
        if (password !== confirmPassword) {
            set({ loading: false });
            return toast.error("Passwords do not match");
        }

        try {
            const res = await axios.post("/auth/signup", { name, email, password });
            set({ user: res.data, loading: false });
        } catch (error) {
            set({ loading: false });
            toast.error(error.response.data.message || "An Error Occurred during Sign Up");
        }
    },

    logInUser: async (email, password) => {

        set({ loading: true });
        try {
            const res = await axios.post("/auth/login", { email, password });
            set({ user: res.data, loading: false });
        } catch (error) {
            set({ loading: false });
            toast.error(error.response.data.message || "An Error Occurred during Log In");
        }
    },

    logOutUser: async () => {
        try {
            await axios.post("/auth/logout");
            set({ user: null });
        } catch (error) {
            toast.error(error.response.data.message || "An Error Occurred during Log Out");
        }
    },

    checkAuth: async () => {

        set({ checkingAuth: true });
        try {
            const response = await axios.get("/auth/userProfile");
            set({ user: response.data, checkingAuth: false });
        } catch (error) {
            set({ user: null, checkingAuth: false });
            // toast.error(error.response.data.message || "An Error Occurred during Checking Auth");
        }
    },

    refreshToken: async () => {
        // Prevent Multiple Simultaneous Refresh Attempts
        if (get().checkingAuth) return;

        set({ checkingAuth: true });
        try {
            const response = await axios.post("/auth/refresh-token");
            set({ checkingAuth: false });
            return response.data;
        } catch (error) {
            set({ user: null, checkingAuth: false });
            throw error;
        }
    }
}));

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh

let refreshPromise = null;

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // If a request to refresh token is already in progress, wait for it to complete
                if (refreshPromise) {
                    await refreshPromise;
                    return axios(originalRequest);
                }

                // Start a new refresh token request
                refreshPromise = useUserStore.getState().refreshToken();
                await refreshPromise;
                refreshPromise = null;

                return axios(originalRequest);
            } catch (refreshError) {
                // If the refresh token fails, log out the user
                useUserStore.getState().logOut();
                toast.error(refreshError.response.data.message || "Failed to refresh token");
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
)