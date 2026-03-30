module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo(nent)?|@expo(nent)?/.*|expo-.*|@unimodules/.*|unimodules|react-native-reanimated)/)',
  ],
};
