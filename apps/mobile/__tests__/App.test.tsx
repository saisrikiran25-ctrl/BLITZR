/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('@expo-google-fonts/space-grotesk', () => ({
  useFonts: () => [true],
  SpaceGrotesk_400Regular: {},
  SpaceGrotesk_500Medium: {},
  SpaceGrotesk_600SemiBold: {},
  SpaceGrotesk_700Bold: {},
}));

jest.mock('../src/services/websocket', () => ({
  wsService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

jest.mock('../src/navigation/AppNavigator', () => ({
  AppNavigator: () => null,
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const App = require('../App').default;

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
