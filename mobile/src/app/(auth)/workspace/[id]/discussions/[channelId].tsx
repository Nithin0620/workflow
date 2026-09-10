import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ArrowLeft,
  Send,
  Hash,
  Smile,
  Layers,
  Sparkles,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api";
import { DiscussionChannel, DiscussionMessage, User } from "@/types/api";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/ui/Avatar";
import { Header } from "@/components/ui/Header";
import { Skeleton } from "@/components/ui/Skeleton";

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ChannelMessages() {
  const { id, channelId } = useLocalSearchParams<{ id: string; channelId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const listRef = useRef<FlatList<DiscussionMessage>>(null);
  const [channel, setChannel] = useState<DiscussionChannel | null>(null);
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || !channelId) return;
    try {
      setError(null);
      const [chRes, msgRes] = await Promise.all([
        api.channels.list(id).then((r) => r.channels?.find((c) => c.id === channelId)),
        api.channels.getMessages(channelId),
      ]);
      if (chRes) setChannel(chRes);
      setMessages(msgRes.messages || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load channel messages.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, channelId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: false });
    }
  }, [loading, messages.length]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sending || !channelId) return;
    const tempId = `opt_${Date.now()}`;
    const optimistic: DiscussionMessage = {
      id: tempId,
      channelId,
      authorId: user?.id || "",
      author: (user || { id: "", name: "You" }) as User,
      content,
      reactions: [],
      issueLinks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setSending(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await api.channels.sendMessage(channelId, { content });
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? res.message : m))
      );
      listRef.current?.scrollToEnd({ animated: true });
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(content);
      alert(e?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item: m, index }: { item: DiscussionMessage; index: number }) => {
    const isMe = m.authorId === user?.id;

    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 20, 200)).duration(250)}
        className="py-2.5 px-4 flex-row items-start gap-3"
      >
        <Avatar
          name={m.author?.name || "Member"}
          image={m.author?.image}
          size="sm"
        />

        <View className="flex-1">
          <View className="flex-row items-baseline gap-2 mb-1">
            <Text className="text-white font-semibold text-xs tracking-tight">
              {m.author?.name || "Member"}
            </Text>
            <Text className="text-zinc-400 text-[10px] font-mono">
              {timeLabel(m.createdAt)}
            </Text>
          </View>

          <View className="bg-zinc-950 border border-zinc-850 rounded-2xl rounded-tl-sm p-3 border-zinc-800/80">
            <Text className="text-zinc-200 text-sm leading-relaxed">
              {m.content}
            </Text>

            {/* Issue links */}
            {m.issueLinks && m.issueLinks.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-zinc-900">
                {m.issueLinks.map((l) => (
                  <View
                    key={l.id}
                    className="flex-row items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1"
                  >
                    <Layers size={11} color="#818cf8" />
                    <Text className="text-indigo-400 text-[11px] font-mono font-medium">
                      {l.issue?.projectKey}-{l.issue?.issueNumber}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Reactions */}
          {m.reactions && m.reactions.length > 0 && (
            <View className="flex-row items-center gap-1.5 mt-1.5">
              {m.reactions.map((r, i) => (
                <View
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-full px-2 py-0.5"
                >
                  <Text className="text-xs text-zinc-300">{r.emoji}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <Header
        title={`#${channel?.name || "channel"}`}
        subtitle={channel?.topic || "Channel discussion"}
        showBack
      />

      {loading ? (
        <View className="flex-1 p-5 gap-4 justify-center">
          <View className="flex-row items-start gap-3">
            <Skeleton width={32} height={32} borderRadius={16} />
            <View className="flex-1 gap-2">
              <Skeleton width="30%" height={10} />
              <Skeleton width="90%" height={60} borderRadius={16} />
            </View>
          </View>
          <View className="flex-row items-start gap-3">
            <Skeleton width={32} height={32} borderRadius={16} />
            <View className="flex-1 gap-2">
              <Skeleton width="30%" height={10} />
              <Skeleton width="90%" height={60} borderRadius={16} />
            </View>
          </View>
          <View className="flex-row items-start gap-3">
            <Skeleton width={32} height={32} borderRadius={16} />
            <View className="flex-1 gap-2">
              <Skeleton width="30%" height={10} />
              <Skeleton width="70%" height={60} borderRadius={16} />
            </View>
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            className="flex-1"
            contentContainerClassName="py-4"
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
              <View className="items-center py-16 px-6">
                <View className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 items-center justify-center mb-3">
                  <Hash size={22} color="#818cf8" />
                </View>
                <Text className="text-xl font-bold text-white mb-1.5 text-center">
                  #{channel?.name || "general"}
                </Text>
                <Text className="text-zinc-400 text-xs text-center max-w-xs leading-relaxed">
                  {channel?.topic || "This is the start of the channel. Send a message to start chatting."}
                </Text>
              </View>
            }
            renderItem={renderMessage}
          />

          {/* Message Composer */}
          <View className="flex-row items-end gap-2.5 p-3.5 border-t border-zinc-900 bg-zinc-950/90">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Message #${channel?.name || "channel"}...`}
              placeholderTextColor="#52525b"
              multiline
              className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-3 text-white text-sm max-h-32"
            />
            <Pressable
              onPress={handleSend}
              disabled={!draft.trim() || sending}
              className={`w-11 h-11 rounded-2xl items-center justify-center active:opacity-80 ${
                draft.trim() && !sending ? "bg-white" : "bg-zinc-900 border border-zinc-800"
              }`}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#818cf8" />
              ) : (
                <Send size={18} color={draft.trim() ? "#000000" : "#52525b"} />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}