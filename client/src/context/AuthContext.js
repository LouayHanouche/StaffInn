import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const refresh = async () => {
        try {
            const refreshed = await api.post('/auth/refresh');
            tokenStore.set(refreshed.accessToken);
            const profile = await api.get('/auth/me');
            setUser(profile.user);
        }
        catch {
            tokenStore.set(null);
            setUser(null);
        }
    };
    useEffect(() => {
        void refresh().finally(() => setIsLoading(false));
    }, []);
    const login = async (email, password) => {
        const payload = await api.post('/auth/login', {
            email,
            password,
        });
        tokenStore.set(payload.accessToken);
        setUser(payload.user);
    };
    const register = async (payload) => {
        const created = await api.post('/auth/register', payload);
        tokenStore.set(created.accessToken);
        setUser(created.user);
    };
    const logout = async () => {
        await api.post('/auth/logout');
        tokenStore.set(null);
        setUser(null);
    };
    const value = useMemo(() => ({
        user,
        isLoading,
        login,
        register,
        logout,
        refresh,
    }), [user, isLoading]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
