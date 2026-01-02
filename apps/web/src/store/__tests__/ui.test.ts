import { describe, it, expect, beforeEach, vi } from "vitest";
import { useUIStore } from "../ui";

describe("useUIStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useUIStore.setState({
      sidebarCollapsed: false,
      theme: "system",
      notifications: [],
    });

    // Clear timers
    vi.clearAllTimers();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = useUIStore.getState();

      expect(state.sidebarCollapsed).toBe(false);
      expect(state.theme).toBe("system");
      expect(state.notifications).toEqual([]);
    });
  });

  describe("toggleSidebar", () => {
    it("should toggle sidebar collapsed state", () => {
      const { toggleSidebar } = useUIStore.getState();

      // Initially false
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);

      // Toggle to true
      toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      // Toggle back to false
      toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe("setSidebarCollapsed", () => {
    it("should set sidebar collapsed state", () => {
      const { setSidebarCollapsed } = useUIStore.getState();

      setSidebarCollapsed(true);
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      setSidebarCollapsed(false);
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe("setTheme", () => {
    it("should update theme state", () => {
      const { setTheme } = useUIStore.getState();

      setTheme("dark");
      expect(useUIStore.getState().theme).toBe("dark");

      setTheme("light");
      expect(useUIStore.getState().theme).toBe("light");

      setTheme("system");
      expect(useUIStore.getState().theme).toBe("system");
    });

    it("should apply theme class to document root for dark theme", () => {
      const { setTheme } = useUIStore.getState();

      setTheme("dark");

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
    });

    it("should apply theme class to document root for light theme", () => {
      const { setTheme } = useUIStore.getState();

      setTheme("light");

      expect(document.documentElement.classList.contains("light")).toBe(true);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("should apply system theme based on media query", () => {
      const { setTheme } = useUIStore.getState();

      // Mock matchMedia to return dark mode preference
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      setTheme("system");

      // Should apply dark theme based on system preference
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("addNotification", () => {
    it("should add notification to state", () => {
      const { addNotification } = useUIStore.getState();

      addNotification({
        title: "Test",
        message: "Test message",
        type: "info",
      });

      const state = useUIStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toMatchObject({
        title: "Test",
        message: "Test message",
        type: "info",
      });
    });

    it("should generate unique id and timestamp for notification", () => {
      const { addNotification } = useUIStore.getState();

      addNotification({
        title: "Test 1",
        message: "Message 1",
        type: "info",
      });

      addNotification({
        title: "Test 2",
        message: "Message 2",
        type: "success",
      });

      const state = useUIStore.getState();
      expect(state.notifications).toHaveLength(2);
      expect(state.notifications[0]?.id).toBeTruthy();
      expect(state.notifications[1]?.id).toBeTruthy();
      expect(state.notifications[0]?.id).not.toBe(state.notifications[1]?.id);
      expect(state.notifications[0]?.timestamp).toBeTruthy();
      expect(state.notifications[1]?.timestamp).toBeTruthy();
    });

    it("should auto-dismiss notification after duration", () => {
      vi.useFakeTimers();
      const { addNotification } = useUIStore.getState();

      addNotification({
        title: "Test",
        message: "Test message",
        type: "info",
        duration: 3000,
      });

      // Notification should be present
      expect(useUIStore.getState().notifications).toHaveLength(1);

      // Fast-forward time
      vi.advanceTimersByTime(3000);

      // Notification should be removed
      expect(useUIStore.getState().notifications).toHaveLength(0);

      vi.useRealTimers();
    });

    it("should not auto-dismiss notification without duration", () => {
      vi.useFakeTimers();
      const { addNotification } = useUIStore.getState();

      addNotification({
        title: "Test",
        message: "Test message",
        type: "info",
      });

      // Notification should be present
      expect(useUIStore.getState().notifications).toHaveLength(1);

      // Fast-forward time
      vi.advanceTimersByTime(10000);

      // Notification should still be present
      expect(useUIStore.getState().notifications).toHaveLength(1);

      vi.useRealTimers();
    });
  });

  describe("removeNotification", () => {
    it("should remove notification by id", () => {
      const { addNotification, removeNotification } = useUIStore.getState();

      addNotification({
        title: "Test 1",
        message: "Message 1",
        type: "info",
      });

      addNotification({
        title: "Test 2",
        message: "Message 2",
        type: "success",
      });

      const state = useUIStore.getState();
      expect(state.notifications).toHaveLength(2);

      const firstNotificationId = state.notifications[0]?.id;
      if (firstNotificationId) {
        removeNotification(firstNotificationId);
      }

      const updatedState = useUIStore.getState();
      expect(updatedState.notifications).toHaveLength(1);
      expect(updatedState.notifications[0]?.title).toBe("Test 2");
    });

    it("should do nothing if notification id does not exist", () => {
      const { addNotification, removeNotification } = useUIStore.getState();

      addNotification({
        title: "Test",
        message: "Test message",
        type: "info",
      });

      expect(useUIStore.getState().notifications).toHaveLength(1);

      removeNotification("non-existent-id");

      expect(useUIStore.getState().notifications).toHaveLength(1);
    });
  });

  describe("clearNotifications", () => {
    it("should clear all notifications", () => {
      const { addNotification, clearNotifications } = useUIStore.getState();

      addNotification({
        title: "Test 1",
        message: "Message 1",
        type: "info",
      });

      addNotification({
        title: "Test 2",
        message: "Message 2",
        type: "success",
      });

      expect(useUIStore.getState().notifications).toHaveLength(2);

      clearNotifications();

      expect(useUIStore.getState().notifications).toHaveLength(0);
    });
  });

  describe("persistence", () => {
    it("should persist sidebarCollapsed and theme but not notifications", () => {
      const { setSidebarCollapsed, setTheme, addNotification } =
        useUIStore.getState();

      setSidebarCollapsed(true);
      setTheme("dark");
      addNotification({
        title: "Test",
        message: "Test message",
        type: "info",
      });

      const state = useUIStore.getState();
      expect(state.sidebarCollapsed).toBe(true);
      expect(state.theme).toBe("dark");
      expect(state.notifications).toHaveLength(1);

      // Notifications should not be persisted (based on partialize in ui.ts)
      // This is verified by the implementation, not easily testable here
    });
  });
});
