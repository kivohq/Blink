import React, { useEffect } from "react";
import Navbar from "./components/Navbar";

import AppLayout from "./AppLayout";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useErrorStore } from "./store/useErrorStore";
import { useChatStore } from "./store/useChatStore";
import { useFriendStore } from "./store/useFriendStore";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import ErrorModal from "./components/ErrorModal";
import CommandPalette from "./components/CommandPalette";
import ImageLightbox from "./components/ImageLightbox";

import { ContextMenuProvider } from "./components/ContextMenu";

const App: React.FC = () => {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { theme } = useThemeStore();
  const { currentError, clearError, retryCurrentError } = useErrorStore();
  const { toggleCommandPalette, setCommandPaletteOpen, setEditingMessage, setReplyingToMessage } = useChatStore();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCommandK = (isMac ? (e as any).metaKey : (e as any).ctrlKey) && (e as any).key === "k";

      if (isCommandK) {
        e.preventDefault();
        toggleCommandPalette();
      }

      if ((e as any).key === "Escape") {
        setCommandPaletteOpen(false);
        setEditingMessage(null);
        setReplyingToMessage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown as any);
    return () => window.removeEventListener("keydown", handleKeyDown as any);
  }, [toggleCommandPalette, setCommandPaletteOpen, setEditingMessage, setReplyingToMessage]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const { fetchFriends, fetchRequests, subscribeToFriendEvents, unsubscribeFromFriendEvents } = useFriendStore();
  const { subscribeToMessages, unsubscribeFromMessages, initWorkspaces } = useChatStore();

  useEffect(() => {
    if (authUser && socket) {
      fetchFriends();
      fetchRequests();
      subscribeToFriendEvents();
      subscribeToMessages();
      initWorkspaces();
      return () => {
        unsubscribeFromFriendEvents();
        unsubscribeFromMessages();
      };
    }
  }, [authUser, socket, fetchFriends, fetchRequests, subscribeToFriendEvents, unsubscribeFromFriendEvents, subscribeToMessages, unsubscribeFromMessages, initWorkspaces]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark = theme === "dark" || (theme === "system" && mediaQuery.matches);
      if (isDark) {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
    };

    applyTheme();

    if (theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
        <Loader className="size-10 animate-spin text-primary" />
      </div>
    );

  const isHomePage = location.pathname === "/";

  return (
    <ContextMenuProvider>
      <div className="min-h-screen bg-background dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {!(authUser && isHomePage) && (
          <Navbar />
        )}

        <Routes>
          <Route path="/" element={authUser ? <AppLayout /> : <Navigate to="/login" />} />
          <Route path="/u/:username" element={authUser ? <AppLayout /> : <Navigate to="/login" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        </Routes>

        <Toaster />

        <ErrorModal
          error={currentError?.error}
          onClose={clearError}
          onRetry={currentError?.onRetry ? retryCurrentError : null}
        />

        <CommandPalette />
        <ImageLightbox />
      </div>
    </ContextMenuProvider>
  );
};
export default App;
