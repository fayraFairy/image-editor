"use client";
import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eraser, Wand2, RotateCcw } from "lucide-react";

interface BrushToolProps {
  imageUrl: string | null;
  onMaskChange: (maskDataUrl: string | null) => void;
}

export function BrushTool({ imageUrl, onMaskChange }: BrushToolProps) {
  const [lines, setLines] = useState<Array<{ points: number[]; tool: string; strokeWidth: number }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 600, height: 400 });

  // 监听容器尺寸变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(containerRef.current);
        const paddingLeft = parseFloat(computedStyle.paddingLeft);
        const paddingRight = parseFloat(computedStyle.paddingRight);
        const paddingTop = parseFloat(computedStyle.paddingTop);
        const paddingBottom = parseFloat(computedStyle.paddingBottom);
        console.log(paddingLeft, paddingRight, paddingTop, paddingBottom);
        console.log(rect.width, rect.height);

        setContainerSize({
          width: rect.width - paddingLeft - paddingRight,
          height: rect.height - paddingTop - paddingBottom
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!imageUrl) return;
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => setImg(image);
    image.src = imageUrl;
  }, [imageUrl]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    setIsDrawing(true);
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    setLines([...lines, { points: [pos.x, pos.y], tool: "brush", strokeWidth: 20 }]);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const point = stage.getPointerPosition();
    if (!point) return;
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    setLines([...lines.slice(0, -1), lastLine]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    generateMask();
  };

  const generateMask = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const canvas = document.createElement("canvas");
    canvas.width = containerSize.width;
    canvas.height = containerSize.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill with transparent
    ctx.clearRect(0, 0, containerSize.width, containerSize.height);

    // Draw white brush strokes
    ctx.strokeStyle = "white";
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    lines.forEach((line) => {
      if (line.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(line.points[0], line.points[1]);
      for (let i = 2; i < line.points.length; i += 2) {
        ctx.lineTo(line.points[i], line.points[i + 1]);
      }
      ctx.stroke();
    });

    const maskDataUrl = canvas.toDataURL("image/png");
    onMaskChange(maskDataUrl);
  };

  const clearMask = () => {
    setLines([]);
    onMaskChange(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eraser className="h-5 w-5" />
          遮罩绘制工具
        </CardTitle>
        <CardDescription>
          在图像上绘制红色区域，AI将智能修复这些区域
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <span className="max-[370px]:hidden">绘制状态: </span>{isDrawing ? "绘制中" : "就绪"}
            </Badge>
            <Badge variant="secondary">
              <span className="max-[415px]:hidden">已绘制: </span>{lines.length} 笔
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={clearMask}
              variant="outline"
              size="sm"
              className="px-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="max-[485px]:hidden ml-1">清除遮罩</span>
            </Button>
            <Button
              onClick={generateMask}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-2"
              size="sm"
            >
              <Wand2 className="h-4 w-4" />
              <span className="max-[545px]:hidden ml-1">生成遮罩</span>
            </Button>
          </div>
        </div>

        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <div className="bg-muted/50 px-4 py-2 text-sm font-medium">
            绘制区域 (红色为遮罩区域)
          </div>
          <div
            ref={containerRef}
            className="bg-neutral-100 dark:bg-neutral-800 flex justify-center items-center p-1 rounded-b-lg"
            style={{ minHeight: '400px' }}
          >
            <Stage
              ref={stageRef}
              width={containerSize.width}
              height={containerSize.height}
              style={{ width: containerSize.width, height: containerSize.height }}
              onMouseDown={handleMouseDown}
              onMousemove={handleMouseMove}
              onMouseup={handleMouseUp}
            >
              <Layer>
                {img && (() => {
                  // 计算保持比例的缩放 - 完整显示图片（contain模式）
                  const scaleByWidth = containerSize.width / img.width;
                  const scaleByHeight = containerSize.height / img.height;
                  const scale = Math.min(scaleByWidth, scaleByHeight);

                  const displayWidth = img.width * scale;
                  const displayHeight = img.height * scale;

                  // 确保图片完全适合画布，添加安全边距
                  const safeDisplayWidth = Math.min(displayWidth, containerSize.width - 2);
                  const safeDisplayHeight = Math.min(displayHeight, containerSize.height - 2);

                  const offsetX = (containerSize.width - safeDisplayWidth) / 2;
                  const offsetY = (containerSize.height - safeDisplayHeight) / 2;

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
                {lines.map((line, i) => (
                  <Line
                    key={i}
                    points={line.points}
                    stroke="red"
                    strokeWidth={line.strokeWidth}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation="source-over"
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          💡 提示：在需要修复的区域绘制红色遮罩，AI将智能填充这些区域
        </div>
      </CardContent>
    </Card>
  );
}