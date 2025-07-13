import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, StyleSheet, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSizes, borderRadius } from '../../utils/theme';

interface SimpleCreatableDropdownProps {
    options: string[];
    value?: string;
    onSelect: (value: string) => void;
    onAddOption?: (newOption: string) => void;
    onDeleteOption?: (optionToDelete: string) => void;
    placeholder?: string;
    title?: string;
    style?: any;
}

const CustomDropdown: React.FC<SimpleCreatableDropdownProps> = ({
    options,
    value,
    onSelect,
    onAddOption,
    onDeleteOption,
    placeholder = 'Select an option...',
    title = 'Select Option',
    style
}) => {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleSelect = (option: string) => {
        onSelect(option);
        setIsOpen(false);
        setSearchText('');
    };

    const handleCreate = async () => {
        if (!searchText.trim() || !onAddOption) return;

        const newOption = searchText.trim();

        // Check if option already exists
        if (options.includes(newOption)) {
            Alert.alert('Error', 'This option already exists!');
            return;
        }

        setIsCreating(true);

        try {
            await onAddOption(newOption);
            onSelect(newOption);
            setIsOpen(false);
            setSearchText('');
            Alert.alert('Success', `Added "${newOption}" to the list!`);
        } catch (error) {
            Alert.alert('Error', 'Failed to add new option');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = (optionToDelete: string) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete "${optionToDelete}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        onDeleteOption?.(optionToDelete);
                    },
                },
            ],
        );
    };

    const renderOption = ({ item }: { item: string }) => (
        <View style={[styles.option, item === value && styles.selectedOption]}>
            <TouchableOpacity
                style={styles.optionContent}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
            >
                <Text style={[styles.optionText, item === value && styles.selectedOptionText]}>
                    {item}
                </Text>
                {item === value && (
                    <MaterialCommunityIcons name="check" size={16} color={colors.primary} />
                )}
            </TouchableOpacity>
            {onDeleteOption && (
                <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="delete-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
            )}
        </View>
    );

    const renderCreateOption = () => {
        if (!searchText.trim() || !onAddOption || options.includes(searchText.trim())) {
            return null;
        }

        return (
            <TouchableOpacity
                style={[styles.createOption, isCreating && styles.creatingOption]}
                onPress={handleCreate}
                disabled={isCreating}
            >
                <MaterialCommunityIcons
                    name={isCreating ? "loading" : "plus"}
                    size={16}
                    color={colors.primary}
                />
                <Text style={styles.createText}>
                    {isCreating ? 'Adding...' : `Add "${searchText.trim()}"`}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                style={styles.trigger}
                onPress={() => setIsOpen(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.triggerText, !value && styles.placeholderText]}>
                    {value || placeholder}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.muted} />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                            <TouchableOpacity
                                onPress={() => setIsOpen(false)}
                                style={styles.closeButton}
                            >
                                <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
                            </TouchableOpacity>
                        </View>

                        {onAddOption && (
                            <View style={styles.searchContainer}>
                                <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search or type to create..."
                                    placeholderTextColor={colors.muted}
                                    value={searchText}
                                    onChangeText={setSearchText}
                                    autoFocus
                                />
                            </View>
                        )}

                        <FlatList
                            data={filteredOptions}
                            keyExtractor={(item) => item}
                            renderItem={renderOption}
                            ListFooterComponent={renderCreateOption}
                            showsVerticalScrollIndicator={false}
                            style={styles.optionsList}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        minHeight: 44,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.card,
        minHeight: 44,
    },
    triggerText: {
        flex: 1,
        fontSize: fontSizes.medium,
        color: colors.text,
        marginRight: spacing.sm,
    },
    placeholderText: {
        color: colors.muted,
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
        width: '100%',
        maxHeight: '80%',
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: fontSizes.large,
        fontWeight: 'bold',
        color: colors.text,
    },
    closeButton: {
        padding: spacing.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.background,
        marginBottom: spacing.md,
    },
    searchInput: {
        flex: 1,
        fontSize: fontSizes.medium,
        color: colors.text,
        marginLeft: spacing.sm,
        paddingVertical: 0,
    },
    optionsList: {
        maxHeight: 300,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.xs,
    },
    optionContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectedOption: {
        backgroundColor: colors.primary + '15',
    },
    optionText: {
        fontSize: fontSizes.medium,
        color: colors.text,
        flex: 1,
        marginRight: spacing.sm,
    },
    selectedOptionText: {
        color: colors.primary,
        fontWeight: '600',
    },
    createOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.background,
        borderRadius: borderRadius.sm,
        marginTop: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    creatingOption: {
        opacity: 0.7,
    },
    createText: {
        flex: 1,
        fontSize: fontSizes.medium,
        color: colors.primary,
        fontWeight: '600',
        marginLeft: spacing.sm,
    },
    deleteButton: {
        padding: spacing.xs,
    },
});

export default CustomDropdown; 