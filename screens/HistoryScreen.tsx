import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useHistory } from '../hooks/useHistory';
import { colors, spacing, fontSizes, borderRadius } from '../utils/theme';
import Button from '../components/ui/Button';
import { Header } from '../components/ui';

const HistoryScreen = () => {
    const { history, clearHistory, cleanupOldHistory, loadHistory } = useHistory();

    // Auto-cleanup old history entries (older than 30 days) when component mounts
    React.useEffect(() => {
        cleanupOldHistory(30);
    }, []);

    // Reload history data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadHistory();
        }, [])
    );

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <View style={styles.screenContainer}>
            <Header
                title="Timer History"
                subtitle="View your completed timers"
                rightComponent={
                    history.length > 0 ? (
                        <Button
                            title="Clear"
                            onPress={clearHistory}
                            style={styles.clearButton}
                        />
                    ) : undefined
                }
            />
            <FlatList
                data={history}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.historyItem}>
                        <View style={styles.itemContent}>
                            <Text style={styles.timerName}>{item.name}</Text>
                            <Text style={styles.completionTime}>
                                Completed: {formatDate(item.completedAt)}
                            </Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No completed timers yet</Text>
                        <Text style={styles.emptySubtext}>
                            Complete some timers to see them here
                        </Text>
                    </View>
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: fontSizes.xlarge,
        fontWeight: '700',
        color: colors.text,
    },
    clearButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    listContent: {
        flexGrow: 1,
        padding: spacing.lg,
    },
    historyItem: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
        borderColor: colors.border,
        borderWidth: 1
    },
    itemContent: {
        padding: spacing.lg,
    },
    timerName: {
        fontSize: fontSizes.large,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    completionTime: {
        fontSize: fontSizes.small,
        color: colors.muted,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xl * 2,
    },
    emptyText: {
        fontSize: fontSizes.large,
        fontWeight: '600',
        color: colors.muted,
        marginBottom: spacing.sm,
    },
    emptySubtext: {
        fontSize: fontSizes.medium,
        color: colors.muted,
        textAlign: 'center',
    },
});

export default HistoryScreen; 