import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  Text, View, FlatList, Pressable, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { api } from "@/lib/api";
import { DiscussionChannel } from "@/types/api";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function ChannelList() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [channels, setChannels] = useState<DiscussionChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await api.channels.list(id);
      setChannels(res.channels);
    } catch (e: any) {
      setError(e?.message || "Failed to load channels");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const renderChannel = ({ item: c, index }: { item: DiscussionChannel; index: number }) => (
    <Link href={`/(auth)/(tabs)/workspace/${id}/discussions/${c.id}` as any} asChild>
      <Pressable className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-lg bg-neutral-800 items-center justify-center">
            <Text className={`font-bold text-lg ${c.type === "ANNOUNCEMENT" ? "text-amber-400" : "text-neutral-300"}`}>
              {c.type === "ANNOUNCEMENT" ? "📢" : "#"}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-white font-mono font-semibold text-base">
                #{c.name}
              </Text>
              {c.isUnread ? (
                <View className="bg-blue-500 rounded-full px-2 py-0.5">
                  <Text className="text-white text-[10px] font-bold">
                    {c.unreadCount ?? 1}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="text-neutral-500 text-xs mt-0.5" numberOfLines={1}>
              {c.topic || (c.project ? `${c.project.name} channel` : `${c.messageCount ?? 0} messages`)}
            </Text>
          </View>
          <Text className="text-neutral-600 text-lg">›</Text>
        </View>
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 border-b border-neutral-800">
        <Pressable onPress={() => router.back()}>
          <Text className="text-blue-500 text-sm mr-3">← Back</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg" numberOfLines={1}>
            Discussions
          </Text>
          <Text className="text-neutral-500 text-xs font-mono">CHANNELS</Text>
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
          data={channels}
          keyExtractor={(c) => c.id}
          contentContainerClassName="p-5 gap-3"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" colors={["#818cf8"]} />}
          ListEmptyComponent={
            <View className="items-center py-12 px-6">
              <Text className="text-white text-lg font-bold mb-2">No channels yet</Text>
              <Text className="text-neutral-500 text-sm text-center">
                Create a channel from the web app to start discussing.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(350).springify()} exiting={FadeOut.duration(200)}>
              {renderChannel({ item, index })}
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}