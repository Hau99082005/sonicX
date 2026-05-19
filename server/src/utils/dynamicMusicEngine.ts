import {
  ActivityType,
  AudioLayerAdjustment,
  ContextRule,
  ContextType,
  TimeOfDayType,
  WeatherType,
} from "#/models/dynamicMusicProfile";
import { AppliedAdjustment } from "#/models/dynamicMusicSession";

export interface ContextInput {
  weather: WeatherType;
  activity: ActivityType;
  hour: number;
}

export interface ResolvedMix {
  resolvedContexts: ContextType[];
  timeOfDay: TimeOfDayType;
  appliedAdjustments: AppliedAdjustment[];
  ambientSoundUrl?: string;
  tempoMultiplier: number;
}

export function resolveTimeOfDay(hour: number): TimeOfDayType {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  if (hour >= 20 && hour < 24) return "night";
  return "late_night";
}

export function resolveContextsFromInput(input: ContextInput): ContextType[] {
  const contexts: ContextType[] = [];

  const weatherMap: Partial<Record<WeatherType, ContextType>> = {
    rain: "rain",
    storm: "rain",
  };

  const activityMap: Partial<Record<ActivityType, ContextType>> = {
    driving: "driving",
    studying: "studying",
    working_out: "working_out",
  };

  const timeOfDay = resolveTimeOfDay(input.hour);
  const timeMap: Partial<Record<TimeOfDayType, ContextType>> = {
    morning: "morning",
    evening: "evening",
    night: "night",
    late_night: "night",
  };

  if (weatherMap[input.weather]) contexts.push(weatherMap[input.weather]!);
  if (activityMap[input.activity]) contexts.push(activityMap[input.activity]!);
  if (timeMap[timeOfDay]) contexts.push(timeMap[timeOfDay]!);

  if (contexts.length === 0) contexts.push("default");

  return [...new Set(contexts)];
}

export function computeMix(
  contextRules: ContextRule[],
  resolvedContexts: ContextType[],
): Omit<ResolvedMix, "resolvedContexts" | "timeOfDay"> {
  const matchedRules = contextRules
    .filter((rule) => resolvedContexts.includes(rule.contextType))
    .sort((a, b) => b.priority - a.priority);

  if (matchedRules.length === 0) {
    const defaultRule = contextRules.find((r) => r.contextType === "default");
    if (defaultRule) matchedRules.push(defaultRule);
  }

  const layerMap = new Map<
    AudioLayerAdjustment["layerType"],
    AppliedAdjustment
  >();

  for (const rule of matchedRules) {
    for (const adj of rule.layerAdjustments) {
      if (!layerMap.has(adj.layerType)) {
        layerMap.set(adj.layerType, {
          layerType: adj.layerType,
          gainDelta: adj.gainDelta,
          fadeMs: adj.fadeMs,
          sourceContext: rule.contextType,
        });
      }
    }
  }

  const topRule = matchedRules[0];
  const tempoMultiplier = topRule?.tempoMultiplier ?? 1.0;
  const ambientSoundUrl = matchedRules.find(
    (r) => r.ambientSoundUrl,
  )?.ambientSoundUrl;

  return {
    appliedAdjustments: Array.from(layerMap.values()),
    tempoMultiplier,
    ambientSoundUrl,
  };
}

export function buildDefaultContextRules(): ContextRule[] {
  return [
    {
      contextType: "rain",
      priority: 80,
      description: "Thêm tiếng mưa và giảm nhịp độ",
      tempoMultiplier: 0.9,
      ambientSoundUrl: undefined,
      layerAdjustments: [
        { layerType: "ambient", gainDelta: 6, fadeMs: 1500 },
        { layerType: "percussion", gainDelta: -3, fadeMs: 1000 },
        { layerType: "vocal", gainDelta: -1, fadeMs: 800 },
      ],
    },
    {
      contextType: "driving",
      priority: 70,
      description: "Tăng cinematic bass và percussion",
      tempoMultiplier: 1.1,
      ambientSoundUrl: undefined,
      layerAdjustments: [
        { layerType: "bass", gainDelta: 5, fadeMs: 600 },
        { layerType: "percussion", gainDelta: 3, fadeMs: 600 },
        { layerType: "vocal", gainDelta: -1, fadeMs: 800 },
      ],
    },
    {
      contextType: "night",
      priority: 60,
      description: "Vocal nhẹ hơn, ambient sâu hơn",
      tempoMultiplier: 0.95,
      ambientSoundUrl: undefined,
      layerAdjustments: [
        { layerType: "vocal", gainDelta: -4, fadeMs: 2000 },
        { layerType: "ambient", gainDelta: 3, fadeMs: 2000 },
        { layerType: "bass", gainDelta: -2, fadeMs: 1500 },
      ],
    },
    {
      contextType: "studying",
      priority: 75,
      description: "Tự giảm lyric, tăng melody nền",
      tempoMultiplier: 1.0,
      ambientSoundUrl: undefined,
      layerAdjustments: [
        { layerType: "lyrics_volume", gainDelta: -8, fadeMs: 1200 },
        { layerType: "vocal", gainDelta: -5, fadeMs: 1200 },
        { layerType: "melody", gainDelta: 2, fadeMs: 1000 },
      ],
    },
    {
      contextType: "working_out",
      priority: 85,
      description: "Tăng bass, percussion mạnh, tempo nhanh",
      tempoMultiplier: 1.2,
      ambientSoundUrl: undefined,
      layerAdjustments: [
        { layerType: "bass", gainDelta: 7, fadeMs: 400 },
        { layerType: "percussion", gainDelta: 6, fadeMs: 400 },
        { layerType: "melody", gainDelta: 2, fadeMs: 600 },
      ],
    },
    {
      contextType: "morning",
      priority: 40,
      description: "Nhẹ nhàng, vocal rõ, tempo vừa",
      tempoMultiplier: 1.0,
      ambientSoundUrl: undefined,
      layerAdjustments: [
        { layerType: "vocal", gainDelta: 2, fadeMs: 2000 },
        { layerType: "bass", gainDelta: -2, fadeMs: 2000 },
        { layerType: "ambient", gainDelta: 1, fadeMs: 2000 },
      ],
    },
    {
      contextType: "evening",
      priority: 45,
      description: "Ấm áp, melody nổi bật",
      tempoMultiplier: 0.98,
      ambientSoundUrl: undefined,
      layerAdjustments: [
        { layerType: "melody", gainDelta: 3, fadeMs: 1500 },
        { layerType: "ambient", gainDelta: 2, fadeMs: 1500 },
      ],
    },
    {
      contextType: "default",
      priority: 0,
      description: "Cài đặt mặc định không thay đổi",
      tempoMultiplier: 1.0,
      ambientSoundUrl: undefined,
      layerAdjustments: [],
    },
  ];
}
