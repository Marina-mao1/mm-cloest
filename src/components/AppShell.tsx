import { Heart, Home, Plus, Shirt, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { Page } from "../types";

const nav = [
  { page: "home", label: "首页", icon: Home },
  { page: "wardrobe", label: "衣橱", icon: Shirt },
  { page: "add", label: "添加", icon: Plus },
  { page: "studio", label: "搭配", icon: Sparkles },
  { page: "outfits", label: "我的", icon: Heart }
] as const;

type Props = {
  page: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
};

export function AppShell({ page, onNavigate, children }: Props) {
  return (
    <div className="min-h-[100dvh] bg-transparent text-ink">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-120px] top-[-60px] h-80 w-80 rounded-full bg-[#d5c3ff] blur-3xl" />
        <div className="absolute right-[-90px] top-32 h-72 w-72 rounded-full bg-[#f4c6df] blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/4 h-96 w-96 rounded-full bg-[#bda4f4] blur-3xl" />
      </div>
      <div className="app-screen">
        <header className="px-5 pb-3 pt-5">
          <button className="flex items-center gap-3 text-left" onClick={() => onNavigate("home")}>
            <span className="mm-mark">MM</span>
            <span>
              <span className="block text-[26px] font-black leading-tight tracking-[-0.02em]">MM Closet</span>
              <span className="block text-sm text-[#83679d]">你的衣橱管理者</span>
            </span>
          </button>
        </header>
        <main className="px-4 pb-28">{children}</main>
        <nav className="bottom-nav">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = page === item.page;
            const isAdd = item.page === "add";
            const navSlot = item.page === "studio" ? "col-start-4" : item.page === "outfits" ? "col-start-5" : "";
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
