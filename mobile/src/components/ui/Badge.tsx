import { View, Text } from "react-native";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string; border: string }> = {
  default: { bg: "bg-zinc-800/80", text: "text-zinc-300", dot: "bg-zinc-400", border: "border-zinc-700/50" },
  neutral: { bg: "bg-zinc-900/90", text: "text-zinc-400", dot: "bg-zinc-500", border: "border-zinc-800" },
  success: { bg: "bg-emerald-950/40", text: "text-emerald-400", dot: "bg-emerald-400", border: "border-emerald-800/40" },
  warning: { bg: "bg-amber-950/40", text: "text-amber-400", dot: "bg-amber-400", border: "border-amber-800/40" },
  danger: { bg: "bg-rose-950/40", text: "text-rose-400", dot: "bg-rose-400", border: "border-rose-800/40" },
  info: { bg: "bg-sky-950/40", text: "text-sky-400", dot: "bg-sky-400", border: "border-sky-800/40" },
  purple: { bg: "bg-indigo-950/40", text: "text-indigo-400", dot: "bg-indigo-400", border: "border-indigo-800/40" },
};

export function Badge({ label, variant = "default", size = "sm", dot = true }: BadgeProps) {
  const v = variantStyles[variant] || variantStyles.default;
  const isSm = size === "sm";

  return (
    <View
      className={`flex-row items-center rounded-full border ${v.bg} ${v.border} ${
        isSm ? "px-2 py-0.5" : "px-2.5 py-1"
      }`}
    >
      {dot && <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${v.dot}`} />}
      <Text className={`font-medium tracking-tight ${v.text} ${isSm ? "text-[11px]" : "text-xs"}`}>
        {label}
      </Text>
    </View>
  );
}
