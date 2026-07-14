import { Check, Trash2 } from "lucide-react";

type Props = {
  message: string;
  kind?: "success" | "delete";
};

export function FeedbackToast({ message, kind = "success" }: Props) {
  const Icon = kind === "delete" ? Trash2 : Check;

  return (
    <div className={`feedback-toast ${kind === "delete" ? "feedback-toast-delete" : ""}`} role="status" aria-live="polite">
      <span className="feedback-toast-icon"><Icon size={16} /></span>
      <span>{message}</span>
    </div>
  );
}
