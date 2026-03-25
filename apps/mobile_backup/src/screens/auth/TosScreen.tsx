import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

export const TosScreen: React.FC = () => {
    const [isChecked, setIsChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const acceptTos = useAuthStore((s) => s.acceptTos);

    const handleAccept = async () => {
        if (!isChecked) return;
        
        setIsLoading(true);
        try {
            await api.acceptTos();
            acceptTos(); // Update global auth state to navigate to main app
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to accept terms.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Before You Enter the Market</Text>
                
                <Text style={styles.bodyText}>
                    BLITZR is a virtual game economy. Creds and Chips are virtual game currency with zero real-world monetary value. They cannot be exchanged for real money under any circumstances.
                </Text>

                <Pressable 
                    style={styles.checkboxContainer} 
                    onPress={() => setIsChecked(!isChecked)}
                >
                    <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxText}>
                        I understand that Creds and Chips are virtual game currency with no real-world monetary value.
                    </Text>
                </Pressable>

                <View style={styles.buttonContainer}>
                    <Button
                        title="Enter BLITZR"
                        variant="buy"
                        size="lg"
                        fullWidth
                        disabled={!isChecked}
                        loading={isLoading}
                        onPress={handleAccept}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.obsidianBase,
    },
    content: {
        flex: 1,
        padding: Spacing.xxl,
        justifyContent: 'center',
    },
    title: {
        ...Typography.h2,
        color: Colors.textPrimary,
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },
    bodyText: {
        fontSize: 14,
        color: '#8E8E93',
        lineHeight: 20,
        marginBottom: Spacing.xxl,
        textAlign: 'center',
        paddingHorizontal: Spacing.md,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xxl,
        paddingHorizontal: Spacing.sm,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        backgroundColor: Colors.obsidianBase,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    checkboxActive: {
        backgroundColor: Colors.kineticGreen,
        borderColor: Colors.kineticGreen,
    },
    checkmark: {
        color: Colors.obsidianBase,
        fontSize: 14,
        fontWeight: 'bold',
    },
    checkboxText: {
        ...Typography.body,
        color: Colors.textSecondary,
        flex: 1,
        lineHeight: 20,
    },
    buttonContainer: {
        marginTop: Spacing.xl,
    },
});
