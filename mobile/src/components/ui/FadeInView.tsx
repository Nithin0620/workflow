import Animated, { FadeInDown } from "react-native-reanimated";
import { useReduceMotion } from "@/lib/use-reduce-motion";

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeInView({
  children,
  delay = 0,
  duration = 400,
  className,
}: FadeInViewProps) {
  const reduceMotion = useReduceMotion();

  return (
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeInDown.duration(duration).delay(delay).springify()
      }
      className={className}
    >
      {children}
    </Animated.View>
  );
}