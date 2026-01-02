import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number; // milliseconds, undefined = no auto-dismiss
  timestamp: number;
}

interface UIState {
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";
  notifications: Notification[];

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "system",
      notifications: [],

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),

      setTheme: (theme: "light" | "dark" | "system") => {
        // Apply theme to document
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        if (theme === "system") {
          const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "dark"
            : "light";
          root.classList.add(systemTheme);
        } else {
          root.classList.add(theme);
        }

        set({ theme });
      },

      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now(),
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-dismiss if duration is set
        if (notification.duration) {
          setTimeout(() => {
            set((state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }));
          }, notification.duration);
        }
      },

      removeNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "kaizen-ui-storage",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        // Don't persist notifications
      }),
    }
  )
);

export default useUIStore;
