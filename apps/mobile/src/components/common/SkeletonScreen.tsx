import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../theme';

/**
 * SkeletonScreen — Loading state placeholder
 * 
 * Used for the Trading Floor while WebSocket connections initialize.
 * Shimmer effect on Titanium Gray background.
 * 
 * Per PRD §8.1
 */
interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export const SkeletonBlock: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = BorderRadius.card,
    style,
}) => {
    return (
        <View
            style={[
                styles.skeleton,
                { width: width as any, height, borderRadius },
                style,
            ]}
        />
    );
};

export const SkeletonCard: React.FC = () => (
    <View style={styles.card}>
        <View style={styles.cardRow}>
            <SkeletonBlock width={80} height={16} />
            <SkeletonBlock width={60} height={16} />
        </View>
        <SkeletonBlock width="100%" height={40} style={{ marginTop: Spacing.sm }} />
        <SkeletonBlock width="60%" height={12} style={{ marginTop: Spacing.sm }} />
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: Colors.titaniumGray,
        opacity: 0.6,
    },
    card: {
        backgroundColor: Colors.titaniumGray,
        borderRadius: BorderRadius.card,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
