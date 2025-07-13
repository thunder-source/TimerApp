import React from 'react';
import { TextInput, View, Text, StyleSheet, StyleProp, ViewStyle, TextInputProps } from 'react-native';
import { borderRadius, spacing, fontSizes } from '../../utils/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps extends TextInputProps {
    error?: string;
    style?: StyleProp<ViewStyle>;
}

const Input = React.forwardRef<TextInput, InputProps>(({ error, style, ...props }, ref) => {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={style}>
            <TextInput
                ref={ref}
                style={[styles.input, error && styles.inputError]}
                placeholderTextColor={colors.muted}
                {...props}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
});

const createStyles = (colors: any) => StyleSheet.create({
    input: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.md - 4,
        paddingHorizontal: spacing.md,
        fontSize: fontSizes.medium,
        color: colors.text,
        marginBottom: 2,
    },
    inputError: {
        borderColor: colors.danger,
    },
    error: {
        color: colors.danger,
        fontSize: fontSizes.small,
        marginTop: 2,
        marginLeft: 2,
    },
});

export default Input; 