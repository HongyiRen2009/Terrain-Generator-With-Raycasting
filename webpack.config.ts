import path from "path";
import webpack from "webpack";
import "webpack-dev-server";

const config: webpack.Configuration = {
	mode: "development",
	devtool: "source-map",
	entry: "./src/index.ts",
	output: {
		path: path.resolve(__dirname, "public"),
		filename: "index.js",
		publicPath: "/",
	},
	devServer: {
		static: path.resolve(__dirname, "public"),
		hot: true,
		open: true,
		port: 3000,
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	plugins: [new webpack.HotModuleReplacementPlugin()],
};

export default config;
