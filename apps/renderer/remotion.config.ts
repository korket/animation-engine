import { Config } from '@remotion/cli/config';
import { svgWebpackOverride } from './scripts/svg-webpack.ts';

Config.overrideWebpackConfig(svgWebpackOverride);
