import { useEffect } from "react";
import { View, DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useReduceMotion } from "@/lib/use-reduce-motion";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  className = "",
}: SkeletonProps) {
  const translateX = useSharedValue(-1);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) return;
    translateX.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      false
    );
  }, [reduceMotion]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(translateX.value, [-1, 1], [-200, 200]),
      },
    ],
  }));

  return (
    <View
      className={`overflow-hidden bg-zinc-900 ${className}`}
      style={{ width, height, borderRadius }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius,
            backgroundColor: "rgba(113, 113, 122, 0.15)",
          },
          shimmerStyle,
        ]}
      />
    </View>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <View
      className={`bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-4 gap-3 ${className}`}
    >
      <View className="flex-row items-center gap-3.5">
        <Skeleton width={44} height={44} borderRadius={14} />
        <View className="flex-1 gap-2">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={10} />
        </View>
      </View>
      <Skeleton width="100%" height={10} />
    </View>
  );
}

export function SkeletonHero({ className = "" }: { className?: string }) {
  return (
    <View
      className={`bg-zinc-950 border border-zinc-800/60 rounded-3xl p-5 gap-3 ${className}`}
    >
      <View className="flex-row items-center gap-3">
        <Skeleton width={32} height={32} borderRadius={10} />
        <Skeleton width="50%" height={16} />
      </View>
      <Skeleton width="80%" height={10} />
      <Skeleton width="100%" height={8} />
      <Skeleton width="60%" height={8} />
    </View>
  );
}
