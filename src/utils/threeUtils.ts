import * as THREE from 'three';
import { InnovationType, InnovationNature, InnovationLocus, CubeCoordinate, MatrixLayoutMode } from '../types/innovation';
import { INNOVATION_TYPES, INNOVATION_NATURES, INNOVATION_LOCI, NATURE_COLORS, TYPE_COLORS } from '../constants/innovationTaxonomy';

export function getCubeKey(typeIndex: number, natureIndex: number, locusIndex: number): string {
  return `${typeIndex}-${natureIndex}-${locusIndex}`;
}

export function parseCubeKey(key: string): CubeCoordinate {
  const [typeIndex, natureIndex, locusIndex] = key.split('-').map(Number);
  return { typeIndex, natureIndex, locusIndex };
}

export { type MatrixLayoutMode };

/**
 * Calculates 3D coordinates for a cube based on its indices in the 3 innovation dimensions.
 * Layout 'reference_3d' (default):
 *   - Y-Axis (Vertical): 9 Types of Innovation (Levels 0 to 8)
 *   - X-Axis (Left-Front): 4 Loci of Innovation (Small Teams to Ecosystem)
 *   - Z-Axis (Right-Front): 3 Natures of Innovation (Sustaining to Disruptive)
 *
 * Layout 'horizontal_types_3d':
 *   - X-Axis (Horizontal): 9 Types of Innovation
 *   - Y-Axis (Vertical): 3 Natures of Innovation
 *   - Z-Axis (Depth): 4 Loci of Innovation
 */
export function getCoordinatesFromIndices(
  typeIndex: number,
  natureIndex: number,
  locusIndex: number,
  spacing: number,
  layoutMode: MatrixLayoutMode = 'reference_3d'
): THREE.Vector3 {
  if (layoutMode === 'reference_3d') {
    // Compact 3D Isometric Matrix (tight spacing between adjacent 1.0-unit cubes)
    const spacingX = spacing;
    const spacingY = spacing;
    const spacingZ = spacing;

    const x = (locusIndex - 1.5) * spacingX;
    const y = (typeIndex - 4) * spacingY;
    const z = (natureIndex - 1) * spacingZ;

    return new THREE.Vector3(x, y, z);
  }

  // Horizontal Types 3D layout (compact)
  const spacingX = spacing;
  const spacingY = spacing;
  const spacingZ = spacing;

  const x = (typeIndex - 4) * spacingX;
  const y = (natureIndex - 1) * spacingY;
  const z = (locusIndex - 1.5) * spacingZ;

  return new THREE.Vector3(x, y, z);
}

/**
 * Creates an ultra-high-resolution 2D Canvas sprite texture for text labels in 3D space
 * Enhanced with large readable fonts, rich contrast, and crisp anti-aliasing
 */
