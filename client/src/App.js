// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import AdminPanel from './components/AdminPanel';
import OutputPage from './components/OutputPage';
import './App.css';

// Configure API and WebSocket endpoints
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

function App() {
  const [socket, setSocket] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Clean up the socket on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/settings`);
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await response.json();
        setSettings(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('settings-update', (updatedSettings) => {
      setSettings(updatedSettings);
    });

    return () => {
      socket.off('settings-update');
    };
  }, [socket]);

  // Save settings function that can be passed to child components
  const saveSettings = async (newSettings) => {
    try {
      const response = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error saving settings:', err);
      throw err;
    }
  };

  // Upload logo function
  const uploadLogo = async (logoFile) => {
    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      const response = await fetch(`${API_URL}/upload-logo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error uploading logo:', err);
      throw err;
    }
  };

  // Reset settings function
  const resetSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/reset-settings`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset settings');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error resetting settings:', err);
      throw err;
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <AdminPanel 
              settings={settings} 
              saveSettings={saveSettings} 
              uploadLogo={uploadLogo}
              resetSettings={resetSettings}
            />
          } 
        />
        <Route 
          path="/output" 
          element={
            <OutputPage 
              settings={settings} 
              socket={socket}
            />
          } 
        />
        {/* Aggiungi una route di fallback che reindirizza alla home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;