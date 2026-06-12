// Lightweight web shim for expo-linear-gradient
const React = require('react');
const { View } = require('react-native');

function LinearGradient({ colors = ['transparent'], style, children, ...props }) {
  const fallbackStyle = Array.isArray(colors) && colors.length > 0 ? { backgroundColor: colors[0] } : {};
  return React.createElement(View, { style: [style, fallbackStyle], ...props }, children);
}

module.exports = {
  LinearGradient,
};
