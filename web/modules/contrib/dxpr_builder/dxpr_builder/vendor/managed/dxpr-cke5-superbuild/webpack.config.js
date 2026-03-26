
// webpack.config.js

'use strict';

const path = require('path');
const { styles } = require('@ckeditor/ckeditor5-dev-utils');
const { CKEditorTranslationsPlugin } = require('@ckeditor/ckeditor5-dev-translations');
const webpack = require('webpack');

// Create absolute path to the empty module
const emptyModulePath = path.resolve(__dirname, 'empty-module.js');

module.exports = {
    // https://webpack.js.org/configuration/entry-context/
    entry: './ckeditor.js',

    output: {
        library: 'CKEDITOR',
        path: path.resolve(__dirname, 'dist'),
        filename: 'ckeditor.js',
        libraryExport: 'default',
    },

    // Add resolve configuration to prevent duplicate modules
    resolve: {
        alias: {
            '@ckeditor/ckeditor5-core': path.resolve(__dirname, 'node_modules/@ckeditor/ckeditor5-core'),
            '@ckeditor/ckeditor5-engine': path.resolve(__dirname, 'node_modules/@ckeditor/ckeditor5-engine'),
            '@ckeditor/ckeditor5-utils': path.resolve(__dirname, 'node_modules/@ckeditor/ckeditor5-utils'),
            '@ckeditor/ckeditor5-ui': path.resolve(__dirname, 'node_modules/@ckeditor/ckeditor5-ui'),
            '@ckeditor/ckeditor5-upload': path.resolve(__dirname, 'node_modules/@ckeditor/ckeditor5-upload')
        }
    },

    module: {
        rules: [
            {
                test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
                use: ['raw-loader']
            },
            {
                test: /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                        options: {
                            injectType: 'singletonStyleTag',
                            attributes: {
                                'data-cke': true
                            }
                        }
                    },
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: styles.getPostCssConfig({
                                themeImporter: {
                                    themePath: require.resolve('@ckeditor/ckeditor5-theme-lark')
                                },
                                minify: true
                            })
                        }
                    }
                ]
            }
        ]
    },

    plugins: [
        // Replace unused LLM providers with empty modules
        new webpack.NormalModuleReplacementPlugin(
            /@mistralai\/mistralai/,
            emptyModulePath
        ),
        new webpack.NormalModuleReplacementPlugin(
            /@anthropic-ai\/sdk/,
            emptyModulePath
        ),
        new webpack.NormalModuleReplacementPlugin(
            /@google\/generative-ai/,
            emptyModulePath
        ),
        new webpack.NormalModuleReplacementPlugin(
            /groq-sdk/,
            emptyModulePath
        ),
        new webpack.NormalModuleReplacementPlugin(
            /ollama/,
            emptyModulePath
        ),
        new CKEditorTranslationsPlugin({
            language: 'en',
            additionalLanguages: "all",
        }),
        new webpack.LoaderOptionsPlugin({
            options: {}
        }),
        // Define process.env.NODE_ENV to fix any potential issues
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
        })
    ],

    // Useful for debugging.
    devtool: false,

    // By default webpack logs warnings if the bundle is bigger than 200kb.
    performance: { hints: false }
};
