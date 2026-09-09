import Animated, {
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useReduceMotion } from "@/lib/use-reduce-motion";

interface GlowFieldProps {
  children: (handlers: { onFocus: () => void; onBlur: () => void }) => React.ReactNode;
  className?: string;
}

export function GlowField({ children, className = "" }: GlowFieldProps) {
  const pulse = useSharedValue(0);
  const reduceMotion = useReduceMotion();

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(pulse.value, [0, 1], ["#27272a", "#818cf8"]),
  }));

  const handleFocus = () => {
    if (reduceMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
  };

  const handleBlur = () => {
    cancelAnimation(pulse);
    pulse.value = withTiming(0, { duration: 200 });
  };

  return (
    <Animated.View
      className={`rounded-xl border ${className}`}
      style={borderStyle}
    >
      {children({ onFocus: handleFocus, onBlur: handleBlur })}
    </Animated.View>
  );
}