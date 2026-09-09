import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ArrowLeft,
  Flame,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Minus,
  MessageSquare,
  Send,
  Calendar,
  Layers,
  User as UserIcon,
  Tag,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "@/lib/api";
import { Issue, IssuePriority } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

const PRIORITY_META: Record<
  IssuePriority,
  { label: string; icon: React.ReactNode; color: string }
> = {
  NO_PRIORITY: { label: "No priority", icon: <Minus size={13} color="#71717a" />, color: "#71717a" },
  LOW: { label: "Low", icon: <ArrowDown size={13} color="#3b82f6" />, color: "#3b82f6" },
  MEDIUM: { label: "Medium", icon: <ArrowRight size={13} color="#eab308" />, color: "#eab308" },
  HIGH: { label: "High", icon: <ArrowUp size={13} color="#f97316" />, color: "#f97316" },
  URGENT: { label: "Urgent", icon: <Flame size={13} color="#ef4444" />, color: "#ef4444" },
};

export default function IssueDetail() {
  const { id, projectId, issueId } = useLocalSearchParams<{
    id: string;
    projectId: string;
    issueId: string;
  }>();
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const load = useCallback(async () => {
    if (!issueId) return;
    try {
      const res = await api.issues.get(issueId);
      setIssue(res.issue);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load issue details.");
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (data: any) => {
    if (!issue) return;
    setSaving(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await api.issues.update(issue.id, data);
      setIssue(res.issue);
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : "Update failed.";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const promptPriority = () => {
    const options = (Object.keys(PRIORITY_META) as IssuePriority[]).map((p) => ({
      text: `${p === issue?.priority ? "✓ " : ""}${PRIORITY_META[p].label}`,
      onPress: () => patch({ priority: p }),
    }));
    Alert.alert("Set Priority", "Choose issue priority level:", [
      ...options,
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleAddComment = async () => {
    const clean = newComment.trim();
    if (!clean || !issue) return;
    setSubmittingComment(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Re-fetch issue to show latest comments
      setNewComment("");
      await load();
    } catch (e: any) {
      Alert.alert("Failed", "Could not send comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
        <View className="flex-row items-center px-5 py-3.5 border-b border-zinc-800/80 bg-black/90">
          <View className="w-9 h-9 rounded-full bg-zinc-900" />
          <View className="flex-1 px-4 gap-1.5">
            <Skeleton width="30%" height={14} />
            <Skeleton width="20%" height={10} />
          </View>
        </View>
        <View className="flex-1 p-5 gap-4">
          <Skeleton width="70%" height={24} />
          <Skeleton width="100%" height={120} borderRadius={20} />
          <Skeleton width="100%" height={80} borderRadius={20} />
          <Skeleton width="100%" height={100} borderRadius={20} />
        </View>
      </SafeAreaView>
    );
  }

  if (!issue) return null;

  const key = `${issue.projectKey}-${issue.issueNumber}`;
  const priorityMeta = PRIORITY_META[issue.priority] || PRIORITY_META.NO_PRIORITY;

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      {/* Top Bar */}
      <Header
        title={key}
        subtitle={issue.projectKey || "Issue Details"}
        showBack
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5 pb-24 gap-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Issue Title */}
          <Animated.View entering={FadeInDown.duration(400).springify()}>
            <Text className="text-white text-2xl font-bold tracking-tight leading-tight">
              {issue.title}
            </Text>
          </Animated.View>

          {/* Linear Property Grid */}
          <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-4 gap-3">
            {/* Status & Priority row */}
            <View className="flex-row items-center justify-between pb-3 border-b border-zinc-900">
              <View className="flex-row items-center gap-2">
                <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  Status
                </Text>
              </View>
              <Badge
                label={issue.column?.name || issue.status}
                variant="neutral"
                size="sm"
              />
            </View>

            {/* Priority Selector */}
            <Pressable
              onPress={promptPriority}
              className="flex-row items-center justify-between py-1 active:opacity-75"
            >
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Priority
              </Text>
              <View className="flex-row items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                {priorityMeta.icon}
                <Text className="text-xs font-medium text-zinc-300">
                  {priorityMeta.label}
                </Text>
              </View>
            </Pressable>

            {/* Assignee */}
            <View className="flex-row items-center justify-between py-1">
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Assignee
              </Text>
              <View className="flex-row items-center gap-2">
                <Avatar
                  name={issue.assignee?.name || "Unassigned"}
                  image={issue.assignee?.image}
                  size="xs"
                />
                <Text className="text-zinc-300 text-xs font-medium">
                  {issue.assignee?.name || "Unassigned"}
                </Text>
              </View>
            </View>

            {/* Estimate Points */}
            {issue.estimate ? (
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  Estimate
                </Text>
                <Badge
                  label={`${issue.estimate} points`}
                  variant="neutral"
                  size="sm"
                  dot={false}
                />
              </View>
            ) : null}

            {/* Sprint */}
            {issue.sprint ? (
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  Sprint
                </Text>
                <Text className="text-indigo-400 text-xs font-medium font-mono">
                  {issue.sprint.name}
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Labels */}
          {issue.labels && issue.labels.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} className="gap-2">
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider px-1">
                Labels
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {issue.labels.map((l) => (
                  <View
                    key={l.id}
                    className="rounded-full px-3 py-1 border border-zinc-800"
                    style={{ backgroundColor: `${l.color || "#818cf8"}15` }}
                  >
                    <Text className="text-xs font-medium" style={{ color: l.color || "#818cf8" }}>
                      {l.name}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} className="gap-2">
            <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider px-1">
              Description
            </Text>
            <View className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-4">
              <Text className="text-zinc-200 text-sm leading-relaxed">
                {issue.description || "No description provided."}
              </Text>
            </View>
          </Animated.View>

          {/* Discussion & Activity Feed */}
          <Animated.View entering={FadeInDown.delay(400).duration(400).springify()} className="gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Comments ({issue.comments?.length ?? 0})
              </Text>
            </View>

            {issue.comments && issue.comments.length > 0 ? (
              <View className="gap-3">
                {issue.comments.map((c) => (
                  <Card key={c.id} className="bg-zinc-950 border border-zinc-800/80 p-4">
                    <View className="flex-row items-center justify-between mb-2.5">
                      <View className="flex-row items-center gap-2">
                        <Avatar name={c.author.name || "User"} image={c.author.image} size="xs" />
                        <Text className="text-white text-xs font-semibold">
                          {c.author.name || "Member"}
                        </Text>
                      </View>
                      <Text className="text-zinc-400 text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="text-zinc-300 text-sm leading-relaxed pl-6">
                      {c.content}
                    </Text>
                  </Card>
                ))}
              </View>
            ) : (
              <View className="py-6 items-center justify-center bg-zinc-950 rounded-2xl border border-zinc-900">
                <Text className="text-zinc-400 text-xs font-medium">
                  No comments yet
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}