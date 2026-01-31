import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ToastContextType {
  showToast: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 1800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={`toast ${visible ? 'show' : ''}`}>{message}</div>
    </ToastContext.Provider>
  );
}

// Sync status
type SyncStatus = 'live' | 'saving';

interface SyncContextType {
  syncStatus: SyncStatus;
  setSyncStatus: (s: SyncStatus) => void;
}

const SyncContext = createContext<SyncContextType>({ syncStatus: 'live', setSyncStatus: () => {} });

export function useSyncStatus() {
  return useContext(SyncContext);
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('live');
  return (
    <SyncContext.Provider value={{ syncStatus, setSyncStatus }}>
      {children}
    </SyncContext.Provider>
  );
}
