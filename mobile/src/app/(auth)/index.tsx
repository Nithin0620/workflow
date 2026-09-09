import { Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth-context";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-lg bg-white items-center justify-center">
              <Text className="text-black font-bold text-sm">W</Text>
            </View>
            <Text className="text-white font-semibold text-lg">Workflow</Text>
          </View>
          <Pressable onPress={logout}>
            <Text className="text-neutral-400 text-sm">Sign out</Text>
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-xl font-bold mb-2">
            Welcome back, {user?.name || "there"}
          </Text>
          <Text className="text-neutral-500 text-sm">
            Dashboard coming in Phase 1.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
