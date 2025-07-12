import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, fontSizes, spacing } from '../../utils/theme';

interface AppLoadingProps {
    text?: string;
    size?: number | 'small' | 'large';
}

const Loading: React.FC<AppLoadingProps> = ({ text, size = 'large' }) => (
    <View style={styles.container}>
        <ActivityIndicator color={colors.primary} size={size} />
        {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    text: {
        marginTop: spacing.md,
        color: colors.text,
        fontSize: fontSizes.medium,
    },
});

export default Loading; 