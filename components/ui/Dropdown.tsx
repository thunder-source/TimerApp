import React, {
    useState,
    useRef,
    useCallback,
    useMemo,
    useImperativeHandle,
    forwardRef
} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    StyleProp,
    ViewStyle,
    TextInput,
    Keyboard,
    Animated,
    Platform,
    Dimensions,
    LayoutChangeEvent,
    NativeSyntheticEvent,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, fontSizes, borderRadius } from '../../utils/theme';

// Types
interface DropdownOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface DropdownProps {
    options: string[] | DropdownOption[];
    value?: string;
    onSelect: (value: string, option: DropdownOption) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;

    // Search & Create features
    searchable?: boolean;
    creatable?: boolean;
    onCreateOption?: (inputValue: string) => Promise<DropdownOption | null> | DropdownOption | null;

    // Validation
    validateInput?: (value: string) => string | null;
    minLength?: number;
    maxLength?: number;

    // UI Customization
    maxHeight?: number;
    showCheckmark?: boolean;
    animationDuration?: number;

    // Callbacks
    onOpen?: () => void;
    onClose?: () => void;
    onSearchChange?: (searchText: string) => void;
}

interface DropdownRef {
    open: () => void;
    close: () => void;
    clear: () => void;
    focus: () => void;
}

interface DropdownState {
    isOpen: boolean;
    searchText: string;
    isCreating: boolean;
    error: string | null;
    layout: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
}

// Custom hooks
const useDropdownState = (initialValue?: string): [DropdownState, {
    setIsOpen: (isOpen: boolean) => void;
    setSearchText: (text: string) => void;
    setIsCreating: (creating: boolean) => void;
    setError: (error: string | null) => void;
    setLayout: (layout: DropdownState['layout']) => void;
    resetState: () => void;
}] => {
    const [state, setState] = useState<DropdownState>({
        isOpen: false,
        searchText: '',
        isCreating: false,
        error: null,
        layout: null,
    });

    const setIsOpen = useCallback((isOpen: boolean) => {
        setState(prev => ({ ...prev, isOpen }));
    }, []);

    const setSearchText = useCallback((searchText: string) => {
        setState(prev => ({ ...prev, searchText }));
    }, []);

    const setIsCreating = useCallback((isCreating: boolean) => {
        setState(prev => ({ ...prev, isCreating }));
    }, []);

    const setError = useCallback((error: string | null) => {
        setState(prev => ({ ...prev, error }));
    }, []);

    const setLayout = useCallback((layout: DropdownState['layout']) => {
        setState(prev => ({ ...prev, layout }));
    }, []);

    const resetState = useCallback(() => {
        setState({
            isOpen: false,
            searchText: '',
            isCreating: false,
            error: null,
            layout: null,
        });
    }, []);

    return [state, { setIsOpen, setSearchText, setIsCreating, setError, setLayout, resetState }];
};

const useAnimations = (duration: number = 200) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    const animateIn = useCallback(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, scaleAnim, duration]);

    const animateOut = useCallback((onComplete?: () => void) => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: duration * 0.8,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: duration * 0.8,
                useNativeDriver: true,
            }),
        ]).start(onComplete);
    }, [fadeAnim, scaleAnim, duration]);

    const reset = useCallback(() => {
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.9);
    }, [fadeAnim, scaleAnim]);

    return { fadeAnim, scaleAnim, animateIn, animateOut, reset };
};

// Utils
const normalizeOptions = (options: string[] | DropdownOption[]): DropdownOption[] => {
    return options.map(option =>
        typeof option === 'string'
            ? { label: option, value: option }
            : option
    );
};

