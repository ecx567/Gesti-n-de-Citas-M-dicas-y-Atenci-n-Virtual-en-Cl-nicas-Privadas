/**
 * Mock for @expo/vector-icons (not installed in dev).
 * Uses React Native's built-in View to render icon placeholders.
 */
const React = require('react');
const { View } = require('react-native');

module.exports = {
  Ionicons: ({ name, size, color, ...props }) =>
    React.createElement(View, { testID: `ionicon-${name}`, ...props }),
};
