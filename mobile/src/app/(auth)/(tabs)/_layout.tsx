import { DarkTheme, ThemeProvider } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabsLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <NativeTabs
        labelStyle={{
          default: { color: "#8f8f93" },
          selected: { color: "#ffffff" },
        }}
        iconColor={{ default: "#8f8f93", selected: "#ffffff" }}
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon
            sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
            md={{ default: "grid_view", selected: "grid_view" }}
          />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="projects">
          <NativeTabs.Trigger.Icon
            sf={{ default: "folder", selected: "folder.fill" }}
            md={{ default: "folder", selected: "folder" }}
          />
          <NativeTabs.Trigger.Label>Projects</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="discussions">
          <NativeTabs.Trigger.Icon
            sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }}
            md={{ default: "forum", selected: "forum" }}
          />
          <NativeTabs.Trigger.Label>Discussions</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Icon
            sf={{ default: "gearshape", selected: "gearshape.fill" }}
            md={{ default: "settings", selected: "settings" }}
          />
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}