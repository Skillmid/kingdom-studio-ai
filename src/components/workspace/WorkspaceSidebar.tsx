"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import type {
  ReactNode,
} from "react";

export interface WorkspaceNavigationItem {
  id: string;

  label: string;

  description?: string;

  href?: string;

  icon?: ReactNode;

  active?: boolean;

  completed?: boolean;

  disabled?: boolean;

  onClick?: () => void;
}

interface WorkspaceSidebarProps {
  items: WorkspaceNavigationItem[];
}

export default function WorkspaceSidebar({
  items,
}: WorkspaceSidebarProps) {
  const pathname =
    usePathname();

  function isItemActive(
    item: WorkspaceNavigationItem
  ) {
    if (item.active !== undefined) {
      return item.active;
    }

    if (!item.href) {
      return false;
    }

    return pathname === item.href;
  }

  return (
    <nav className="flex h-full flex-col">

      <div className="border-b border-zinc-800 p-6">

        <h2 className="text-lg font-bold">
          Workspace
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Production Editor
        </p>

      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">

        {items.map((item) => {
          const active =
            isItemActive(item);

          const className =
            `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
              active
                ? "bg-yellow-500 text-black"
                : "text-zinc-300 hover:bg-zinc-900"
            } ${
              item.disabled
                ? "cursor-not-allowed opacity-40"
                : ""
            }`;

          const content = (
            <>
              <span>
                {item.icon ?? "•"}
              </span>

              <div className="flex-1">

                <div className="font-medium">
                  {item.label}
                </div>

                {item.description && (
                  <div className="text-xs opacity-70">
                    {item.description}
                  </div>
                )}

              </div>

              {item.completed && (
                <span>
                  ✓
                </span>
              )}
            </>
          );

          if (
            item.href &&
            !item.disabled
          ) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={className}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={item.onClick}
              className={className}
            >
              {content}
            </button>
          );
        })}

      </div>

    </nav>
  );
}