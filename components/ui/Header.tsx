import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { colors, spacing, fontSizes, borderRadius } from '../../utils/theme';

interface HeaderProps {
    title: string;
    subtitle?: string;
    rightComponent?: React.ReactNode;
    leftComponent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    subtitle,
    rightComponent,
    leftComponent,
}) => {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <View style={styles.content}>
                {leftComponent && (
                    <View style={styles.leftSection}>
                        {leftComponent}
                    </View>
                )}

                <View style={styles.centerSection}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>

                {rightComponent && (
                    <View style={styles.rightSection}>
                        {rightComponent}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight - 20 : 44,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        paddingHorizontal: 8
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        minHeight: 56,
    },
    leftSection: {
        flex: 1,
        alignItems: 'flex-start',
    },
    centerSection: {
        flex: 3,
        alignItems: 'flex-start',
    },
    rightSection: {
        flex: 1,
        alignItems: 'flex-end',
    },
    title: {
        fontSize: fontSizes.xlarge - 4,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'left',
    },
    subtitle: {
        fontSize: fontSizes.small,
        color: colors.muted,
        textAlign: 'center',
        marginTop: 2,
    },
}); 