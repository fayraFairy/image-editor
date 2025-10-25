// 本地图像处理功能
// 使用 Canvas API 进行简单的图像处理

export interface ImageProcessorOptions {
  type: "enhance" | "inpaint" | "style";
  input: Record<string, unknown>;
}

export async function processImageLocally(options: ImageProcessorOptions): Promise<string> {
  const { type, input } = options;
  
  // 获取输入图像
  const imageUrl = input.image as string;
  if (!imageUrl) {
    throw new Error("No image provided");
  }

  try {
    // 创建图像元素
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    // 等待图像加载
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // 创建 Canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // 设置画布大小
    canvas.width = img.width;
    canvas.height = img.height;

    // 根据处理类型应用不同的效果
    switch (type) {
      case "enhance":
        await applyEnhancement(ctx, img, input);
        break;
      case "inpaint":
        await applyInpainting(ctx, img, input);
        break;
      case "style":
        await applyStyleTransfer(ctx, img, input);
        break;
      default:
        // 默认：直接绘制原图
        ctx.drawImage(img, 0, 0);
    }

    // 返回处理后的图像数据 URL
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Image processing error:", error);
    // 如果处理失败，返回原始图像
    return imageUrl;
  }
}

// 图像增强处理
async function applyEnhancement(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  input: Record<string, unknown>
) {
  // 绘制原图
  ctx.drawImage(img, 0, 0);
  
  // 获取图像数据
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  
  // 应用增强效果：提高对比度和亮度
  const strength = (input.strength as number) || 0.5;
  
  for (let i = 0; i < data.length; i += 4) {
    // 增强红色通道
    data[i] = Math.min(255, data[i] * (1 + strength * 0.2));
    // 增强绿色通道
    data[i + 1] = Math.min(255, data[i + 1] * (1 + strength * 0.2));
    // 增强蓝色通道
    data[i + 2] = Math.min(255, data[i + 2] * (1 + strength * 0.2));
    // 保持透明度
  }
  
  // 应用对比度增强
  const contrast = 1 + strength * 0.5;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128));
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128));
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128));
  }
  
  // 将处理后的数据绘制回画布
  ctx.putImageData(imageData, 0, 0);
}

// 图像修复处理
async function applyInpainting(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  input: Record<string, unknown>
) {
  // 绘制原图
  ctx.drawImage(img, 0, 0);
  
  // 获取遮罩
  const maskUrl = input.mask as string;
  if (maskUrl) {
    try {
      const maskImg = new Image();
      maskImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        maskImg.onload = resolve;
        maskImg.onerror = reject;
        maskImg.src = maskUrl;
      });
      
      // 创建遮罩画布
      const maskCanvas = document.createElement("canvas");
      const maskCtx = maskCanvas.getContext("2d");
      if (maskCtx) {
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        maskCtx.drawImage(maskImg, 0, 0);
        
        // 获取遮罩数据
        const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        const maskPixels = maskData.data;
        
        // 应用简单的修复算法：使用周围像素的平均值
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const idx = (y * img.width + x) * 4;
            const maskIdx = (y * img.width + x) * 4;
            
            // 如果遮罩区域是白色（需要修复）
            if (maskPixels[maskIdx] > 128) {
              // 使用周围像素的平均值进行修复
              const avgColor = getAverageColor(data, x, y, img.width, img.height);
              data[idx] = avgColor.r;
              data[idx + 1] = avgColor.g;
              data[idx + 2] = avgColor.b;
            }
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
    } catch (error) {
      console.error("Mask processing error:", error);
    }
  }
}

// 风格转换处理
async function applyStyleTransfer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  input: Record<string, unknown>
) {
  // 绘制原图
  ctx.drawImage(img, 0, 0);
  
  // 获取图像数据
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  
  const strength = (input.strength as number) || 0.5;
  const styleId = input.style as string;
  
  // 根据风格 ID 应用不同的效果
  switch (styleId) {
    case "vintage":
      applyVintageEffect(data, strength);
      break;
    case "sketch":
      applySketchEffect(data, strength);
      break;
    case "oil_painting":
      applyOilPaintingEffect(data, strength);
      break;
    default:
      // 默认：应用简单的色彩调整
      applyColorAdjustment(data, strength);
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// 获取周围像素的平均颜色
function getAverageColor(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number
): { r: number; g: number; b: number } {
  let r = 0, g = 0, b = 0, count = 0;
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = (ny * width + nx) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
    }
  }
  
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count)
  };
}

// 复古效果
function applyVintageEffect(data: Uint8ClampedArray, strength: number) {
  for (let i = 0; i < data.length; i += 4) {
    // 增加暖色调
    data[i] = Math.min(255, data[i] * (1 + strength * 0.3));
    data[i + 1] = Math.min(255, data[i + 1] * (1 + strength * 0.1));
    data[i + 2] = Math.min(255, data[i + 2] * (1 - strength * 0.2));
    
    // 降低饱和度
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = data[i] * (1 - strength * 0.3) + gray * strength * 0.3;
    data[i + 1] = data[i + 1] * (1 - strength * 0.3) + gray * strength * 0.3;
    data[i + 2] = data[i + 2] * (1 - strength * 0.3) + gray * strength * 0.3;
  }
}

// 素描效果
function applySketchEffect(data: Uint8ClampedArray, strength: number) {
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const sketch = gray > 128 ? 255 : 0;
    
    data[i] = data[i] * (1 - strength) + sketch * strength;
    data[i + 1] = data[i + 1] * (1 - strength) + sketch * strength;
    data[i + 2] = data[i + 2] * (1 - strength) + sketch * strength;
  }
}

// 油画效果
function applyOilPaintingEffect(data: Uint8ClampedArray, strength: number) {
  // 简化的油画效果：增加对比度和饱和度
  for (let i = 0; i < data.length; i += 4) {
    const contrast = 1 + strength * 0.5;
    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128));
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128));
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128));
  }
}

// 色彩调整
function applyColorAdjustment(data: Uint8ClampedArray, strength: number) {
  for (let i = 0; i < data.length; i += 4) {
    // 增强饱和度
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    const saturation = max === 0 ? 0 : (max - min) / max;
    
    if (saturation > 0) {
      const factor = 1 + strength * 0.5;
      data[i] = Math.min(255, data[i] * factor);
      data[i + 1] = Math.min(255, data[i + 1] * factor);
      data[i + 2] = Math.min(255, data[i + 2] * factor);
    }
  }
}
