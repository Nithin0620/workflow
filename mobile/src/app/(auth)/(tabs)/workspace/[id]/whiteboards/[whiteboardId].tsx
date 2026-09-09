import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  Text, View, Pressable, ScrollView, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { Whiteboard, WhiteboardCanvasElement } from "@/types/api";
import { Skeleton } from "@/components/ui/Skeleton";

const PADDING = 80;

function CanvasElementEl({ el }: { el: WhiteboardCanvasElement }) {
  const style: any = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: Math.max(el.width, 1),
    height: Math.max(el.height, 1),
    borderColor: el.strokeColor || "#ffffff",
    borderWidth: Math.max(el.strokeWidth ?? 1, 1),
    backgroundColor: el.type === "text" || el.type === "sticky" ? undefined : el.backgroundColor || "transparent",
    opacity: el.opacity ?? 1,
  };

  if (el.type === "text") {
    return (
      <View style={{ position: "absolute", left: el.x, top: el.y, maxWidth: Math.max(el.width, 1) }}>
        <Text style={{ color: el.strokeColor || "#ffffff", fontSize: el.fontSize || 18, fontFamily: "monospace" }}>
          {el.text || ""}
        </Text>
      </View>
    );
  }

  if (el.type === "ellipse") {
    style.borderRadius = 9999;
  }

  if (el.type === "sticky") {
    style.backgroundColor = el.backgroundColor || "#fef3c7";
    style.borderWidth = 0;
  }

  if (el.type === "rectangle" || el.type === "diamond" || el.type === "sticky") {
    return <View style={[style, el.type === "diamond" ? { transform: [{ rotate: "45deg" }] } : null]} />;
  }

  // lines, arrows, freehand
  if (el.points && el.points.length > 1) {
    const [ax, ay] = [el.points[0].x, el.points[0].y];
    const [bx, by] = [el.points[el.points.length - 1].x, el.points[el.points.length - 1].y];
    const angle = Math.atan2(by - ay, bx - ax);
    const len = Math.hypot(bx - ax, by - ay);
    return (
      <View
        style={{
          position: "absolute",
          left: ax,
          top: ay,
          width: len,
          height: Math.max(el.strokeWidth ?? 2, 1),
          backgroundColor: el.strokeColor || "#ffffff",
          transform: [{ rotate: `${(angle * 180) / Math.PI}deg` }],
          transformOrigin: "left center",
        }}
      />
    );
  }

  return null;
}

export default function WhiteboardViewer() {
  const { id, whiteboardId } = useLocalSearchParams<{ id: string; whiteboardId: string }>();
  const router = useRouter();
  const [wb, setWb] = useState<Whiteboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!whiteboardId) return;
    try {
      setError(null);
      const res = await api.whiteboards.get(whiteboardId);
      setWb(res.whiteboard);
    } catch (e: any) {
      setError(e?.message || "Failed to load whiteboard");
    } finally {
      setLoading(false);
    }
  }, [whiteboardId]);

  useEffect(() => { load(); }, [load]);

  const raw: unknown = wb?.data ?? [];
  let elements: WhiteboardCanvasElement[] = [];
  if (Array.isArray(raw)) elements = raw;
  else if (typeof raw === "string" && raw.trim()) {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) elements = parsed;
  }
  const bounds = elements.reduce(
    (acc, el) => {
      const maxX = el.x + el.width;
      const maxY = el.y + el.height;
      return {
        minX: Math.min(acc.minX, el.x),
        minY: Math.min(acc.minY, el.y),
        maxX: Math.max(acc.maxX, maxX),
        maxY: Math.max(acc.maxY, maxY),
      };
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
  const hasElements = elements.length > 0;
  const canvasW = hasElements ? bounds.maxX - bounds.minX + PADDING : 800;
  const canvasH = hasElements ? bounds.maxY - bounds.minY + PADDING : 600;

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 border-b border-neutral-800">
        <Pressable onPress={() => router.back()}>
          <Text className="text-blue-500 text-sm mr-3">← Back</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg" numberOfLines={1}>
            {wb?.title || "Whiteboard"}
          </Text>
          {wb?.description ? (
            <Text className="text-neutral-500 text-xs" numberOfLines={1}>
              {wb.description}
            </Text>
          ) : null}
        </View>
        {wb?.createdBy?.name ? (
          <Text className="text-neutral-500 text-xs font-mono">{wb.createdBy.name}</Text>
        ) : null}
      </View>

      {loading ? (
        <View className="flex-1 p-5 gap-4">
          <Skeleton width="100%" height={300} borderRadius={12} />
          <Skeleton width="60%" height={14} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-400 text-sm text-center mb-4">{error}</Text>
          <Pressable onPress={load} className="bg-white rounded-lg px-6 py-2.5">
            <Text className="text-black font-semibold text-sm">Retry</Text>
          </Pressable>
        </View>
      ) : !hasElements ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-white text-lg font-bold mb-2">Empty board</Text>
          <Text className="text-neutral-500 text-sm text-center">
            This whiteboard has no elements yet.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} centerContent>
          <ScrollView horizontal contentContainerStyle={styles.hscroll}>
            <View
              style={{
                width: canvasW,
                height: canvasH,
                backgroundColor: "#0d0d0d",
                borderColor: "#262626",
                borderWidth: 1,
              }}
            >
              {elements.map((el) => (
                <CanvasElementEl key={el.id} el={el} />
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: "center" },
  hscroll: { justifyContent: "center" },
});