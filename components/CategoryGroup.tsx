import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import Button from './ui/Button';
import { Timer } from '../contexts/TimerContext';
import TimerCard from './TimerCard';
import { spacing, fontSizes, borderRadius } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface CategoryGroupProps {
    category: string;
    timers: Timer[];
    onStartAll: () => void;
    onPauseAll: () => void;
    onResetAll: () => void;
    onStart: (id: string) => void;
    onPause: (id: string) => void;
    onReset: (id: string) => void;
    expanded: boolean;
    onToggle: () => void;
}

const CategoryGroup: React.FC<CategoryGroupProps> = ({
    category,
    timers,
    onStartAll,
    onPauseAll,
    onResetAll,
    onStart,
    onPause,
    onReset,
    expanded,
    onToggle,
}) => {
    const { colors } = useTheme();
    const styles = createStyles(colors, spacing, fontSizes, borderRadius);
    const [rotateAnim] = useState(new Animated.Value(0));

    React.useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: expanded ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [expanded]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const runningTimers = timers.filter(timer => timer.status === 'running').length;
    const completedTimers = timers.filter(timer => timer.status === 'completed').length;

    return (
        <View style={styles.groupContainer}>
            <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
                <View style={[styles.header, { borderBottomWidth: expanded ? 1 : 0 }]}>
                    <View style={styles.categoryInfo}>
                        <View style={styles.categoryRow}>
                            <Text style={styles.category}>{category}</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{timers.length}</Text>
                            </View>
                        </View>
                        {expanded ? (
                            <View style={styles.statusRow}>
                                {runningTimers > 0 && (
                                    <View style={styles.statusBadge}>
                                        <View style={styles.statusDot} />
                                        <Text style={styles.statusText}>{runningTimers} running</Text>
                                    </View>
                                )}
                                {completedTimers > 0 && (
                                    <View style={[styles.statusBadge, styles.completedBadge]}>
                                        <View style={[styles.statusDot, styles.completedDot]} />
                                        <Text style={styles.statusText}>{completedTimers} completed</Text>
                                    </View>
                                )}
                            </View>
                        ) : null}
                    </View>
                    <Animated.View style={[styles.toggleContainer, { transform: [{ rotate }] }]}>
                        <MaterialCommunityIcons name="chevron-down" size={24} color={colors.primary} />
                    </Animated.View>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.expandedContent}>
                    <View style={styles.bulkActions}>
                        <View style={styles.bulkActionRow}>
                            <Button
                                title="Start All"
                                onPress={onStartAll}
                                style={{ paddingHorizontal: spacing.sm }}
                            />
                            <Button
                                title="Pause All"
                                onPress={onPauseAll}
                                style={{ paddingHorizontal: spacing.sm }}
                            />
                            <Button
                                title="Reset All"
                                onPress={onResetAll}
                                style={{ paddingHorizontal: spacing.sm }}
                            />
                        </View>
                    </View>
                    <FlatList
                        data={timers}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TimerCard
                                timer={item}
                                onStart={() => {
                                    console.log(`CategoryGroup: Starting timer ${item.id}`);
                                    onStart(item.id);
                                }}
                                onPause={() => {
                                    console.log(`CategoryGroup: Pausing timer ${item.id}`);
                                    onPause(item.id);
                                }}
                                onReset={() => {
                                    console.log(`CategoryGroup: Resetting timer ${item.id}`);
                                    onReset(item.id);
                                }}
                            />
                        )}
                        style={{ paddingTop: spacing.md }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.flatListContent}
                    />
                </View>
            )}
        </View>
    );
};

const createStyles = (colors: any, spacing: any, fontSizes: any, borderRadius: any) => StyleSheet.create({
    groupContainer: {
        marginVertical: spacing.md,
        width: '100%',
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        shadowColor: colors.shadow || '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    category: {
        fontSize: fontSizes.large,
        fontWeight: '700',
        color: colors.text,
        marginRight: spacing.sm,
    },
    badge: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        minWidth: 24,
        alignItems: 'center',
    },
    badgeText: {
        color: colors.card,
        fontSize: fontSizes.small,
        fontWeight: '600',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    completedBadge: {
        backgroundColor: (colors.success || '#4CAF50') + '20',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.accent,
        marginRight: spacing.xs,
    },
    completedDot: {
        backgroundColor: colors.success || '#4CAF50',
    },
    statusText: {
        fontSize: fontSizes.small,
        color: colors.muted,
        fontWeight: '500',
    },
    toggleContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    expandedContent: {
        backgroundColor: colors.card,
    },
    bulkActions: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    bulkActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    flatListContent: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
});

export default CategoryGroup; 