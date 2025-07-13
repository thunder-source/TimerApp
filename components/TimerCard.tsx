import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './ui/Button';
import { Timer, TimerStatus } from '../contexts/TimerContext';
import { formatSeconds } from '../utils/time';
import { spacing } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';

interface TimerCardProps {
    timer: Timer;
    onStart: () => void;
    onPause: () => void;
    onReset: () => void;
}

const TimerCard: React.FC<TimerCardProps> = ({ timer, onStart, onPause, onReset }) => {
    const { colors } = useTheme();
    const styles = createStyles(colors, spacing);
    const progress = 1 - timer.remaining / timer.duration;
    return (
        <View style={styles.card}>
            <Text style={styles.name}>{timer.name}</Text>
            <Text style={styles.time}>{formatSeconds(timer.remaining)}</Text>
            <Text style={styles.status}>{timer.status.toUpperCase()}</Text>
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.buttonRow}>
                <Button
                    title="Start"
                    onPress={() => {
                        console.log(`Start button pressed for timer: ${timer.name}`);
                        onStart();
                    }}
                    disabled={timer.status === 'running' || timer.status === 'completed'}
                />
                <Button
                    title="Pause"
                    onPress={() => {
                        console.log(`Pause button pressed for timer: ${timer.name}`);
                        onPause();
                    }}
                    disabled={timer.status !== 'running'}
                />
                <Button
                    title="Reset"
                    onPress={() => {
                        console.log(`Reset button pressed for timer: ${timer.name}`);
                        onReset();
                    }}
                />
            </View>
        </View>
    );
};

const createStyles = (colors: any, spacing: any) => StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 16,
        alignItems: 'center',
        shadowColor: colors.shadow || '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    time: {
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 8,
        color: colors.text,
    },
    status: {
        fontSize: 14,
        color: colors.muted,
        marginBottom: 8,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: colors.border,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    buttonRow: {
        width: '100%',
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
});

export default TimerCard; 