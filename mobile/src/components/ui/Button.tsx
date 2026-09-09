import { Pressable, Text, ActivityIndicator, View } from "react-native";
import * as Haptics from "expo-haptics";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const variants: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: "bg-white active:bg-zinc-200 border border-white",
    text: "text-black font-semibold",
  },
  secondary: {
    container: "bg-zinc-900 active:bg-zinc-800 border border-zinc-800",
    text: "text-zinc-100 font-medium",
  },
  outline: {
    container: "bg-transparent active:bg-zinc-900/60 border border-zinc-800",
    text: "text-zinc-300 font-medium",
  },
  ghost: {
    container: "bg-transparent active:bg-zinc-900/60 border border-transparent",
    text: "text-zinc-400 font-medium",
  },
  danger: {
    container: "bg-rose-950/50 active:bg-rose-900/60 border border-rose-800/40",
    text: "text-rose-400 font-semibold",
  },
};

const sizes = {
  sm: { container: "px-3 py-1.5 rounded-lg", text: "text-xs" },
  md: { container: "px-4 py-2.5 rounded-xl", text: "text-sm" },
  lg: { container: "px-5 py-3.5 rounded-xl", text: "text-base" },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  className = "",
}: ButtonProps) {
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center ${v.container} ${s.container} ${
        disabled ? "opacity-40" : ""
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#000000" : "#ffffff"}
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={`${v.text} ${s.text}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
