import { ShaderTool } from '../types';
import { fundamentalTools } from './00-fundamentals';
import { coordinateTools } from './01-coordinates';
import { transformationTools } from './02-transformations';
import { shapingTools } from './03-shaping';
import { noiseTools } from './04-noise';
import { warpingTools } from './05-warping';
import { sdfTools } from './06-sdf';
import { tilingTools } from './07-tiling';
import { colorTools } from './08-color';
import { lightingTools } from './09-lighting';
import { raymarchingTools } from './10-raymarching';

const unsortedTools: ShaderTool[] = [
  ...fundamentalTools,
  ...coordinateTools,
  ...transformationTools,
  ...shapingTools,
  ...sdfTools,
  ...tilingTools,
  ...noiseTools,
  ...colorTools,
  ...warpingTools,
  ...lightingTools,
  ...raymarchingTools,
];

// Ordered from Absolute Zero (Level 0) to Master Hero (Level 4: 3D Raymarching & ACES)
export const allTools: ShaderTool[] = [...unsortedTools].sort(
  (a, b) => a.orderIndex - b.orderIndex
);
