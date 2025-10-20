import { createContext, useState, useContext } from "react";
import type { ReactNode } from 'react';
import type { User } from '../types';

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const mockAdminUser: User = {
  id: '1',
  email: 'admin@example.com',
  role: 'admin',
  name: 'Admin User',
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Mock login: only accept admin@example.com / password
    if (email === 'admin@example.com' && password === 'password') {
      setUser(mockAdminUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
