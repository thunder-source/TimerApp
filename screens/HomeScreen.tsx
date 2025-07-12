import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import { useTimers, Timer } from '../contexts/TimerContext';
import CategoryGroup from '../components/CategoryGroup';
import { colors } from '../utils/theme';

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

    const handleToggle = (category: string) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
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

    return (
        <FlatList
            data={categoryData}
            renderItem={renderCategory}
            keyExtractor={(item) => item.category}
            contentContainerStyle={styles.container}
            ListEmptyComponent={renderEmptyState}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: colors.light,
        minHeight: '100%',
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
});

export default HomeScreen; 