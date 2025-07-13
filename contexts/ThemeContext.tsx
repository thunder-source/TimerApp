import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeMode, lightColors, darkColors } from '../utils/theme';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { THEME_KEY } from '../constant/storageKeys';

interface ThemeContextType {
    currentTheme: ThemeMode;
    colors: typeof lightColors;
    setCurrentTheme: (theme: ThemeMode) => Promise<void>;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const { getItem: getStoredTheme, setItem: saveTheme } = useAsyncStorage<ThemeMode>(THEME_KEY);
    const [currentTheme, setCurrentThemeState] = useState<ThemeMode>('light');

    // Get colors based on current theme
    const colors = currentTheme === 'dark' ? darkColors : lightColors;

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedTheme = await getStoredTheme();
                if (storedTheme) {
                    setCurrentThemeState(storedTheme);
                }
            } catch (error) {
                console.error('Error loading theme:', error);
            }
        };

        loadTheme();
    }, [getStoredTheme]);

    const setCurrentTheme = async (theme: ThemeMode) => {
        try {
            setCurrentThemeState(theme);
            await saveTheme(theme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const value: ThemeContextType = {
        currentTheme,
        colors,
        setCurrentTheme,
        isDark: currentTheme === 'dark',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}; 