import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import {
  Bell,
  AtSign,
  MessageSquare,
  CheckCircle2,
  FolderKanban,
  Check,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api";
import { Notification } from "@/types/api";
import { Header } from "@/components/ui/Header";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function getNotificationIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("mention")) return <AtSign size={16} color="#818cf8" />;
  if (t.includes("comment") || t.includes("message")) return <MessageSquare size={16} color="#38bdf8" />;
  if (t.includes("complete") || t.includes("done")) return <CheckCircle2 size={16} color="#34d399" />;
  if (t.includes("issue") || t.includes("project")) return <FolderKanban size={16} color="#f472b6" />;
  return <Bell size={16} color="#a1a1aa" />;
}

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.notifications.list();
      setNotifications(res.notifications || []);
      setUnread(res.unreadCount || 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      LayoutAnimation.configureNext(LayoutAnimation.create(300, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
      await api.notifications.markRead(true);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch (e: any) {
      console.log("Failed to mark read:", e);
    }
  };

  const markRead = async (n: Notification) => {
    if (n.isRead) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      LayoutAnimation.configureNext(LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
      await api.notifications.markRead(n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {}
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <Header
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread updates` : "All caught up"}
        showBack
        rightAction={
          unread > 0 ? (
            <Button
              label="Mark All Read"
              onPress={markAllRead}
              variant="outline"
              size="sm"
              icon={<Check size={13} color="#a1a1aa" />}
            />
          ) : undefined
        }
      />

      {loading ? (
        <View className="p-5 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-rose-400 text-sm text-center mb-4">{error}</Text>
          <Button label="Retry" onPress={load} size="md" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerClassName="p-5 pb-12 gap-3"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor="#818cf8"
              colors={["#818cf8"]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-6 bg-zinc-950/60 rounded-3xl border border-zinc-900">
              <View className="w-12 h-12 rounded-2xl bg-zinc-900 items-center justify-center mb-3">
                <Bell size={22} color="#71717a" />
              </View>
              <Text className="text-white text-base font-semibold mb-1">
                No Notifications
              </Text>
              <Text className="text-zinc-400 text-xs text-center max-w-xs leading-relaxed">
                Mentions, assigned issues, and project updates will appear here in real-time.
              </Text>
            </View>
          }
          renderItem={({ item: n, index }: { item: Notification; index: number }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(350).springify()} exiting={FadeOut.duration(200)}>
              <Pressable
                onPress={() => markRead(n)}
                className={`rounded-2xl p-4 border ${
                  n.isRead
                    ? "bg-zinc-950/70 border-zinc-900"
                    : "bg-zinc-900/90 border-zinc-700/80 shadow-md shadow-indigo-500/5"
                }`}
              >
                <View className="flex-row items-start gap-3.5">
                  <View className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 items-center justify-center mt-0.5">
                    {getNotificationIcon(n.title)}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text
                        className={`text-sm tracking-tight flex-1 mr-2 ${
                          n.isRead ? "text-zinc-300 font-medium" : "text-white font-bold"
                        }`}
                        numberOfLines={1}
                      >
                        {n.title}
                      </Text>
                      <Text className="text-zinc-400 text-[11px] font-mono">
                        {timeAgo(n.createdAt)}
                      </Text>
                    </View>

                    {n.message && (
                      <Text
                        className={`text-xs leading-relaxed ${
                          n.isRead ? "text-zinc-400" : "text-zinc-300"
                        }`}
                        numberOfLines={2}
                      >
                        {n.message}
                      </Text>
                    )}
                  </View>

                  {!n.isRead && (
                    <View className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                  )}
                </View>
              </Pressable>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
