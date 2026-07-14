import { CalendarDays, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { DAY_LABELS, PLANNER_DAYS } from "../constants/wardrobe";
import type { UserProfile } from "../types";

type Props = {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  submitLabel?: string;
};

export function ProfileEditor({ profile, onSave, submitLabel = "保存设置" }: Props) {
  const [name, setName] = useState(profile.name);
  const [gymDays, setGymDays] = useState(profile.gymDays);
  const [gymTime, setGymTime] = useState(profile.gymTime);

  useEffect(() => {
    setName(profile.name);
    setGymDays(profile.gymDays);
    setGymTime(profile.gymTime);
  }, [profile]);

  const toggleDay = (day: UserProfile["gymDays"][number]) => {
    setGymDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
  };

  return (
    <div className="space-y-5">
      <label className="field-label">
        <span className="mb-2 flex items-center gap-2"><UserRound size={16} />你的名字</span>
        <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：Iris" />
      </label>
      <div>
        <span className="field-label flex items-center gap-2"><CalendarDays size={16} />固定健身日</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLANNER_DAYS.map((day) => (
            <button key={day} type="button" className={`tag ${gymDays.includes(day) ? "tag-active" : ""}`} onClick={() => toggleDay(day)}>{DAY_LABELS[day]}</button>
          ))}
        </div>
      </div>
      <label className="field-label">健身时间（可选）<input className="input" value={gymTime} onChange={(event) => setGymTime(event.target.value)} placeholder="例如：晚上 7:00" /></label>
      <button className="btn-primary w-full justify-center" type="button" disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), gymDays, gymTime: gymTime.trim(), setupComplete: true })}><Save size={17} />{submitLabel}</button>
    </div>
  );
}
