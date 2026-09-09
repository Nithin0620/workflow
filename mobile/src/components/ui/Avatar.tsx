import { View, Text, Image } from "react-native";

interface AvatarProps {
  name?: string | null;
  image?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: { box: "w-5 h-5", text: "text-[9px]" },
  sm: { box: "w-7 h-7", text: "text-xs" },
  md: { box: "w-9 h-9", text: "text-sm" },
  lg: { box: "w-12 h-12", text: "text-base" },
  xl: { box: "w-16 h-16", text: "text-xl" },
};

export function Avatar({ name, image, size = "md", className = "" }: AvatarProps) {
  const s = sizeMap[size] || sizeMap.md;
  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (image) {
    return (
      <Image
        source={{ uri: image }}
        className={`rounded-full border border-zinc-800 bg-zinc-800 ${s.box} ${className}`}
      />
    );
  }

  // Consistent background hue from name string
  const colors = [
    "bg-indigo-600/30 text-indigo-300 border-indigo-500/40",
    "bg-emerald-600/30 text-emerald-300 border-emerald-500/40",
    "bg-sky-600/30 text-sky-300 border-sky-500/40",
    "bg-amber-600/30 text-amber-300 border-amber-500/40",
    "bg-violet-600/30 text-violet-300 border-violet-500/40",
    "bg-rose-600/30 text-rose-300 border-rose-500/40",
  ];
  const charCode = (name || "U").charCodeAt(0) + (name || "U").length;
  const colorStyle = colors[charCode % colors.length];

  return (
    <View
      className={`rounded-full items-center justify-center border ${colorStyle} ${s.box} ${className}`}
    >
      <Text className={`font-semibold tracking-wider ${s.text}`}>
        {initials}
      </Text>
    </View>
  );
}
