import { Dumbbell } from "lucide-react";
import { DAY_LABELS, PLANNER_DAYS } from "../constants/wardrobe";
import type { Outfit, PlannerDay, UserProfile, WeeklyPlan } from "../types";

type Props = {
  outfits: Outfit[];
  weeklyPlan: WeeklyPlan;
  profile: UserProfile;
  onAssign: (day: PlannerDay, outfitId?: string) => void;
};

export function PlannerPage({ outfits, weeklyPlan, profile, onAssign }: Props) {
  const byId = new Map(outfits.map((item) => [item.id, item]));
  return (
    <div>
      <div className="soft-shell mb-5 p-6">
        <p className="mb-2 inline-flex rounded-full border border-ink bg-butter px-3 py-1 text-xs font-semibold text-ink shadow-sm">MY WEEKLY BOARD</p>
        <h1 className="page-title">一周穿搭</h1>
        <p className="page-kicker">提前把每天要穿的衣服准备好</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {PLANNER_DAYS.map((day) => {
          const outfit = weeklyPlan[day] ? byId.get(weeklyPlan[day]!) : undefined;
          const gym = profile.gymDays.includes(day);
          return (
            <section key={day} className="cute-panel p-4">
              <h2 className="font-medium">{day}</h2>
              <p className="text-sm text-[#8a7488]">{DAY_LABELS[day]}</p>
              {gym && <div className="mt-3 flex items-center gap-2 rounded-2xl bg-moss/10 px-3 py-2 text-sm text-moss"><Dumbbell size={16} />{profile.gymTime ? `${profile.gymTime} 健身` : "今天健身"}</div>}
              <select className="input mt-4" value={weeklyPlan[day] || ""} onChange={(event) => onAssign(day, event.target.value || undefined)}>
                <option value="">选择搭配</option>
                {outfits.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <div className="mt-4 min-h-28 rounded-[20px] bg-paper p-3">
                {outfit ? (
                  <>
                    <p className="font-medium">{outfit.name}</p>
                    <p className="text-sm text-[#8a7488]">{outfit.scene} · {outfit.items.length} 件</p>
                  </>
                ) : <p className="text-sm text-[#aa93ad]">未安排</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
