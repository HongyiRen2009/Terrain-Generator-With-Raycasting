import path from "path";
import { fileURLToPath } from "url";
import webpack from "webpack";
import "webpack-dev-server";
import dotenv from "dotenv";

dotenv.config();

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
    static: [
      path.resolve(__dirname, "public"),
      { directory: path.resolve(__dirname, "assets"), publicPath: "/assets" }
    ],
    hot: true,
    open: process.env.BROWSER
      ? { app: { name: process.env.BROWSER } }
      : true,
    port: 3000
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [ 
      {
        test: /\.ts$/,
        use: "ts-loader"
      },
      {
        test: /\.obj$/,
        type: "asset/source"
      },
      {
        test: /\.ply$/,
        type: "asset/source"
      },
      {
        test: /\.3mf$/,
        type: "asset/resource"
      },
      {
        test: /\.stl$/,
        type: "asset/resource"
      },
      {
        test: /\.vert$/,
        type: "asset/source"
      },
      {
        test: /\.frag$/,
        type: "asset/source"
      },
      {
        test: /\.wgsl$/,
        type: "asset/source"
      },
      {
        test: /\.glsl$/,
        type: "asset/source"
      },
      {
        test:/\.txt$/,
        type: "asset/source"
      },      
      
      {
        test: /\.png$/,
        type: 'asset/resource',
      },
    ]
  },
  plugins: [new webpack.HotModuleReplacementPlugin()]
};

export default config;
