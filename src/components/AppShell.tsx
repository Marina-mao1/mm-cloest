import { Heart, Home, Plus, Shirt, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { Page } from "../types";

const nav = [
  { page: "home", label: "首页", icon: Home },
  { page: "wardrobe", label: "衣橱", icon: Shirt },
  { page: "add", label: "添加", icon: Plus },
  { page: "studio", label: "搭配", icon: Sparkles },
  { page: "profile", label: "我的", icon: Heart }
] as const;

type Props = {
  page: Page;
  ownerName?: string;
  onNavigate: (page: Page) => void;
  children: ReactNode;
};

export function AppShell({ page, ownerName, onNavigate, children }: Props) {
  return (
    <div className="min-h-[100dvh] bg-[#efe7dc] text-ink">
      <div className="app-screen">
        <header className="px-5 pb-3 pt-5">
          <button className="flex items-center gap-3 text-left" onClick={() => onNavigate("home")}>
            <span className="mm-mark">M</span>
            <span>
              <span className="block text-[25px] font-semibold leading-tight">MM Closet</span>
              <span className="block text-[10px] tracking-[0.16em] text-[#8d6c69]">{ownerName ? `${ownerName.toUpperCase()}'S WARDROBE` : "YOUR PERSONAL WARDROBE"}</span>
            </span>
          </button>
        </header>
        <main className="px-4 pb-28">{children}</main>
        <nav className="bottom-nav">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = page === item.page;
            const isAdd = item.page === "add";
            const navSlot = item.page === "studio" ? "col-start-4" : item.page === "profile" ? "col-start-5" : "";
            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`bottom-nav-item ${active ? "bottom-nav-active" : ""} ${
                  isAdd ? "bottom-nav-add" : ""
                } ${navSlot}`}
              >
                <Icon size={isAdd ? 25 : 20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
