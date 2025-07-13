import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './ui/Button';
import { Timer, TimerStatus } from '../contexts/TimerContext';
import { formatSeconds } from '../utils/time';

interface TimerCardProps {
    timer: Timer;
    onStart: () => void;
    onPause: () => void;
    onReset: () => void;
}

const TimerCard: React.FC<TimerCardProps> = ({ timer, onStart, onPause, onReset }) => {
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

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    time: {
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    status: {
        fontSize: 14,
        color: '#888',
        marginBottom: 8,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: '#eee',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4caf50',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 8,
    },
});

export default TimerCard; 