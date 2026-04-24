import React from 'react';
import { View, Text } from 'react-native';

export const TradingFloorScreen: React.FC = () => {
    return (
        <View style={{ flex: 1, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 40 }}>ALIVE - NO TICKER</Text>
        </View>
    );
};
