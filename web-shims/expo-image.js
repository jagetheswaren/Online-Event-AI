// Simple web shim for expo-image mapping to react-native Image
const React = require('react');
const { Image: RNImage } = require('react-native');

const Image = RNImage;

module.exports = {
  Image,
};