const fuzzySearch = (options: DropdownOption[], query: string): DropdownOption[] => {
    if (!query.trim()) return options;

    const searchTerm = query.toLowerCase().trim();
    const searchWords = searchTerm.split(/\s+/);

    const scored = options
        .map(option => {
            const label = option.label.toLowerCase();
            let score = 0;

            // Exact match
            if (label === searchTerm) score += 100;

            // Starts with
            else if (label.startsWith(searchTerm)) score += 80;

            // Contains all words
            else if (searchWords.every(word => label.includes(word))) score += 60;

            // Contains search term
            else if (label.includes(searchTerm)) score += 40;

            // Fuzzy match
            else {
                const matches = searchTerm.split('').filter(char => label.includes(char)).length;
                score += (matches / searchTerm.length) * 20;
            }

            return { option, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score);

    return scored.map(({ option }) => option);
};

const getDropdownPosition = (
    layout: DropdownState['layout'],
    maxHeight: number,
    screenHeight: number
): { top?: number; bottom?: number; maxHeight: number } => {
    if (!layout) return { maxHeight };

    const { y, height } = layout;
    const spaceBelow = screenHeight - y - height - 20;
    const spaceAbove = y - 40;

    if (spaceBelow >= maxHeight) {
        return { top: y + height + 4, maxHeight };
    } else if (spaceAbove >= maxHeight) {
        return { bottom: screenHeight - y + 4, maxHeight };
    } else {
        // Use the side with more space
        if (spaceBelow > spaceAbove) {
            return { top: y + height + 4, maxHeight: spaceBelow };
        } else {
            return { bottom: screenHeight - y + 4, maxHeight: spaceAbove };
        }
    }
};

// Main Component
const Dropdown = forwardRef<DropdownRef, DropdownProps>(({
    options,
    value,
    onSelect,
    placeholder = 'Select an option...',
    searchPlaceholder = 'Search...',
    disabled = false,
    style,
    searchable = true,
    creatable = false,
    onCreateOption,
    validateInput,
    minLength = 1,
    maxLength = 100,
    maxHeight = 300,
    showCheckmark = true,
    animationDuration = 200,
    onOpen,
    onClose,
    onSearchChange,
}, ref) => {
    // Refs
    const triggerRef = useRef<any>(null);
    const searchInputRef = useRef<TextInput>(null);

    // State
    const [state, actions] = useDropdownState(value);
    const { fadeAnim, scaleAnim, animateIn, animateOut, reset } = useAnimations(animationDuration);

    // Normalized options
    const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);

    // Selected option
    const selectedOption = useMemo(() =>
        normalizedOptions.find(opt => opt.value === value) || null,
        [normalizedOptions, value]
    );

    // Filtered options
    const filteredOptions = useMemo(() => {
        const filtered = state.searchText
            ? fuzzySearch(normalizedOptions, state.searchText)
            : normalizedOptions;

        return filtered.filter(opt => !opt.disabled);
    }, [normalizedOptions, state.searchText]);

    // Create option validation
    const createValidation = useMemo(() => {
        if (!creatable || !state.searchText.trim()) return null;

        const input = state.searchText.trim();

        if (input.length < minLength) {
            return `Minimum ${minLength} characters required`;
        }

        if (input.length > maxLength) {
            return `Maximum ${maxLength} characters allowed`;
        }

        if (normalizedOptions.some(opt => opt.label.toLowerCase() === input.toLowerCase())) {
            return 'This option already exists';
        }

        return validateInput ? validateInput(input) : null;
    }, [creatable, state.searchText, minLength, maxLength, normalizedOptions, validateInput]);

    // Screen dimensions
    const screenHeight = Dimensions.get('window').height;

    // Dropdown position
    const dropdownPosition = useMemo(() => {
        return getDropdownPosition(state.layout, maxHeight, screenHeight);
    }, [state.layout, maxHeight, screenHeight]);

    // Callbacks
    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        triggerRef.current?.measureInWindow((windowX: number, windowY: number) => {
            actions.setLayout({ x: windowX, y: windowY, width, height });
        });
    }, [actions]);

    const handleOpen = useCallback(() => {
        if (disabled) return;

        triggerRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
            actions.setLayout({ x, y, width, height });
            actions.setIsOpen(true);
            reset();
            animateIn();
            onOpen?.();

            if (searchable) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
            }
        });
    }, [disabled, actions, reset, animateIn, onOpen, searchable]);

    const handleClose = useCallback(() => {
        animateOut(() => {
            actions.resetState();
            onClose?.();
        });
        Keyboard.dismiss();
    }, [animateOut, actions, onClose]);

    const handleSelect = useCallback((option: DropdownOption) => {
        onSelect(option.value, option);
        handleClose();
    }, [onSelect, handleClose]);

    const handleSearchChange = useCallback((text: string) => {
        actions.setSearchText(text);
        actions.setError(null);
        onSearchChange?.(text);
    }, [actions, onSearchChange]);

    const handleCreateOption = useCallback(async () => {
        if (!creatable || createValidation || state.isCreating) return;

        const input = state.searchText.trim();
        actions.setIsCreating(true);
        actions.setError(null);

        try {
            let newOption: DropdownOption | null = null;

            if (onCreateOption) {
                newOption = await onCreateOption(input);
            } else {
                newOption = { label: input, value: input };
            }

            if (newOption) {
                handleSelect(newOption);
            }
        } catch (error) {
            actions.setError('Failed to create option');
        } finally {
            actions.setIsCreating(false);
        }
    }, [creatable, createValidation, state.isCreating, state.searchText, actions, onCreateOption, handleSelect]);

    const handleSearchSubmit = useCallback((e: NativeSyntheticEvent<TextInputChangeEventData>) => {
        if (createValidation === null && creatable) {
            handleCreateOption();
        } else if (filteredOptions.length > 0) {
            handleSelect(filteredOptions[0]);
        }
    }, [createValidation, creatable, filteredOptions, handleCreateOption, handleSelect]);

    // Imperative handle
    useImperativeHandle(ref, () => ({
        open: handleOpen,
        close: handleClose,
        clear: () => onSelect('', { label: '', value: '' }),
        focus: () => searchInputRef.current?.focus(),
    }), [handleOpen, handleClose, onSelect]);

    // Render functions
    const renderTrigger = useCallback(() => {
        if (state.isOpen && searchable) {
            return (
                <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder={searchPlaceholder}
                        placeholderTextColor={colors.muted}
                        value={state.searchText}
                        onChangeText={handleSearchChange}
                        onSubmitEditing={handleSearchSubmit}
                        returnKeyType={creatable ? 'done' : 'search'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {state.searchText.length > 0 && (
                        <TouchableOpacity
                            onPress={() => actions.setSearchText('')}
                            style={styles.clearButton}
                        >
                            <MaterialCommunityIcons name="close-circle" size={16} color={colors.muted} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <MaterialCommunityIcons name="close" size={20} color={colors.muted} />
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <TouchableOpacity
                ref={triggerRef}
                style={[styles.trigger, disabled && styles.disabledTrigger]}
                onPress={handleOpen}
                onLayout={handleLayout}
                disabled={disabled}
                activeOpacity={0.7}
            >
                <Text style={[styles.triggerText, !selectedOption && styles.placeholderText]} numberOfLines={1}>
                    {selectedOption?.label || placeholder}
                </Text>
                <MaterialCommunityIcons
                    name={state.isOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.muted}
                />
            </TouchableOpacity>
        );
    }, [
        state.isOpen,
        state.searchText,
        searchable,
        selectedOption,
        placeholder,
        disabled,
        handleOpen,
        handleClose,
        handleLayout,
        handleSearchChange,
        handleSearchSubmit,
        creatable,
        actions
    ]);

    const renderOption = useCallback(({ item }: { item: DropdownOption }) => {
        const isSelected = item.value === value;

        return (
            <TouchableOpacity
                style={[styles.option, isSelected && styles.selectedOption]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
            >
                <Text style={[styles.optionText, isSelected && styles.selectedOptionText]} numberOfLines={2}>
                    {item.label}
                </Text>
                {showCheckmark && isSelected && (
                    <MaterialCommunityIcons name="check" size={16} color={colors.primary} />
                )}
            </TouchableOpacity>
        );
    }, [value, showCheckmark, handleSelect]);

    const renderCreateOption = useCallback(() => {
        if (!creatable || !state.searchText.trim()) return null;

        return (
            <View style={styles.createContainer}>
                <TouchableOpacity
                    style={[
                        styles.createOption,
                        createValidation && styles.createOptionError,
                        state.isCreating && styles.createOptionLoading
                    ]}
                    onPress={handleCreateOption}
                    disabled={!!createValidation || state.isCreating}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons
                        name={state.isCreating ? "loading" : "plus"}
                        size={16}
                        color={createValidation ? colors.danger : colors.primary}
                    />
                    <Text style={[styles.createText, createValidation && styles.createTextError]}>
                        {state.isCreating ? 'Creating...' : `Create "${state.searchText.trim()}"`}
                    </Text>
                </TouchableOpacity>
                {createValidation && (
                    <Text style={styles.errorText}>{createValidation}</Text>
                )}
            </View>
        );
    }, [creatable, state.searchText, state.isCreating, createValidation, handleCreateOption]);

    const renderEmptyState = useCallback(() => {
        if (filteredOptions.length > 0) return null;

        return (
            <View style={styles.emptyState}>
                <MaterialCommunityIcons name="magnify" size={32} color={colors.muted} />
                <Text style={styles.emptyStateText}>
                    {state.searchText ? `No results for "${state.searchText}"` : 'No options available'}
                </Text>
            </View>
        );
    }, [filteredOptions.length, state.searchText]);

    return (
        <View style={[styles.container, style]}>
            {renderTrigger()}

            <Modal
                visible={state.isOpen}
                transparent
                animationType="none"
                onRequestClose={handleClose}
                statusBarTranslucent={Platform.OS === 'android'}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={handleClose}
                    />

                    <Animated.View
                        style={[
                            styles.dropdown,
                            {
                                left: state.layout?.x || 0,
                                width: state.layout?.width || 200,
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                                ...dropdownPosition,
                            }
                        ]}
                    >
                        <FlatList
                            data={filteredOptions}
                            keyExtractor={(item, index) => `${item.value}-${index}`}
                            renderItem={renderOption}
                            ListFooterComponent={renderCreateOption}
                            ListEmptyComponent={renderEmptyState}
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                            bounces={false}
                            style={styles.optionsList}
                            contentContainerStyle={styles.optionsContent}
                        />
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
});

// Styles
const styles = StyleSheet.create({
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
    disabledTrigger: {
        opacity: 0.5,
        backgroundColor: colors.background,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 2,
        borderColor: colors.primary,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.card,
        minHeight: 44,
    },
    searchInput: {
        flex: 1,
        fontSize: fontSizes.medium,
        color: colors.text,
        marginLeft: spacing.sm,
        paddingVertical: 0,
    },
    clearButton: {
        padding: spacing.xs,
        marginLeft: spacing.sm,
    },
    closeButton: {
        padding: spacing.xs,
        marginLeft: spacing.sm,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    modalBackdrop: {
        flex: 1,
    },
    dropdown: {
        position: 'absolute',
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    optionsList: {
        maxHeight: 300,
    },
    optionsContent: {
        paddingVertical: spacing.xs,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: 44,
    },
    selectedOption: {
        backgroundColor: colors.primary + '15',
    },
    optionText: {
        flex: 1,
        fontSize: fontSizes.medium,
        color: colors.text,
        marginRight: spacing.sm,
    },
    selectedOptionText: {
        color: colors.primary,
        fontWeight: '600',
    },
    createContainer: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    createOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.background,
        minHeight: 44,
    },
    createOptionError: {
        backgroundColor: colors.danger + '10',
    },
    createOptionLoading: {
        opacity: 0.7,
    },
    createText: {
        flex: 1,
        fontSize: fontSizes.medium,
        color: colors.primary,
        fontWeight: '600',
        marginLeft: spacing.sm,
    },
    createTextError: {
        color: colors.danger,
    },
    errorText: {
        fontSize: fontSizes.small,
        color: colors.danger,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.md,
    },
    emptyStateText: {
        fontSize: fontSizes.medium,
        color: colors.muted,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
});

Dropdown.displayName = 'Dropdown';

export default Dropdown;
export type { DropdownProps, DropdownOption, DropdownRef };