export function createTextSprite(
  text: string,
  options: {
    textColor?: string;
    bgColor?: string;
    borderColor?: string;
    fontSize?: number;
    fontWeight?: string;
    lines?: string[];
    subText?: string;
    subTextColor?: string;
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;
    padding?: number;
    borderRadius?: number;
    accentDotColor?: string;
    rotation?: number;
    center?: THREE.Vector2;
  } = {}
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;

  const lines = options.lines && options.lines.length > 0 ? options.lines : [text];
  const width = options.width || 640;
  const height = options.height || (lines.length > 1 ? 180 : 120);
  const fontSize = options.fontSize || (lines.length > 1 ? 38 : 44);
  const fontWeight = options.fontWeight || '700';

  canvas.width = width;
  canvas.height = height;

  context.clearRect(0, 0, width, height);

  // Background rounded rect with glass shadow
  if (options.bgColor) {
    context.fillStyle = options.bgColor;
    const r = options.borderRadius || 20;
    context.beginPath();
    context.moveTo(r, 4);
    context.lineTo(width - r, 4);
    context.quadraticCurveTo(width - 4, 4, width - 4, r);
    context.lineTo(width - 4, height - r);
    context.quadraticCurveTo(width - 4, height - 4, width - r, height - 4);
    context.lineTo(r, height - 4);
    context.quadraticCurveTo(4, height - 4, 4, height - r);
    context.lineTo(4, r);
    context.quadraticCurveTo(4, 4, r, 4);
    context.closePath();
    context.fill();

    if (options.borderColor) {
      context.lineWidth = 5;
      context.strokeStyle = options.borderColor;
      context.stroke();
    }
  }

  // Accent indicator bar/dot on the left if requested
  if (options.accentDotColor) {
    context.fillStyle = options.accentDotColor;
    context.beginPath();
    context.arc(36, height / 2, 12, 0, Math.PI * 2);
    context.fill();
  }

  // Crisp multi-line or single line text rendering with large readable fonts
  context.textAlign = options.accentDotColor ? 'left' : 'center';
  context.textBaseline = 'middle';
  context.font = `${fontWeight} ${fontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
  context.fillStyle = options.textColor || '#ffffff';

  // Crisp text shadow for high-contrast legibility against any 3D angle
  context.shadowColor = 'rgba(0, 0, 0, 0.95)';
  context.shadowBlur = 6;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 2;

  const textStartX = options.accentDotColor ? 60 : width / 2;

  if (lines.length === 1) {
    context.fillText(lines[0], textStartX, height / 2);
  } else {
    const lineHeight = fontSize * 1.25;
    const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, idx) => {
      // Slightly dim sub-lines if more than 1
      if (idx > 0 && options.subTextColor) {
        context.fillStyle = options.subTextColor;
        context.font = `600 ${Math.round(fontSize * 0.82)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      }
      context.fillText(line, textStartX, startY + idx * lineHeight);
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false, // Ensures labels are never occluded by 3D geometry
    rotation: options.rotation !== undefined ? options.rotation : 0,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  if (options.center) {
    sprite.center.copy(options.center);
  }
  const scaleX = options.scaleX || 3.8;
  const scaleY = options.scaleY || (scaleX * height) / width;
  sprite.scale.set(scaleX, scaleY, 1);
  return sprite;
}

/**
 * Cube size is strictly uniform (1.0) for all 108 cubes per user requirement:
 * "all the cube size will be same so no need to add cube growth intensity"
 */
export function calculateTargetScale(_innovationCount: number, _totalImpact: number): number {
  return 1.0;
}

/**
 * Gets base material color and glow properties based on settings
 */
export function getCubeColor(
  type: InnovationType,
  nature: InnovationNature,
  colorMode: 'nature' | 'type' | 'heatmap',
  count: number
): { color: number; emissive: number; emissiveIntensity: number; edgeColor: number } {
  if (count === 0) {
    return {
      color: 0x0f172a,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      edgeColor: 0x475569, // Clean, crisp outline for empty cubes
    };
  }

  if (colorMode === 'heatmap') {
    // Density gradient: cyan -> emerald -> amber -> rose
    if (count === 1) {
      return { color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 1.1, edgeColor: 0xa5f3fc };
    }
    if (count === 2) {
      return { color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.25, edgeColor: 0x6ee7b7 };
    }
    if (count === 3) {
      return { color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.35, edgeColor: 0xfde68a };
    }
    return { color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 1.45, edgeColor: 0xfecdd3 };
  }

  if (colorMode === 'type') {
    const hex = TYPE_COLORS[type]?.threeHex || 0x3b82f6;
    return {
      color: hex,
      emissive: hex,
      emissiveIntensity: 1.1 + Math.min(count * 0.15, 0.4),
      edgeColor: 0xffffff,
    };
  }

  // Default: by Nature (Vibrant glow for Sustaining, Efficiency, Disruptive)
  const hex = NATURE_COLORS[nature]?.threeHex || 0x38bdf8;
  return {
    color: hex,
    emissive: hex,
    emissiveIntensity: 1.15 + Math.min(count * 0.15, 0.4),
    edgeColor: 0xffffff,
  };
}
