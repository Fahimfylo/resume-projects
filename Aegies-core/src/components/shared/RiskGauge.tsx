"use client";

type RiskGaugeProps = {
  score: number;
  size?: number;
};

export function RiskGauge({ score, size = 128 }: RiskGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference * (1 - score / 100);
  const colorClass = score > 70 ? "text-destructive" : score > 40 ? "text-accent" : "text-primary";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          className="text-white/5"
        />
        <circle
          cx={cx} cy={cy} r={r}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={colorClass}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-headline font-bold">{score}</span>
        <span className="text-[10px] uppercase font-bold text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
