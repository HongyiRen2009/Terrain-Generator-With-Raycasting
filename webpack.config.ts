import path from "path";
import { fileURLToPath } from "url";
import webpack from "webpack";
import "webpack-dev-server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: webpack.Configuration = {
  mode: "development",
  devtool: "source-map",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "index.js",
    publicPath: "/"
  },
  devServer: {
    static: path.resolve(__dirname, "public"),
    hot: true,
    open: true,
    port: 3000
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  plugins: [new webpack.HotModuleReplacementPlugin()]
};

export default config;
