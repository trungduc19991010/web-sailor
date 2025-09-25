/ @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src//*.{html,ts}",
    ],
    theme: {
        extend: {},
    },
    plugins: [
        require('@tailwindcss/aspect-ratio'),
    ],
    module: {
        rules: [
            {
                test: /\.scss$/,
                loader: 'postcss-loader',
                options: {
                    postcssOptions: {
                        ident: 'postcss',
                        syntax: 'postcss-scss',
                        plugins: [
                            require('postcss'),
                            require('tailwindcss'),
                            require('autoprefixer'),
                        ],
                    },
                },
            },
        ],
    },
}