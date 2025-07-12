import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import { useTimers, Timer } from '../contexts/TimerContext';
import CategoryGroup from '../components/CategoryGroup';
import { colors, fontSizes } from '../utils/theme';
import { Header, Button, Input } from '../components/ui';
import Dropdown from '../components/ui/Dropdown';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

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
    const grouped = useMemo(() => groupTimersByCategory(timers), [timers]);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
        // By default, all categories expanded
        const initial: Record<string, boolean> = {};
        Object.keys(grouped).forEach((cat) => { initial[cat] = true; });
        return initial;
    });
    const [isAddTimerModalVisible, setIsAddTimerModalVisible] = useState(false);

    // Add timer form state
    const [categories, setCategories] = useState(['Workout', 'Study', 'Break']);
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [category, setCategory] = useState('Workout');
    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');

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
                id: Date.now().toString(),
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
        Alert.alert('Timer added!');
    };

    const handleCategoryChange = (itemValue: string, option: any) => {
        if (itemValue === '__add_new__') {
            setAddingCategory(true);
            setNewCategory('');
        } else {
            setCategory(itemValue);
        }
    };

    const handleAddCategory = () => {
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
        setAddingCategory(false);
        setNewCategory('');
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
            onStartAll={() => item.timers.forEach((t) => dispatch({ type: 'START_TIMER', id: t.id }))}
            onPauseAll={() => item.timers.forEach((t) => dispatch({ type: 'PAUSE_TIMER', id: t.id }))}
            onResetAll={() => item.timers.forEach((t) => dispatch({ type: 'RESET_TIMER', id: t.id }))}
            onStart={(id) => dispatch({ type: 'START_TIMER', id })}
            onPause={(id) => dispatch({ type: 'PAUSE_TIMER', id })}
            onReset={(id) => dispatch({ type: 'RESET_TIMER', id })}
            expanded={expandedCategories[item.category]}
            onToggle={() => handleToggle(item.category)}
        />
    );

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
            <Ionicons name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.screenContainer}>
            <Header
                title="Timer App"
                subtitle="Manage your timers"
                rightComponent={<AddButton />}
            />
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
                                <Ionicons name="close" size={24} color={colors.text} />
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
                            <Dropdown
                                options={[
                                    ...categories.map(cat => ({ label: cat, value: cat })),
                                    { label: '+ Add New Category', value: '__add_new__' }
                                ]}
                                value={category}
                                onSelect={handleCategoryChange}
                            />
                            {addingCategory && (
                                <View style={styles.addCategoryRow}>
                                    <Input
                                        placeholder="New category"
                                        value={newCategory}
                                        onChangeText={setNewCategory}
                                        style={[{ flex: 1, marginRight: 8 }]}
                                    />
                                    <Button
                                        title="Add"
                                        disabled={
                                            !newCategory.trim() || categories.includes(newCategory.trim())
                                        }
                                        onPress={handleAddCategory}
                                    />
                                </View>
                            )}
                            <Button
                                title="Save Timer"
                                disabled={
                                    !name.trim() ||
                                    !duration.trim() ||
                                    isNaN(Number(duration)) ||
                                    Number(duration) <= 0 ||
                                    !category ||
                                    addingCategory
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

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: colors.light,
    },
    container: {
        padding: 16,
        backgroundColor: colors.light,
        minHeight: '100%',
    },
    addButton: {
        padding: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: colors.primary + '11',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2
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
        color: '#374151',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    // Modal styles
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
    }
});

export default HomeScreen; 