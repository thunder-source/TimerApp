import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fontSizes, spacing, borderRadius } from '../utils/theme';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

interface CompletionModalProps {
    visible: boolean;
    timerName: string;
    onClose: () => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
    visible,
    timerName,
    onClose
}) => {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name="check-circle"
                            size={64}
                            color={colors.primary}
                        />
                    </View>

                    <Text style={styles.congratulationsText}>
                        Congratulations!
                    </Text>

                    <Text style={styles.timerNameText}>
                        "{timerName}" is complete!
                    </Text>

                    <Text style={styles.messageText}>
                        Great job! You've successfully completed your timer.
                    </Text>

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                            console.log('Completion modal closed by user - clearing completed timers');
                            onClose();
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.closeButtonText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContainer: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        maxWidth: 320,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: spacing.lg,
    },
    congratulationsText: {
        fontSize: fontSizes.xlarge,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    timerNameText: {
        fontSize: fontSizes.large,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    messageText: {
        fontSize: fontSizes.medium,
        color: colors.muted,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    closeButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        minWidth: 120,
    },
    closeButtonText: {
        color: colors.light,
        fontSize: fontSizes.medium,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default CompletionModal; 