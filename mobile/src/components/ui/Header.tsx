import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function Header({ title, subtitle, showBack = false, rightAction }: HeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-black/90">
      <View className="flex-row items-center gap-3 flex-1">
        {showBack && (
          <Pressable
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              router.back();
            }}
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center active:bg-zinc-800"
          >
            <ArrowLeft size={18} color="#a1a1aa" />
          </Pressable>
        )}
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg tracking-tight" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && <View className="ml-3">{rightAction}</View>}
    </View>
  );
}
