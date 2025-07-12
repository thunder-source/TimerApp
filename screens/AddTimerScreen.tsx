import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Dropdown from '../components/ui/Dropdown';
import { useTimers } from '../contexts/TimerContext';

const DEFAULT_CATEGORIES = ['Workout', 'Study', 'Break'];

const AddTimerScreen = () => {
    const { dispatch } = useTimers();
    const navigation = useNavigation();
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');

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
        Alert.alert('Timer added!', '', [
            {
                text: 'OK',
                onPress: () => navigation.navigate('Home' as never),
            },
        ]);
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

    return (
        <View style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.title}>Add Timer</Text>
                <Text style={styles.subtitle}>Create a new timer for your tasks</Text>
                <View style={styles.divider} />
                <View style={{ gap: 8 }}>
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
                </View>
                <View style={styles.divider} />
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
    );
};

const PRIMARY = '#2563eb';
const LIGHT_GRAY = '#f3f4f6';
const CARD_SHADOW = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: LIGHT_GRAY,
        padding: 24,
    },
    form: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        ...CARD_SHADOW,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: PRIMARY,
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 16,
        borderRadius: 1,
    },
    addCategoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    addButton: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: PRIMARY,
    },
    saveButton: {
        marginTop: 8,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: PRIMARY,
    },
});

export default AddTimerScreen; 