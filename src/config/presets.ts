export type StylePreset = {
  id: string;
  label: string;
  description: string;
  defaultStrength: number;
  allowMask: boolean;
  prompt: string;
  negativePrompt?: string;
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "cartoon",
    label: "卡通风",
    description: "插画化线条与纯色块",
    defaultStrength: 0.6,
    allowMask: true,
    prompt: "cartoon, clean outlines, flat colors, cel shading",
    negativePrompt: "realistic, photo, noise, artifacts",
  },
  {
    id: "oil",
    label: "油画风",
    description: "厚涂笔触与质感",
    defaultStrength: 0.8,
    allowMask: true,
    prompt: "oil painting, impasto, rich texture, dramatic lighting",
    negativePrompt: "flat, low detail",
  },
  {
    id: "cyberpunk",
    label: "赛博朋克",
    description: "霓虹与雨夜街景",
    defaultStrength: 0.65,
    allowMask: true,
    prompt: "cyberpunk, neon lights, rainy city, reflective surfaces, high contrast",
    negativePrompt: "low contrast, warm daylight",
  },
  {
    id: "film",
    label: "复古胶片",
    description: "胶片颗粒与偏色",
    defaultStrength: 0.4,
    allowMask: false,
    prompt: "vintage film look, grain, halation, slight color shift",
    negativePrompt: "overly sharp, digital crisp",
  },
  {
    id: "illustration",
    label: "插画风",
    description: "柔和插画, 适合人物/静物",
    defaultStrength: 0.6,
    allowMask: true,
    prompt: "soft illustration, pastel colors, gentle lighting, subtle texture",
  },
  {
    id: "bw",
    label: "黑白",
    description: "高对比黑白",
    defaultStrength: 0.5,
    allowMask: false,
    prompt: "black and white, high contrast, film grain",
  },
  {
    id: "neon",
    label: "霓虹风格",
    description: "强烈色彩与对比",
    defaultStrength: 0.8,
    allowMask: false,
    prompt: "neon glow, vibrant colors, high contrast, futuristic",
  },
];

export type EnhanceOptions = {
  denoise?: number;
  sharpen?: number;
  exposure?: number;
  contrast?: number;
  saturation?: number;
  whiteBalance?: number;
};


