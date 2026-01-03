const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    client: {
      overlay: false,
    },
  },
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /src/,
          exclude: /servers/,
        },
      ],
    },
  },
});
