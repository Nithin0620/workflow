import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Plus,
  Flame,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Minus,
  CheckCircle2,
  Layers,
  ChevronDown,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "@/lib/api";
import { Column, IssuePriority } from "@/types/api";
import { Header } from "@/components/ui/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

const PRIORITY_META: Record<
  IssuePriority,
  { label: string; icon: React.ReactNode }
> = {
  NO_PRIORITY: { label: "No priority", icon: <Minus size={13} color="#71717a" /> },
  LOW: { label: "Low", icon: <ArrowDown size={13} color="#3b82f6" /> },
  MEDIUM: { label: "Medium", icon: <ArrowRight size={13} color="#eab308" /> },
  HIGH: { label: "High", icon: <ArrowUp size={13} color="#f97316" /> },
  URGENT: { label: "Urgent", icon: <Flame size={13} color="#ef4444" /> },
};

export default function NewIssue() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  const [columns, setColumns] = useState<Column[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<IssuePriority>("MEDIUM");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!projectId) return;
      try {
        const res = await api.projects.getColumns(projectId);
        setColumns(res.columns || []);
        const first = res.columns[0];
        setStatus(first?.key || "TODO");
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to load columns");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please provide a title for the issue.");
      return;
    }
    setSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.issues.create(projectId!, {
        title: title.trim(),
        description: description.trim() || undefined,
        status: status as any,
        priority,
      });
      router.back();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : "Failed to create issue";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const promptStatus = () => {
    const options = columns.map((c) => ({
      text: `${c.key === status ? "✓ " : ""}${c.name}`,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStatus(c.key);
      },
    }));
    Alert.alert("Select Column", undefined, [...options, { text: "Cancel", style: "cancel" }]);
  };

  const promptPriority = () => {
    const options = (Object.keys(PRIORITY_META) as IssuePriority[]).map((p) => ({
      text: `${p === priority ? "✓ " : ""}${PRIORITY_META[p].label}`,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPriority(p);
      },
    }));
    Alert.alert("Select Priority", undefined, [...options, { text: "Cancel", style: "cancel" }]);
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Header
          title="New Issue"
          showBack
          rightAction={
            <Button
              label={submitting ? "Creating..." : "Create"}
              onPress={submit}
              loading={submitting}
              size="sm"
            />
          }
        />

        {loading ? (
          <View className="p-5 gap-5">
            <View className="gap-2">
              <Skeleton width="30%" height={12} />
              <Skeleton width="100%" height={52} borderRadius={16} />
            </View>
            <View className="gap-2">
              <Skeleton width="30%" height={12} />
              <Skeleton width="100%" height={120} borderRadius={16} />
            </View>
            <View className="flex-row gap-3">
              <Skeleton width="48%" height={80} borderRadius={16} />
              <Skeleton width="48%" height={80} borderRadius={16} />
            </View>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="p-5 gap-4"
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <Animated.View entering={FadeInDown.delay(50).duration(350).springify()}>
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Issue Title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What needs to be done?"
                placeholderTextColor="#52525b"
                className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3.5 text-base text-white focus:border-indigo-500"
              />
            </Animated.View>

            {/* Description */}
            <Animated.View entering={FadeInDown.delay(120).duration(350).springify()}>
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add context, specifications, or acceptance criteria..."
                placeholderTextColor="#52525b"
                multiline
                numberOfLines={5}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:border-indigo-500"
                style={{ minHeight: 120, textAlignVertical: "top" }}
              />
            </Animated.View>

            {/* Property Pickers */}
            <Animated.View entering={FadeInDown.delay(200).duration(350).springify()} className="flex-row gap-3">
              {/* Status */}
              <Pressable
                onPress={promptStatus}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 active:bg-zinc-900"
              >
                <Text className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider mb-1">
                  Status
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-white text-sm font-medium">
                    {columns.find((c) => c.key === status)?.name || "Select"}
                  </Text>
                  <ChevronDown size={14} color="#71717a" />
                </View>
              </Pressable>

              {/* Priority */}
              <Pressable
                onPress={promptPriority}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 active:bg-zinc-900"
              >
                <Text className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider mb-1">
                  Priority
                </Text>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    {PRIORITY_META[priority].icon}
                    <Text className="text-white text-sm font-medium">
                      {PRIORITY_META[priority].label}
                    </Text>
                  </View>
                  <ChevronDown size={14} color="#71717a" />
                </View>
              </Pressable>
            </Animated.View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}