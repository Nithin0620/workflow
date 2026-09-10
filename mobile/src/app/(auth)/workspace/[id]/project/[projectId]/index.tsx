import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Plus,
  ArrowLeft,
  MessageSquare,
  Flame,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Minus,
  SlidersHorizontal,
  FolderKanban,
  CheckCircle2,
  Circle,
  MoveRight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "@/lib/api";
import { Project, Column, Issue, IssuePriority } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";

function PriorityIcon({ priority }: { priority: IssuePriority }) {
  switch (priority) {
    case "URGENT":
      return <Flame size={13} color="#ef4444" />;
    case "HIGH":
      return <ArrowUp size={13} color="#f97316" />;
    case "MEDIUM":
      return <ArrowRight size={13} color="#eab308" />;
    case "LOW":
      return <ArrowDown size={13} color="#3b82f6" />;
    default:
      return <Minus size={13} color="#71717a" />;
  }
}

export default function ProjectBoard() {
  const { id, projectId } = useLocalSearchParams<{ id: string; projectId: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const [projRes, colRes, issueRes] = await Promise.all([
        api.projects.get(projectId),
        api.projects.getColumns(projectId),
        api.issues.list(projectId),
      ]);
      setProject(projRes.project);
      setColumns(colRes.columns || []);
      setIssues(issueRes.issues || []);
    } catch (e: any) {
      Alert.alert("Board Error", e?.message || "Failed to load board data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const moveIssue = async (issue: Issue, toStatus: string) => {
    if (!toStatus || toStatus === issue.status || moving) return;
    setMoving(issue.id);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await api.issues.update(issue.id, { status: toStatus } as any);
      setIssues((prev) =>
        prev.map((i) => (i.id === issue.id ? { ...i, status: res.issue.status } : i))
      );
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : "Failed to move issue";
      Alert.alert("Move Error", msg);
    } finally {
      setMoving(null);
    }
  };

  const promptMove = (issue: Issue) => {
    const targetCols = columns.filter((c) => c.key !== issue.status);
    const options = targetCols.map((c) => ({
      text: `→ ${c.name}`,
      onPress: () => moveIssue(issue, c.key),
    }));
    Alert.alert(
      `Move ${issue.projectKey}-${issue.issueNumber}`,
      "Select destination column:",
      [...options, { text: "Cancel", style: "cancel" }]
    );
  };

  const issuesByColumn = (colKey: string) =>
    issues.filter((i) => i.status === colKey);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      {/* Header */}
      <Header
        title={project?.name || "Project Board"}
        subtitle={project?.key ? `${project.key} · Kanban` : "Board"}
        showBack
        rightAction={
          <Link
            href={`/(auth)/workspace/${id}/project/${projectId}/issue/new` as any}
            asChild
          >
            <Button
              label="New Issue"
              onPress={() => {}}
              size="sm"
              icon={<Plus size={14} color="#000" />}
            />
          </Link>
        }
      />

      {loading ? (
        <View className="p-5 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <ScrollView
          horizontal
          className="flex-1"
          contentContainerClassName="p-4 gap-4"
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#818cf8"
              colors={["#818cf8"]}
            />
          }
        >
          {columns.map((col) => {
            const colIssues = issuesByColumn(col.key);
            return (
              <View
                key={col.id}
                className="w-80 bg-zinc-950/90 border border-zinc-900 rounded-3xl p-3.5 flex-1 max-h-full"
              >
                {/* Column Header */}
                <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-zinc-900 px-1">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.color || "#818cf8" }}
                    />
                    <Text className="text-white font-semibold text-sm tracking-tight">
                      {col.name}
                    </Text>
                  </View>
                  <Badge
                    label={`${colIssues.length}`}
                    variant="neutral"
                    size="sm"
                    dot={false}
                  />
                </View>

                {/* Issue Cards */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerClassName="gap-3 pb-8"
                >
                  {colIssues.length === 0 ? (
                    <View className="py-10 items-center justify-center border border-dashed border-zinc-900 rounded-2xl">
                      <Text className="text-zinc-400 text-xs font-medium">
                        No issues in this column
                      </Text>
                    </View>
                  ) : (
                    colIssues.map((issue, i) => (
                      <Animated.View
                        key={issue.id}
                        entering={FadeInDown.delay(i * 50).duration(300)}
                      >
                      <Link
                        href={`/(auth)/workspace/${id}/project/${projectId}/issue/${issue.id}` as any}
                        asChild
                      >
                        <Pressable className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 active:border-zinc-700">
                          {/* Top Tag & Priority */}
                          <View className="flex-row items-center justify-between mb-2">
                            <Text className="font-mono text-xs font-bold text-zinc-400">
                              {issue.projectKey}-{issue.issueNumber}
                            </Text>
                            <View className="flex-row items-center gap-1.5 bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800">
                              <PriorityIcon priority={issue.priority} />
                              <Text className="text-[11px] font-medium text-zinc-400 capitalize">
                                {issue.priority.toLowerCase()}
                              </Text>
                            </View>
                          </View>

                          {/* Title */}
                          <Text className="text-white text-sm font-semibold tracking-tight leading-snug">
                            {issue.title}
                          </Text>

                          {/* Bottom Metadata */}
                          <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-zinc-800/60">
                            <View className="flex-row items-center gap-3">
                              {/* Comments count */}
                              <View className="flex-row items-center gap-1">
                                <MessageSquare size={13} color="#71717a" />
                                <Text className="text-zinc-400 text-xs">
                                  {issue.commentsCount ?? issue._count?.comments ?? 0}
                                </Text>
                              </View>

                              {/* Story points */}
                              {issue.estimate ? (
                                <View className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/60">
                                  <Text className="text-zinc-300 text-[10px] font-mono">
                                    {issue.estimate} pts
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            <View className="flex-row items-center gap-2">
                              {/* Move Button */}
                              <Pressable
                                onPress={(e) => {
                                  e.stopPropagation();
                                  promptMove(issue);
                                }}
                                className="bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60 flex-row items-center gap-1 active:bg-zinc-700"
                              >
                                <MoveRight size={11} color="#a1a1aa" />
                                <Text className="text-zinc-300 text-[11px] font-medium">
                                  {moving === issue.id ? "Moving…" : "Move"}
                                </Text>
                              </Pressable>

                              {/* Assignee Avatar */}
                              <Avatar
                                name={issue.assignee?.name || "Unassigned"}
                                image={issue.assignee?.image}
                                size="xs"
                              />
                            </View>
                          </View>
                        </Pressable>
                      </Link>
                      </Animated.View>
                    ))
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}