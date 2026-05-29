import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../api/client';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, profile } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (token) {
      const newSocket = io(BASE_URL, {
        auth: { token },
      });

      newSocket.on('connect', () => {
        setSocket(newSocket);
      });

      newSocket.on('user-status', (data: { userId: string; is_online: boolean; show_online_status: boolean }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (data.is_online && data.show_online_status) next.add(data.userId);
          else next.delete(data.userId);
          return next;
        });
      });

      return () => {
        newSocket.close();
      };
    } else {
      socket?.close();
      setSocket(null);
    }
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
