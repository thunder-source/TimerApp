import React, { useMemo, useState, useEffect } from 'react';
import { FlatList, StyleSheet, View, Text, Modal, TouchableOpacity, Alert, AppState } from 'react-native';
import { useTimers, Timer } from '../contexts/TimerContext';
import CategoryGroup from '../components/CategoryGroup';
import { fontSizes } from '../utils/theme';
import { Header, Button, Input } from '../components/ui';
import CustomDropdown from '../components/ui/CustomDropdown';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { generateUniqueId } from '../utils/time';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { CATEGORIES_KEY } from '../constant/storageKeys';
import { useTheme } from '../contexts/ThemeContext';

function groupTimersByCategory(timers: Timer[]): Record<string, Timer[]> {
    // Filter out completed timers - they should only appear in history
    const activeTimers = timers.filter(timer => timer.status !== 'completed');

    return activeTimers.reduce((acc, timer) => {
        if (!acc[timer.category]) acc[timer.category] = [];
        acc[timer.category].push(timer);
        return acc;
    }, {} as Record<string, Timer[]>);
}

const HomeScreen = () => {
    const { timers, dispatch } = useTimers();
    const { colors } = useTheme();
    const grouped = useMemo(() => groupTimersByCategory(timers), [timers]);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
        // By default, all categories expanded
        const initial: Record<string, boolean> = {};
        Object.keys(grouped).forEach((cat) => { initial[cat] = true; });
        return initial;
    });
    const [isAddTimerModalVisible, setIsAddTimerModalVisible] = useState(false);
    const [appState, setAppState] = useState(AppState.currentState);
    const [backgroundStatus, setBackgroundStatus] = useState('Active');

    // Add timer form state
    const { getItem: getCategories, setItem: saveCategories } = useAsyncStorage<string[]>(CATEGORIES_KEY);
    const [categories, setCategories] = useState<string[]>([]);
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [category, setCategory] = useState('');

    // Load categories from storage on mount
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const savedCategories = await getCategories();
                if (savedCategories && savedCategories.length > 0) {
                    setCategories(savedCategories);
                    setCategory(savedCategories[0]);
                } else {
                    // Set default categories if none exist
                    const defaultCategories = ['Workout', 'Study', 'Break'];
                    setCategories(defaultCategories);
                    setCategory(defaultCategories[0]);
                    await saveCategories(defaultCategories);
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                // Fallback to default categories
                const defaultCategories = ['Workout', 'Study', 'Break'];
                setCategories(defaultCategories);
                setCategory(defaultCategories[0]);
            }
        };

        loadCategories();
    }, [getCategories, saveCategories]);

    // Monitor app state for background timer status
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            setAppState(nextAppState);
            if (nextAppState === 'active') {
                setBackgroundStatus('Active');
            } else if (nextAppState === 'background') {
                setBackgroundStatus('Background');
            } else if (nextAppState === 'inactive') {
                setBackgroundStatus('Inactive');
            }
        });

        return () => subscription?.remove();
    }, []);


    const handleToggle = (category: string) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const handleSave = () => {
        if (!name || !duration || isNaN(Number(duration))) {
            Alert.alert('Please enter a valid name and duration.');
            return;
        }
        dispatch({
            type: 'ADD_TIMER',
            timer: {
                id: generateUniqueId(),
                name,
                duration: Number(duration),
                remaining: Number(duration),
                category,
                status: 'idle',
            },
        });
        setName('');
        setDuration('');
        setCategory(categories[0]);
        setIsAddTimerModalVisible(false);
    };

    const handleCategoryChange = (itemValue: string) => {
        setCategory(itemValue);
    };

    const handleAddCategory = async (newCategory: string) => {
        const trimmed = newCategory.trim();
        if (!trimmed) {
            Alert.alert('Category name cannot be empty.');
            return;
        }
        if (categories.includes(trimmed)) {
            Alert.alert('Category already exists.');
            return;
        }
        const updated = [...categories, trimmed];
        setCategories(updated);
        setCategory(trimmed);

        // Save to storage
        try {
            await saveCategories(updated);
        } catch (error) {
            console.error('Error saving categories:', error);
        }
    };

    const handleDeleteCategory = async (categoryToDelete: string) => {
        // Check if there are any timers using this category
        const timersInCategory = timers.filter(timer => timer.category === categoryToDelete);

        if (timersInCategory.length > 0) {
            Alert.alert(
                'Cannot Delete Category',
                `This category has ${timersInCategory.length} active timer(s). Please delete or move the timers first.`,
                [{ text: 'OK', style: 'default' }]
            );
            return;
        }

        // Remove the category from the list
        const updated = categories.filter(cat => cat !== categoryToDelete);
        setCategories(updated);

        // If the deleted category was selected, reset to first available category
        if (category === categoryToDelete) {
            setCategory(updated.length > 0 ? updated[0] : '');
        }

        // Save to storage
        try {
            await saveCategories(updated);
        } catch (error) {
            console.error('Error saving categories:', error);
        }
    };



    // Convert grouped timers to array for FlatList
    const categoryData = useMemo(() => {
        return Object.entries(grouped).map(([category, timers]) => ({
            category,
            timers: timers as Timer[],
        }));
    }, [grouped]);

    const renderCategory = ({ item }: { item: { category: string; timers: Timer[] } }) => (
        <CategoryGroup
            category={item.category}
            timers={item.timers}
            onStartAll={() => {
                console.log('HomeScreen: Starting all timers in category', item.category);
                item.timers.forEach((t) => dispatch({ type: 'START_TIMER', id: t.id }));
            }}
            onPauseAll={() => {
                console.log('HomeScreen: Pausing all timers in category', item.category);
                item.timers.forEach((t) => dispatch({ type: 'PAUSE_TIMER', id: t.id }));
            }}
            onResetAll={() => {
                console.log('HomeScreen: Resetting all timers in category', item.category);
                item.timers.forEach((t) => dispatch({ type: 'RESET_TIMER', id: t.id }));
            }}
            onStart={(id) => {
                console.log('HomeScreen: Starting timer', id);
                dispatch({ type: 'START_TIMER', id });
            }}
            onPause={(id) => {
                console.log('HomeScreen: Pausing timer', id);
                dispatch({ type: 'PAUSE_TIMER', id });
            }}
            onReset={(id) => {
                console.log('HomeScreen: Resetting timer', id);
                dispatch({ type: 'RESET_TIMER', id });
            }}
            expanded={expandedCategories[item.category]}
            onToggle={() => handleToggle(item.category)}
        />
    );

    const styles = createStyles(colors);

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No active timers</Text>
            <Text style={styles.emptySubtitle}>
                {timers.length === 0
                    ? 'Create your first timer to get started!'
                    : 'All timers are completed. Check the History tab to see completed timers.'
                }
            </Text>
        </View>
    );

    const AddButton = () => (
        <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddTimerModalVisible(true)}
        >
            <Text style={styles.buttonText}>Add Timer</Text>
            <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
    );


    return (
        <View style={styles.screenContainer}>
            <Header
                title="Timer"
                rightComponent={<AddButton />}
            />

            {/* Background Status Indicator */}
            {appState !== 'active' && (
                <View style={styles.backgroundIndicator}>
                    <MaterialCommunityIcons name="timer-sand" size={16} color={colors.primary} />
                    <Text style={styles.backgroundText}>
                        Timers running in background ({backgroundStatus})
                    </Text>
                </View>
            )}

            <FlatList
                data={categoryData}
                renderItem={renderCategory}
                keyExtractor={(item) => item.category}
                contentContainerStyle={styles.container}
                ListEmptyComponent={renderEmptyState}
            />

            <Modal
                visible={isAddTimerModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsAddTimerModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Timer</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setIsAddTimerModalVisible(false)}
                            >
                                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            <Input
                                placeholder="Name"
                                value={name}
                                onChangeText={setName}
                            />
                            <Input
                                placeholder="Duration (seconds)"
                                value={duration}
                                onChangeText={setDuration}
                                keyboardType="numeric"
                            />
                            <CustomDropdown
                                options={categories}
                                value={category}
                                onSelect={handleCategoryChange}
                                onAddOption={handleAddCategory}
                                onDeleteOption={handleDeleteCategory}
                                placeholder="Select category..."
                                title="Select Category"
                            />
                            <Button
                                style={{ flex: undefined }}
                                title="Save Timer"
                                disabled={
                                    !name.trim() ||
                                    !duration.trim() ||
                                    isNaN(Number(duration)) ||
                                    Number(duration) <= 0 ||
                                    !category
                                }
                                onPress={handleSave}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        padding: 16,
        backgroundColor: colors.background,
        minHeight: '100%',
    },
    addButton: {
        padding: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: colors.primary + '11',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        width: 115
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: colors.muted,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: colors.border,
    },
    form: {
        gap: 16,
    },
    addCategoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        fontSize: fontSizes.medium,
        color: colors.primary,
        textAlign: 'center',
        marginTop: 2,
    },
    settingsButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: colors.primary + '11',
    },
    backgroundIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary + '15',
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 8,
    },
    backgroundText: {
        fontSize: fontSizes.small,
        color: colors.primary,
        fontWeight: '500',
    },
    testButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: colors.primary + '11',
        marginLeft: 8,
    }
});

export default HomeScreen; 