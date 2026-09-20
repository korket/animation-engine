import type { WebpackOverrideFn } from '@remotion/bundler';

export const svgWebpackOverride: WebpackOverrideFn = (config) => ({
  ...config,
  module: {
    ...config.module,
    rules: [
      ...(config.module?.rules ?? []),
      { test: /\.svg$/i, type: 'asset/source' },
    ],
  },
});
