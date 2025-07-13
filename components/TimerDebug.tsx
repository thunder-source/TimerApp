import React from 'react';
import { View, Text, StyleSheet, ScrollView, AppState, TouchableOpacity } from 'react-native';
import { useTimers } from '../contexts/TimerContext';
import { colors, spacing } from '../utils/theme';
import { generateUniqueId } from '../utils/time';

const TimerDebug: React.FC = () => {
    const { timers, dispatch } = useTimers();
    const [appState, setAppState] = React.useState(AppState.currentState);

    React.useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            setAppState(nextAppState);
        });

        return () => subscription?.remove();
    }, []);

    const runningTimers = timers.filter(t => t.status === 'running');

    const addTestTimer = () => {
        dispatch({
            type: 'ADD_TIMER',
            timer: {
                id: generateUniqueId(),
                name: 'Background Test (15s)',
                duration: 15,
                remaining: 15,
                category: 'Test',
                status: 'idle',
            },
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Debug Info</Text>

            {/* App State Info */}
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>App State</Text>
                <Text style={styles.timerDetails}>Current: {appState}</Text>
                <Text style={styles.timerDetails}>Running Timers: {runningTimers.length}</Text>
                <TouchableOpacity style={styles.testButton} onPress={addTestTimer}>
                    <Text style={styles.testButtonText}>Add 15s Test Timer</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {timers.map((timer) => (
                    <View key={timer.id} style={styles.timerInfo}>
                        <Text style={styles.timerName}>{timer.name}</Text>
                        <Text style={styles.timerDetails}>
                            ID: {timer.id}
                        </Text>
                        <Text style={styles.timerDetails}>
                            Status: {timer.status}
                        </Text>
                        <Text style={styles.timerDetails}>
                            Duration: {timer.duration}s
                        </Text>
                        <Text style={styles.timerDetails}>
                            Remaining: {timer.remaining}s
                        </Text>
                        <Text style={styles.timerDetails}>
                            Category: {timer.category}
                        </Text>
                    </View>
                ))}
                {timers.length === 0 && (
                    <Text style={styles.noTimers}>No timers found</Text>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        borderRadius: 8,
        padding: 16,
        margin: 16,
        maxHeight: 300,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
    },
    scrollView: {
        flex: 1,
    },
    timerInfo: {
        backgroundColor: colors.background,
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    timerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    timerDetails: {
        fontSize: 12,
        color: colors.muted,
        marginBottom: 2,
    },
    noTimers: {
        fontSize: 14,
        color: colors.muted,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    infoSection: {
        backgroundColor: colors.background,
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    testButton: {
        backgroundColor: colors.primary,
        padding: 8,
        borderRadius: 6,
        marginTop: 8,
        alignItems: 'center',
    },
    testButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default TimerDebug; 