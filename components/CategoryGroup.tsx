import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import Button from './ui/Button';
import { Timer } from '../contexts/TimerContext';
import TimerCard from './TimerCard';
import { colors, spacing, fontSizes, borderRadius } from '../utils/theme';

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
                        <Text style={styles.toggle}>▼</Text>
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
                                style={styles.bulkButton}
                            />
                            <Button
                                title="Pause All"
                                onPress={onPauseAll}
                                style={styles.bulkButton}
                            />
                            <Button
                                title="Reset All"
                                onPress={onResetAll}
                                style={styles.bulkButton}
                            />
                        </View>
                    </View>
                    <FlatList
                        data={timers}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TimerCard
                                timer={item}
                                onStart={() => onStart(item.id)}
                                onPause={() => onPause(item.id)}
                                onReset={() => onReset(item.id)}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.flatListContent}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    groupContainer: {
        marginVertical: spacing.md,
        width: '100%',
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        shadowColor: '#000',
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
        backgroundColor: colors.background,
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
        color: '#FFFFFF',
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
        backgroundColor: '#4CAF50' + '20',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.accent,
        marginRight: spacing.xs,
    },
    completedDot: {
        backgroundColor: '#4CAF50',
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
    toggle: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: 'bold',
    },
    expandedContent: {
        backgroundColor: colors.card,
    },
    bulkActions: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    bulkActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    bulkButton: {
        flex: 1,
        paddingVertical: spacing.sm,
    },
    flatListContent: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
});

export default CategoryGroup; 