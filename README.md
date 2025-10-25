# AI Image Editor

智能图片编辑器 - 基于 Replicate API 的图像修复、风格化和增强工具

## 功能特性

- 🎨 **图像修复**: 使用画笔工具选择区域，AI 自动修复水印、污点等
- 🎭 **风格化转换**: 支持卡通风、油画、赛博朋克等多种风格
- ✨ **图像增强**: 一键去噪、锐化、曝光调整等
- 🖌️ **交互式画布**: 基于 Konva 的流畅绘制体验
- 🌙 **暗色主题**: 现代化 UI 设计
- 📱 **响应式布局**: 支持桌面和移动端

## 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript
- **画布**: Konva + React-Konva
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **API**: Replicate (Reve Edit, Nano Banana)
- **存储**: Cloudflare R2
- **部署**: Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制 `.env.example` 为 `.env.local` 并填入配置：

```bash
cp .env.example .env.local
```

必需配置项：

- `REPLICATE_API_TOKEN`: Replicate API 密钥
- `WEBHOOK_SECRET`: Webhook 签名密钥
- `PUBLIC_WEB_BASE_URL`: 公网访问地址

可选配置（用于文件存储）：

- `R2_ACCESS_KEY_ID`: Cloudflare R2 访问密钥
- `R2_SECRET_ACCESS_KEY`: Cloudflare R2 秘密密钥
- `R2_ENDPOINT`: R2 端点地址
- `R2_BUCKET`: R2 存储桶名称
- `R2_PUBLIC_BASE_URL`: CDN 地址

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## API 接口

### 图像修复

```http
POST /api/edit/inpaint
Content-Type: application/json

{
  "image": "data:image/png;base64,...",
  "mask": "data:image/png;base64,...",
  "prompt": "remove watermark",
  "strength": 0.75,
  "feather": 8
}
```

### 风格化

```http
POST /api/edit/style
Content-Type: application/json

{
  "image": "data:image/png;base64,...",
  "styleId": "cartoon",
  "strength": 0.65
}
```

### 图像增强

```http
POST /api/edit/enhance
Content-Type: application/json

{
  "image": "data:image/png;base64,...",
  "options": {
    "denoise": 0.6,
    "sharpen": 0.4,
    "exposure": 0.1
  }
}
```

### 任务状态

```http
GET /api/jobs/{jobId}
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── edit/          # 编辑接口
│   │   └── replicate/     # Webhook 处理
│   ├── editor/            # 编辑器页面
│   └── page.tsx           # 首页
├── components/            # React 组件
│   └── BrushTool.tsx      # 画笔工具
├── config/                # 配置文件
│   └── presets.ts         # 风格预设
├── lib/                   # 工具库
│   ├── api.ts             # API 客户端
│   ├── env.ts             # 环境变量
│   ├── jobs.ts            # 任务管理
│   ├── replicate.ts       # Replicate 客户端
│   └── r2.ts              # R2 存储
└── store/                 # 状态管理
    └── editor.ts          # 编辑器状态
```

## 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 部署

### 环境变量

生产环境需要配置：

- `REPLICATE_API_TOKEN`
- `WEBHOOK_SECRET`
- `PUBLIC_WEB_BASE_URL`
- R2 相关配置（可选）

## 开发说明

### 添加新风格

在 `src/config/presets.ts` 中添加：

```typescript
{
  id: "new-style",
  label: "新风格",
  description: "风格描述",
  defaultStrength: 0.6,
  allowMask: true,
  prompt: "style prompt",
  negativePrompt: "negative prompt"
}
```

### 自定义增强选项

在 `src/config/presets.ts` 中修改 `EnhanceOptions` 类型。

## 许可证

MIT License
