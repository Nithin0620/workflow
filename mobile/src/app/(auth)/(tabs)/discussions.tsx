import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import {
  Hash,
  Lock,
  MessagesSquare,
  MessageSquarePlus,
  ChevronRight,
  FolderKanban,
  Volume2,
} from "lucide-react-native";
import { api } from "@/lib/api";
import { Workspace, DiscussionChannel } from "@/types/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/ui/Header";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function DiscussionsTab() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  const [channels, setChannels] = useState<DiscussionChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    try {
      const res = await api.workspaces.list();
      const ws = res.workspaces || [];
      setWorkspaces(ws);
      if (ws.length > 0 && !selectedWsId) {
        setSelectedWsId(ws[0].id);
      }
    } catch (e) {
      console.log("[DiscussionsTab] Load ws error:", e);
    }
  }, [selectedWsId]);

  const loadChannels = useCallback(async (wsId: string) => {
    try {
      setLoading(true);
      const res = await api.channels.list(wsId);
      setChannels(res.channels || []);
    } catch (e) {
      console.log("[DiscussionsTab] Load channels error:", e);
      setChannels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (selectedWsId) {
      loadChannels(selectedWsId);
    } else {
      setLoading(false);
    }
  }, [selectedWsId, loadChannels]);

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedWsId) {
      loadChannels(selectedWsId);
    } else {
      loadWorkspaces();
    }
  };

  const getChannelIcon = (ch: DiscussionChannel) => {
    if (ch.projectId) return <FolderKanban size={16} color="#818cf8" />;
    return <Hash size={16} color="#a1a1aa" />;
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <Header
        title="Discussions"
        subtitle={selectedWsId ? workspaces.find((w) => w.id === selectedWsId)?.name : "Channels"}
      />

      {/* Workspace Switcher */}
      {workspaces.length > 1 && (
        <View className="py-2.5 px-4 border-b border-zinc-900 bg-zinc-950">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={workspaces}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-2"
            renderItem={({ item: w }) => {
              const isSelected = w.id === selectedWsId;
              return (
                <Pressable
                  onPress={() => setSelectedWsId(w.id)}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    isSelected
                      ? "bg-white border-white"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? "text-black" : "text-zinc-400"
                    }`}
                  >
                    {w.name}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {loading ? (
        <View className="p-5 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(ch) => ch.id}
          contentContainerClassName="p-5 pb-12 gap-3"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#818cf8"
              colors={["#818cf8"]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-6 bg-zinc-950/60 rounded-3xl border border-zinc-900">
              <View className="w-12 h-12 rounded-2xl bg-zinc-900 items-center justify-center mb-3">
                <MessagesSquare size={22} color="#71717a" />
              </View>
              <Text className="text-white text-base font-semibold mb-1">
                No Channels Yet
              </Text>
              <Text className="text-zinc-400 text-xs text-center max-w-xs leading-relaxed">
                Channels will appear here once created in this workspace.
              </Text>
            </View>
          }
          renderItem={({ item: ch, index }: { item: DiscussionChannel; index: number }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 80).duration(400).springify()}
              exiting={FadeOut.duration(200)}
            >
              <Card
                onPress={() => {
                  if (selectedWsId) {
                    router.push(`/(auth)/workspace/${selectedWsId}/discussions/${ch.id}` as any);
                  }
                }}
                className="bg-zinc-950/90 border border-zinc-800/80 p-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3.5 flex-1">
                    <View className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 items-center justify-center">
                      {getChannelIcon(ch)}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white font-semibold text-base tracking-tight" numberOfLines={1}>
                          {ch.name}
                        </Text>
                        {ch.isUnread && (
                          <View className="w-2 h-2 rounded-full bg-indigo-500" />
                        )}
                      </View>
                      <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                        {ch.topic || "Tap to open discussion"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Badge
                      label={`${ch.messageCount ?? 0}`}
                      variant="neutral"
                      size="sm"
                      dot={false}
                    />
                    <ChevronRight size={16} color="#71717a" />
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
