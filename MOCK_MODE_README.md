# Mock 模式使用说明

## 概述

为了在开发阶段避免 Replicate API 的费用，我们实现了一个完整的 Mock 模式，可以完全免费地模拟真实的 API 行为。

## 功能特性

- ✅ **完全免费** - 无需任何 API 费用
- ✅ **真实体验** - 模拟真实的处理时间和状态更新
- ✅ **本地处理** - 使用 Canvas API 进行实际的图像处理
- ✅ **无缝切换** - 通过环境变量轻松切换到真实 API
- ✅ **相同接口** - 保持与现有代码完全兼容

## 快速开始

### 1. 设置环境变量

创建 `.env.local` 文件：

```bash
# 启用 Mock 模式
MOCK_MODE=true

# 设置处理延迟（毫秒）
MOCK_PROCESSING_DELAY=3000

# 其他必需配置
WEBHOOK_SECRET=your_webhook_secret_here
PUBLIC_WEB_BASE_URL=http://localhost:3000
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 使用应用

现在你可以完全免费地使用所有图像处理功能：

- **图像增强** (Enhance)
- **图像修复** (Inpaint)
- **风格转换** (Style Transfer)

## 本地图像处理功能

Mock 模式包含以下本地图像处理功能：

### 图像增强 (Enhance)

- 提高对比度和亮度
- 增强色彩饱和度
- 可调节处理强度

### 图像修复 (Inpaint)

- 基于遮罩的智能修复
- 使用周围像素进行填充
- 支持自定义修复强度

### 风格转换 (Style Transfer)

- **复古效果** - 暖色调和低饱和度
- **素描效果** - 黑白素描风格
- **油画效果** - 高对比度和饱和度
- **自定义色彩调整**

## 切换到真实 API

当准备使用真实的 Replicate API 时，只需修改环境变量：

```bash
# 禁用 Mock 模式
MOCK_MODE=false

# 添加 Replicate API Token
REPLICATE_API_TOKEN=your_replicate_api_token_here
```

## 技术实现

### 核心组件

1. **环境控制** (`src/lib/env.ts`)

   - 添加 `MOCK_MODE` 和 `MOCK_PROCESSING_DELAY` 配置
   - 使 `REPLICATE_API_TOKEN` 变为可选

2. **Mock 服务** (`src/lib/mock.ts`)

   - 模拟 Replicate API 的响应格式
   - 处理异步状态更新
   - 调用 webhook 回调

3. **本地图像处理** (`src/lib/image-processor.ts`)

   - 使用 Canvas API 进行实际图像处理
   - 支持多种处理效果
   - 错误处理和降级方案

4. **API 路由更新**
   - 所有现有 API 路由自动支持 Mock 模式
   - 保持完全相同的接口
   - 自动处理模式切换

### 处理流程

1. **请求接收** - API 路由接收处理请求
2. **模式检测** - 检查 `MOCK_MODE` 环境变量
3. **Mock 处理** - 创建模拟预测并开始异步处理
4. **本地处理** - 使用 Canvas API 处理图像
5. **状态更新** - 模拟真实的状态变化
6. **Webhook 回调** - 调用 webhook 通知完成
7. **结果返回** - 返回处理后的图像

## 开发建议

### 调试 Mock 模式

```bash
# 查看处理日志
console.log("Mock processing started for job:", jobId);

# 调整处理延迟
MOCK_PROCESSING_DELAY=1000  # 1秒快速处理
MOCK_PROCESSING_DELAY=5000  # 5秒模拟真实处理时间
```

### 自定义处理效果

可以在 `src/lib/image-processor.ts` 中自定义处理算法：

```typescript
// 添加新的风格效果
function applyCustomEffect(data: Uint8ClampedArray, strength: number) {
  // 你的自定义处理逻辑
}
```

## 注意事项

1. **浏览器兼容性** - 本地处理需要现代浏览器支持 Canvas API
2. **性能考虑** - 大图像处理可能较慢，建议添加进度指示
3. **错误处理** - 处理失败时会降级到原始图像
4. **内存使用** - 大图像会占用较多内存

## 故障排除

### 常见问题

1. **图像处理失败**

   - 检查图像格式是否支持
   - 确认图像 URL 可访问
   - 查看浏览器控制台错误

2. **Webhook 调用失败**

   - 确认 `PUBLIC_WEB_BASE_URL` 配置正确
   - 检查网络连接

3. **处理时间过长**
   - 调整 `MOCK_PROCESSING_DELAY` 设置
   - 检查图像大小

### 调试技巧

```bash
# 启用详细日志
DEBUG=mock:*

# 检查环境变量
console.log("Mock mode:", process.env.MOCK_MODE);
console.log("Processing delay:", process.env.MOCK_PROCESSING_DELAY);
```

## 总结

Mock 模式让你可以在开发阶段完全免费地测试图像处理功能，同时保持与生产环境完全相同的代码结构。当你准备好使用真实 API 时，只需要修改一个环境变量即可无缝切换。
