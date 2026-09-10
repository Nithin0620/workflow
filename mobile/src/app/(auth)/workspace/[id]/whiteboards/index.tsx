import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  Text, View, FlatList, Pressable, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { api } from "@/lib/api";
import { Whiteboard } from "@/types/api";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function WhiteboardList() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await api.whiteboards.list(id);
      setWhiteboards(res.whiteboards);
    } catch (e: any) {
      setError(e?.message || "Failed to load whiteboards");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 border-b border-neutral-800">
        <Pressable onPress={() => router.back()}>
          <Text className="text-blue-500 text-sm mr-3">← Back</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg" numberOfLines={1}>
            Whiteboards
          </Text>
          <Text className="text-neutral-500 text-xs font-mono">CANVASES</Text>
        </View>
      </View>

      {loading ? (
        <View className="p-5 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-400 text-sm text-center mb-4">{error}</Text>
          <Pressable onPress={load} className="bg-white rounded-lg px-6 py-2.5">
            <Text className="text-black font-semibold text-sm">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={whiteboards}
          keyExtractor={(w) => w.id}
          contentContainerClassName="p-5 gap-3"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" colors={["#818cf8"]} />}
          ListEmptyComponent={
            <View className="items-center py-12 px-6">
              <Text className="text-white text-lg font-bold mb-2">No whiteboards yet</Text>
              <Text className="text-neutral-500 text-sm text-center">
                Create a whiteboard from the web app to start sketching.
              </Text>
            </View>
          }
          renderItem={({ item: w, index }: { item: Whiteboard; index: number }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(350).springify()} exiting={FadeOut.duration(200)}>
              <Link href={`/(auth)/workspace/${id}/whiteboards/${w.id}` as any} asChild>
                <Pressable className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-lg bg-neutral-800 items-center justify-center">
                      <Text className="text-neutral-300 font-bold text-lg">🖍️</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base">{w.title}</Text>
                      {w.description ? (
                        <Text className="text-neutral-500 text-xs mt-0.5" numberOfLines={1}>
                          {w.description}
                        </Text>
                      ) : null}
                      <Text className="text-neutral-600 text-[11px] mt-0.5 font-mono">
                        {(w.data?.length ?? 0)} elements
                        {w.projects?.length
                          ? ` · ${w.projects.map((p) => p.project.key).join(", ")}`
                          : ""}
                      </Text>
                    </View>
                    <Text className="text-neutral-600 text-lg">›</Text>
                  </View>
                </Pressable>
              </Link>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}