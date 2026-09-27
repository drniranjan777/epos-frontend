import { createContext } from 'react';

/** Value provided by <AuthProvider>; read it with the useAuth() hook. */
export const AuthContext = createContext(null);
