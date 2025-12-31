const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');



module.exports = [
    {
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

        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, 'dist/omex.bundle.js'),
                        to: path.resolve(__dirname, 'chromeExtension/build/omex.bundle.js'),
                    },
                    {
                        from: path.resolve(__dirname, 'dist/tseOptionStrategies.bundle.js'),
                        to: path.resolve(__dirname, 'chromeExtension/build/tseOptionStrategies.bundle.js'),
                    }
                ]
            })
        ]



    },

    // -------------------------
    // 2) باندل مربوط به اکستنشن کروم → extension/
    // -------------------------
    {
        mode: "none",
        entry: {
            extensionScript: "./chromeExtension/omexPlus.js",
            // هر فایل دیگری که اکستنشن نیاز دارد
        },
        output: {
            path: path.resolve(__dirname, 'chromeExtension/build'),
            filename: "[name].bundle.js",
            // libraryTarget: "var",
            // iife: true,
        },
        experiments: {
            outputModule: true,
        },
        optimization: {
            minimize: false,
            concatenateModules: false,
        },
    }
]