import { create } from "zustand";
import type { EnhanceOptions } from "@/config/presets";

type Tool = "inpaint" | "style" | "enhance";

type State = {
  tool: Tool;
  imageUrl: string | null;
  maskDataUrl: string | null;
  styleId: string | null;
  strength: number;
  enhance: EnhanceOptions;
  jobId: string | null;
  outputUrl: string | null;
  setTool: (t: Tool) => void;
  setImageUrl: (u: string | null) => void;
  setMask: (d: string | null) => void;
  setStyle: (id: string | null) => void;
  setStrength: (v: number) => void;
  setEnhance: (e: Partial<EnhanceOptions>) => void;
  setJob: (j: string | null) => void;
  setOutput: (u: string | null) => void;
};

export const useEditorStore = create<State>((set) => ({
  tool: "inpaint",
  imageUrl: null,
  maskDataUrl: null,
  styleId: null,
  strength: 0.65,
  enhance: {},
  jobId: null,
  outputUrl: null,
  setTool: (t) => set({ tool: t }),
  setImageUrl: (u) => set({ imageUrl: u }),
  setMask: (d) => set({ maskDataUrl: d }),
  setStyle: (id) => set({ styleId: id }),
  setStrength: (v) => set({ strength: v }),
  setEnhance: (e) => set((s) => ({ enhance: { ...s.enhance, ...e } })),
  setJob: (j) => set({ jobId: j }),
  setOutput: (u) => set({ outputUrl: u }),
}));


