"use client";

import { useEffect, useState } from "react";

import { getCurrentUser } from "@/services/auth/auth";

interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
}

export function useCurrentUser() {
  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await getCurrentUser();

      if (user) {
        setUser({
          id: user.id,
          email: user.email ?? "",
          full_name:
            user.user_metadata?.full_name ??
            "Creator",
        });
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  return {
    user,
    loading,
  };
}