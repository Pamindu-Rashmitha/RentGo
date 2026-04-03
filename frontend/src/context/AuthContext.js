import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user on app launch
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load stored user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const userData = response.data;

      // Store user data and token
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('userToken', userData.token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });
      const userData = response.data;

      // Store user data and token
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('userToken', userData.token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('userToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
