import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Alert,
    Share,
    ScrollView,
    Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Header } from '../components/ui';
import { colors, spacing, fontSizes, borderRadius, ThemeMode } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';
import { HISTORY_KEY } from '../constant/storageKeys';
import { useTimers } from '../contexts/TimerContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
    const { timers } = useTimers();
    const { currentTheme, colors, setCurrentTheme } = useTheme();
    const [isColorPickerVisible, setColorPickerVisible] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string>('primary');

    const handleThemeChange = async (theme: ThemeMode) => {
        try {
            await setCurrentTheme(theme);
        } catch (error) {
            console.error('Error saving theme:', error);
            Alert.alert('Error', 'Failed to save theme preference');
        }
    };

    const exportHistoryData = async () => {
        try {
            // Get history data from AsyncStorage
            const historyData = await AsyncStorage.getItem(HISTORY_KEY);
            const history = historyData ? JSON.parse(historyData) : [];

            // Create export data
            const exportData = {
                exportDate: new Date().toISOString(),
                appVersion: '1.0.0',
                totalTimers: timers.length,
                history: history,
                currentTimers: timers,
            };

            const jsonString = JSON.stringify(exportData, null, 2);

            // Share the data
            await Share.share({
                message: jsonString,
                title: 'Timer App History Export',
            });
        } catch (error) {
            console.error('Error exporting data:', error);
            Alert.alert('Error', 'Failed to export history data');
        }
    };

    const clearAllData = () => {
        Alert.alert(
            'Clear All Data',
            'This will permanently delete all timers, history, and settings. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear();
                            Alert.alert('Success', 'All data has been cleared');
                        } catch (error) {
                            console.error('Error clearing data:', error);
                            Alert.alert('Error', 'Failed to clear data');
                        }
                    },
                },
            ]
        );
    };

    const renderSettingItem = (
        title: string,
        subtitle?: string,
        rightComponent?: React.ReactNode,
        onPress?: () => void
    ) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {rightComponent}
        </TouchableOpacity>
    );

    const renderColorOption = (colorName: string, colorValue: string) => (
        <TouchableOpacity
            key={colorName}
            style={[
                styles.colorOption,
                { backgroundColor: colorValue },
                selectedColor === colorName && styles.selectedColor,
            ]}
            onPress={() => setSelectedColor(colorName)}
        >
            {selectedColor === colorName && (
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
            )}
        </TouchableOpacity>
    );

    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            <Header title="Settings" />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Theme Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Appearance</Text>

                    {renderSettingItem(
                        'Dark Mode',
                        'Switch between light and dark themes',
                        <Switch
                            value={currentTheme === 'dark'}
                            onValueChange={(value) => handleThemeChange(value ? 'dark' : 'light')}
                            trackColor={{ false: colors.border, true: colors.primary + '40' }}
                            thumbColor={currentTheme === 'dark' ? colors.primary : colors.muted}
                        />
                    )}

                    {renderSettingItem(
                        'Customize Colors',
                        'Change app color scheme',
                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />,
                        () => setColorPickerVisible(true)
                    )}
                </View>

                {/* Data Management Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data Management</Text>

                    {renderSettingItem(
                        'Export History',
                        'Export all timer history as JSON',
                        <MaterialCommunityIcons name="download" size={24} color={colors.primary} />,
                        exportHistoryData
                    )}

                    {renderSettingItem(
                        'Clear All Data',
                        'Delete all timers, history, and settings',
                        <MaterialCommunityIcons name="delete" size={24} color={colors.danger} />,
                        clearAllData
                    )}
                </View>

                {/* App Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Information</Text>

                    {renderSettingItem(
                        'Version',
                        '1.0.0',
                        null
                    )}

                    {renderSettingItem(
                        'Total Timers',
                        `${timers.length} active timers`,
                        null
                    )}
                </View>
            </ScrollView>

            {/* Color Picker Modal */}
            <Modal
                visible={isColorPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setColorPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Customize Colors</Text>
                            <TouchableOpacity
                                onPress={() => setColorPickerVisible(false)}
                                style={styles.closeButton}
                            >
                                <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Color customization feature coming soon!
                        </Text>

                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setColorPickerVisible(false)}
                        >
                            <Text style={styles.closeModalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSizes.large,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.md,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        backgroundColor: colors.card,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.xs,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: fontSizes.medium,
        color: colors.text,
        fontWeight: '500',
    },
    settingSubtitle: {
        fontSize: fontSizes.small,
        color: colors.muted,
        marginTop: spacing.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: fontSizes.large,
        fontWeight: 'bold',
        color: colors.text,
    },
    closeButton: {
        padding: spacing.xs,
    },
    modalSubtitle: {
        fontSize: fontSizes.medium,
        color: colors.muted,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    closeModalButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
    },
    closeModalButtonText: {
        color: colors.light,
        fontSize: fontSizes.medium,
        fontWeight: '600',
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginHorizontal: spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedColor: {
        borderWidth: 3,
        borderColor: colors.light,
    },
});

export default SettingsScreen; 