const path = require('path');

module.exports = {
    mode: "none", // هیچ فشرده‌سازی یا minify انجام نده
    entry: {
        omex: './omex.js',
        tseOptionStrategies: './tseOptionStrategies.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "[name].bundle.js",
        library: "[name]Lib",
        libraryTarget: "var", // یعنی: window.bundleALib = {...}
        iife: true,
    },
    experiments: {
        outputModule: true, // اجازه بده خروجی module باشه
    },
    optimization: {
        minimize: false, // minify نکن
        concatenateModules: false, // tree shaking نکن
    },



};