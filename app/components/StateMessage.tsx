type StateTone = "loading" | "error" | "empty";

type StateMessageProps = {
  message: string;
  tone?: StateTone;
  className?: string;
};

export default function StateMessage({
  message,
  tone = "loading",
  className = "",
}: StateMessageProps) {
  const toneClass =
    tone === "error"
      ? "text-red-500"
      : tone === "empty"
        ? "text-on-surface-variant"
        : "text-on-surface-variant";

  const role = tone === "error" ? "alert" : "status";

  return (
    <p role={role} className={`py-20 text-center ${toneClass} ${className}`.trim()}>
      {message}
    </p>
  );
}
