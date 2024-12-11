const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: './app/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/dist/',  // Serve files from the correct output directory
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },

    devServer: {
        static: path.resolve(__dirname, 'public'),
        port: 3000,
        devMiddleware: {
            writeToDisk: true,
        },
        historyApiFallback: true,
        proxy: [
            {
                context: ['/register', '/login', '/ws', '/logout', '/getUserData'],
                target: 'http://localhost:8080',
                changeOrigin: true,
                webSocketServer: 'ws',
                pathRewrite: { '^/api': '' },
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
    ],
};

