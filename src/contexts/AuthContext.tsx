import React, { createContext, useContext, useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { dbService } from '../services/db';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export interface RegisterData {
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  subjectSpecialty?: string;
  studentId?: string; // class ID or child ID
}

interface AuthContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void;
  setCurrentUser: (user: UserProfile) => void;
  availableUsers: UserProfile[];
  login: (email: string, password?: string) => Promise<UserProfile>;
  register: (data: RegisterData) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_STORAGE_KEY = 'smartclass_current_user_id';
const LOGGED_OUT_STORAGE_KEY = 'smartclass_logged_out';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => dbService.getUsers());

  const refreshUsers = () => {
    setUsers(dbService.getUsers());
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const isLoggedOut = localStorage.getItem(LOGGED_OUT_STORAGE_KEY) === 'true';
    if (isLoggedOut) return false;
    const savedId = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (savedId) {
      const allUsers = dbService.getUsers();
      return allUsers.some(u => u.id === savedId);
    }
    // Default to authenticated for initial demo experience
    return true;
  });

  const [currentUser, setCurrentUserState] = useState<UserProfile>(() => {
    const allUsers = dbService.getUsers();
    const savedId = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (savedId) {
      const found = allUsers.find(u => u.id === savedId);
      if (found) return found;
    }
    // Default to teacher
    return allUsers.find(u => u.role === 'TEACHER') || allUsers[0];
  });

  const setCurrentUser = (user: UserProfile) => {
    setCurrentUserState(user);
    localStorage.removeItem(LOGGED_OUT_STORAGE_KEY);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, user.id);
    setIsAuthenticated(true);
  };

  const login = async (email: string, _password?: string): Promise<UserProfile> => {
    const allUsers = dbService.getUsers();
    const found = allUsers.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      throw new Error('Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới!');
    }
    setCurrentUser(found);
    return found;
  };

  const register = async (data: RegisterData): Promise<UserProfile> => {
    // 1. Save in local database service
    const newUser = dbService.createUser({
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      phone: data.phone,
      subjectSpecialty: data.subjectSpecialty,
      studentId: data.studentId,
    });

    // 2. Sync to Firestore in background
    try {
      await setDoc(doc(db, 'users', newUser.id), {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl || '',
        phone: newUser.phone || '',
        schoolId: newUser.schoolId || 'sch-01',
        subjectSpecialty: newUser.subjectSpecialty || '',
        studentId: newUser.studentId || '',
        status: newUser.status,
        createdAt: newUser.createdAt,
      });
    } catch (err) {
      console.warn('Could not sync newly registered user to Firestore:', err);
    }

    refreshUsers();
    setCurrentUser(newUser);
    return newUser;
  };

  const logout = async () => {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    localStorage.setItem(LOGGED_OUT_STORAGE_KEY, 'true');
    setIsAuthenticated(false);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signOut:', err);
    }
  };

  const switchRole = (role: UserRole) => {
    const currentList = dbService.getUsers();
    const target = currentList.find(u => u.role === role);
    if (target) {
      setCurrentUser(target);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchRole,
        setCurrentUser,
        availableUsers: users,
        login,
        register,
        logout,
        isAuthenticated,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
