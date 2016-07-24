const path = require('path');

module.exports = {
    entry: "./src/paint.js",
    output: {
        path: path.join(__dirname, "/build"),
        filename: "bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            },
            {
                test: /\.glsl$/,
                loader: 'shader-loader',
            }
        ]
    }
};
