import React from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useHistory } from '../hooks/useHistory';
import { spacing, fontSizes, borderRadius } from '../utils/theme';
import Button from '../components/ui/Button';
import { Header, Loading } from '../components/ui';
import { useTheme } from '../contexts/ThemeContext';

const HistoryScreen = () => {
    const { history, isLoading, clearHistory, cleanupOldHistory, loadHistory } = useHistory();
    const { colors } = useTheme();

    // Auto-cleanup old history entries (older than 30 days) when component mounts
    React.useEffect(() => {
        cleanupOldHistory(30);
    }, []);

    // Reload history data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            console.log('HistoryScreen focused, loading history...');
            loadHistory();
        }, [])
    );

    const handleClearHistory = () => {
        console.log('Clear history button pressed');
        Alert.alert(
            'Clear History',
            'Are you sure you want to clear all timer history? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => console.log('Clear history cancelled'),
                },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        console.log('Clear history confirmed, executing...');
                        try {
                            await clearHistory();
                            console.log('History cleared successfully');
                        } catch (error) {
                            console.error('Error clearing history:', error);
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${remainingSeconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            return `${remainingSeconds}s`;
        }
    };

    const styles = createStyles(colors);

    return (
        <View style={styles.screenContainer}>
            <Header
                title="Timer History"
                subtitle="View your completed timers"
                rightComponent={
                    history.length > 0 && (
                        <Button
                            title="Clear"
                            onPress={handleClearHistory}
                            style={styles.clearButton}
                        />
                    )
                }
            />
            {isLoading ? (
                <Loading text="Loading history..." />
            ) : (

                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.historyItem}>
                            <View style={styles.itemContent}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.timerName}>{item.name}</Text>
                                    <Text style={styles.category}>{item.category}</Text>
                                </View>
                                <View style={styles.itemDetails}>
                                    {item.duration > 0 && (
                                        <Text style={styles.duration}>
                                            Duration: {formatDuration(item.duration)}
                                        </Text>
                                    )}
                                    <Text style={styles.completionTime}>
                                        Completed: {formatDate(item.completedAt)}
                                    </Text>
                                </View>
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
            )}
        </View>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
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
        paddingHorizontal: spacing.lg,
        flex: undefined
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
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    timerName: {
        fontSize: fontSizes.large,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    category: {
        fontSize: fontSizes.small,
        fontWeight: '500',
        color: colors.primary,
        backgroundColor: colors.primary + '15',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
    },
    itemDetails: {
        gap: spacing.xs,
    },
    duration: {
        fontSize: fontSizes.small,
        color: colors.primary,
        fontWeight: '600',
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
    debugInfo: {
        backgroundColor: colors.primary + '20',
        padding: spacing.sm,
        margin: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    debugText: {
        fontSize: fontSizes.small,
        color: colors.primary,
        fontWeight: '500',
    },
    debugButton: {
        backgroundColor: colors.primary,
        padding: spacing.sm,
        borderRadius: borderRadius.sm,
        marginTop: spacing.sm,
        alignItems: 'center',
    },
});

export default HistoryScreen; 