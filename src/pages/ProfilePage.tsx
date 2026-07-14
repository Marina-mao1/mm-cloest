import { ProfileEditor } from "../components/ProfileEditor";
import type { UserProfile } from "../types";

type Props = {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
};

export function ProfilePage({ profile, onSave }: Props) {
  return (
    <div className="space-y-4">
      <section>
        <p className="section-kicker">MY CLOSET SETTINGS</p>
        <h1 className="page-title">我的衣橱</h1>
        <p className="page-kicker">把名字和固定运动安排调成自己的节奏。</p>
      </section>
      <section className="mobile-card p-5"><ProfileEditor profile={profile} onSave={onSave} /></section>
    </div>
  );
}
