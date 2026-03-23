import clsx from "clsx";

interface ProgressBarProps {
  /** Progress value between 0 and 1 */
  value: number;
  className?: string;
  /** Tailwind background color class for the fill bar. Defaults to accent blue. */
  color?: string;
}

export default function ProgressBar({
  value,
  className,
  color = "bg-axiom-accent",
}: ProgressBarProps) {
  const clampedValue = Math.min(1, Math.max(0, value));

  return (
    <div
      className={clsx(
        "h-1.5 w-full overflow-hidden rounded-full bg-axiom-border",
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(clampedValue * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={clsx(
          "h-full rounded-full transition-all duration-500 ease-out",
          color
        )}
        style={{ width: `${clampedValue * 100}%` }}
      />
    </div>
  );
}
