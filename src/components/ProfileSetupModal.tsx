import { ProfileEditor } from "./ProfileEditor";
import type { UserProfile } from "../types";

type Props = {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
};

export function ProfileSetupModal({ profile, onSave }: Props) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-[#3d2d28]/35 p-4 backdrop-blur-sm sm:items-center sm:justify-center">
      <section className="w-full max-w-sm rounded-[22px] border border-[#dfd1c3] bg-[#fffaf3] p-6 shadow-[0_20px_50px_rgba(63,37,31,0.24)]">
        <p className="section-kicker">YOUR CLOSET, YOUR RHYTHM</p>
        <h1 className="mt-2 font-serif text-3xl text-[#35231e]">先认识一下你</h1>
        <p className="mt-2 text-sm leading-6 text-[#806a63]">这些设置只保存在这台设备里，会用来写你的衣橱问候和一周健身提醒。</p>
        <div className="mt-6"><ProfileEditor profile={profile} onSave={onSave} submitLabel="进入我的衣橱" /></div>
      </section>
    </div>
  );
}
