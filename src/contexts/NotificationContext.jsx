'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '@/components/ui/Toast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    // If there's already a notification, clear it first
    setNotification(null);
    
    // Set the new notification in next tick to trigger re-animation
    setTimeout(() => {
      setNotification({ message, type, duration });
    }, 50);
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={hideNotification}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
