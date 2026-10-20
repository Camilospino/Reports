// Metro con Sentry: agrega los ids de depuración para que los errores muestren el código original.
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

module.exports = getSentryExpoConfig(__dirname);
