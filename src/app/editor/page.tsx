"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import Image from "next/image";
import { useEditorStore } from "@/store/editor";
import { postJSON, getJSON } from "@/lib/api";
import { BrushTool } from "@/components/BrushTool";
import { STYLE_PRESETS } from "@/config/presets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, Wand2, ImageIcon, Palette, Zap, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

function useLoadImage(url: string | null) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useState(() => {
    if (!url) return;
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => {
      setImg(i);
      setSize({ w: i.width, h: i.height });
    };
    i.src = url;
  });
  return { img, size };
}

export default function EditorPage() {
  const {
    tool,
    imageUrl,
    maskDataUrl,
    styleId,
    strength,
    enhance,
    jobId,
    outputUrl,
    setTool,
    setImageUrl,
    setMask,
    setStyle,
    setStrength,
    setEnhance,
    setJob,
    setOutput
  } = useEditorStore();
  const [stageSize] = useState<{ w: number; h: number }>({ w: 600, h: 400 });
  const { img } = useLoadImage(imageUrl);
  const stageRef = useRef<Konva.Stage>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImageUrl(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const callAPI = async () => {
    if (!imageUrl) return;
    setIsProcessing(true);

    try {
      // For MVP, upload is objectURL; convert to dataURL
      const dataUrl = await fetch(imageUrl).then((r) => r.blob()).then((b) => new Promise<string>((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.readAsDataURL(b); }));

      if (tool === "inpaint") {
        if (!maskDataUrl) return alert("请先绘制遮罩");
        const resp = await postJSON<{ jobId: string }>("/api/edit/inpaint", { image: dataUrl, mask: maskDataUrl, prompt: "remove object", feather: 8, strength });
        setJob(resp.jobId);
      } else if (tool === "style") {
        if (!styleId) return alert("请选择风格");
        const resp = await postJSON<{ jobId: string }>("/api/edit/style", { image: dataUrl, styleId, strength });
        setJob(resp.jobId);
      } else {
        const resp = await postJSON<{ jobId: string }>("/api/edit/enhance", { image: dataUrl, options: enhance });
        setJob(resp.jobId);
      }
    } catch (error) {
      alert("处理失败: " + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const pollJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const info = await getJSON<{ status: string; outputUrl?: string; error?: string }>(`/api/jobs/${jobId}`);
      if (info.status === "completed") {
        setOutput(info.outputUrl || null);
      } else if (info.status === "failed") {
        alert("处理失败: " + (info.error || "未知错误"));
      }
    } catch (error) {
      console.error("轮询失败:", error);
    }
  }, [jobId, setOutput]);

  // Auto-poll when job is processing
  useEffect(() => {
    if (!jobId) return;
    const interval = setInterval(pollJob, 2000);
    return () => clearInterval(interval);
  }, [jobId, pollJob]);

  const getToolIcon = (toolType: string) => {
    switch (toolType) {
      case "inpaint": return <ImageIcon className="h-4 w-4" />;
      case "style": return <Palette className="h-4 w-4" />;
      case "enhance": return <Zap className="h-4 w-4" />;
      default: return <Wand2 className="h-4 w-4" />;
    }
  };

  const getToolLabel = (toolType: string) => {
    switch (toolType) {
      case "inpaint": return "图像修复";
      case "style": return "风格化";
      case "enhance": return "图像增强";
      default: return "选择工具";
    }
  };

  return (
    <div className="min-h-screen min-w-[360px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Wand2 className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold">AI 图像编辑器</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {outputUrl && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  asChild
                >
                  <a href={outputUrl} target="_blank">
                    <Download className="h-4 w-4 mr-2" />
                    下载结果
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tool Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              选择编辑工具
            </CardTitle>
            <CardDescription>选择您想要使用的AI编辑功能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {["inpaint", "style", "enhance"].map((toolType) => (
                <Button
                  key={toolType}
                  onClick={() => setTool(toolType as typeof tool)}
                  variant={tool === toolType ? "default" : "outline"}
                  className={`flex items-center gap-2 ${tool === toolType
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    : ""
                    }`}
                >
                  {getToolIcon(toolType)}
                  {getToolLabel(toolType)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Canvas */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getToolIcon(tool)}
                  {getToolLabel(tool)}
                </CardTitle>
                <CardDescription>
                  {tool === "inpaint" && "在图像上绘制遮罩区域，AI将智能修复该区域"}
                  {tool === "style" && "选择艺术风格，将图像转换为相应的艺术效果"}
                  {tool === "enhance" && "调整各种参数来增强图像质量"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tool === "inpaint" && imageUrl ? (
                  <BrushTool
                    imageUrl={imageUrl}
                    onMaskChange={setMask}
                  />
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <div className="bg-muted/50 px-4 py-2 text-sm font-medium">
                      原图预览
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800 flex justify-center items-center p-4">
                      <div className="relative" style={{ width: stageSize.w, height: stageSize.h }}>
                        <Stage
                          ref={stageRef}
                          width={stageSize.w}
                          height={stageSize.h}
                          style={{ width: stageSize.w, height: stageSize.h }}
                        >
                          <Layer>
                            {img && (() => {
                              // 计算保持比例的缩放 - 完整显示图片（contain模式）
                              // 计算两种缩放方式，选择较小的那个
                              const scaleByWidth = stageSize.w / img.width;
                              const scaleByHeight = stageSize.h / img.height;
                              const scale = Math.min(scaleByWidth, scaleByHeight);

                              const displayWidth = img.width * scale;
                              const displayHeight = img.height * scale;

                              // 确保图片完全适合画布，添加安全边距
                              const safeDisplayWidth = Math.min(displayWidth, stageSize.w - 2);
                              const safeDisplayHeight = Math.min(displayHeight, stageSize.h - 2);

                              const offsetX = (stageSize.w - safeDisplayWidth) / 2;
                              const offsetY = (stageSize.h - safeDisplayHeight) / 2;

                              // 调试信息
                              console.log('Image debug:', {
                                originalSize: { w: img.width, h: img.height },
                                stageSize: { w: stageSize.w, h: stageSize.h },
                                scale: scale,
                                scaleByWidth: scaleByWidth,
                                scaleByHeight: scaleByHeight,
                                displaySize: { w: displayWidth, h: displayHeight },
                                offset: { x: offsetX, y: offsetY },
                                willFitWidth: displayWidth <= stageSize.w,
                                willFitHeight: displayHeight <= stageSize.h
                              });

                              return (
                                <KonvaImage
                                  image={img}
                                  x={offsetX}
                                  y={offsetY}
                                  width={safeDisplayWidth}
                                  height={safeDisplayHeight}
                                />
                              );
                            })()}
                          </Layer>
                        </Stage>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {outputUrl && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    处理结果
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Image
                      src={outputUrl}
                      width={800}
                      height={600}
                      className="max-w-full h-auto"
                      alt="处理结果"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          {/* Right Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Image Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  上传图片
                </CardTitle>
                <CardDescription>选择要编辑的图片文件</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      onClick={handleUploadClick}
                      className="w-full"
                      variant="outline"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      选择图片文件
                    </Button>
                  </div>
                  {imageUrl && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      ✓ 图片已上传
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Editing Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">编辑设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {tool === "style" && (
                  <div className="space-y-2">
                    <Label htmlFor="style-select">选择风格</Label>
                    <Select value={styleId || ""} onValueChange={(value) => setStyle(value || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择风格" />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLE_PRESETS.map((preset) => (
                          <SelectItem key={preset.id} value={preset.id}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-3">
                  <Label>
                    强度: <Badge variant="secondary">{Math.round(strength * 100)}%</Badge>
                  </Label>
                  <Slider
                    value={[strength]}
                    onValueChange={([value]) => setStrength(value)}
                    max={1}
                    min={0}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                {tool === "enhance" && (
                  <div className="space-y-4">
                    <h3 className="font-medium">增强选项</h3>
                    {Object.entries(enhance).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label className="text-sm">
                          {key}: <Badge variant="outline">{Math.round((value || 0) * 100)}%</Badge>
                        </Label>
                        <Slider
                          value={[value || 0]}
                          onValueChange={([val]) => setEnhance({ [key]: val })}
                          max={1}
                          min={-1}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={callAPI}
                  disabled={isProcessing || !imageUrl}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      开始处理
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Job Status */}
            {jobId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">处理状态</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    任务ID: <code className="bg-muted px-1 py-0.5 rounded text-xs">{jobId}</code>
                  </div>
                  <Progress value={isProcessing ? 50 : 100} className="w-full" />
                  <Button
                    onClick={pollJob}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新状态
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}