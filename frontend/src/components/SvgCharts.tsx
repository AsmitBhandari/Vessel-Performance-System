import type { FuelTrendPoint, SpeedTrendPoint, WeatherTrendPoint } from "@/types";

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

interface LineData {
  label: string;
  color: string;
  values: number[];
}

interface SimpleChartProps {
  lines: LineData[];
  labels: string[];
  yUnit?: string;
  height?: number;
}

function SimpleLineChart({ lines, labels, yUnit = "", height = 200 }: SimpleChartProps) {
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const width = 600;

  const allValues = lines.flatMap((l) => l.values);
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (i: number) =>
    paddingLeft + (labels.length > 1 ? (i / (labels.length - 1)) * chartW : chartW / 2);
  const getY = (v: number) =>
    paddingTop + chartH - ((v - minVal) / range) * chartH;

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) =>
    minVal + (range / (yTicks - 1)) * i
  );

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yTickValues.map((v, i) => (
        <g key={i}>
          <line
            x1={paddingLeft}
            y1={getY(v)}
            x2={width - paddingRight}
            y2={getY(v)}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
          <text
            x={paddingLeft - 6}
            y={getY(v) + 3}
            textAnchor="end"
            fill="currentColor"
            fillOpacity={0.4}
            fontSize={9}
          >
            {v.toFixed(v >= 100 ? 0 : 1)}{yUnit}
          </text>
        </g>
      ))}

      {/* X axis labels */}
      {labels.map((label, i) => (
        <text
          key={i}
          x={getX(i)}
          y={height - 8}
          textAnchor="middle"
          fill="currentColor"
          fillOpacity={0.4}
          fontSize={9}
        >
          {label}
        </text>
      ))}

      {/* Lines */}
      {lines.map((line) => {
        if (line.values.length < 2) return null;
        const pathD = line.values
          .map((v, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`)
          .join(" ");

        return (
          <g key={line.label}>
            <path d={pathD} fill="none" stroke={line.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {line.values.map((v, i) => (
              <circle key={i} cx={getX(i)} cy={getY(v)} r={3} fill={line.color} />
            ))}
          </g>
        );
      })}

      {/* Legend */}
      {lines.map((line, i) => (
        <g key={line.label} transform={`translate(${paddingLeft + i * 100}, ${paddingTop - 8})`}>
          <rect width={10} height={3} rx={1} fill={line.color} />
          <text x={14} y={3} fill="currentColor" fillOpacity={0.5} fontSize={9}>
            {line.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Fuel Trend Chart ────────────────────────────────────────────────────────

export function FuelTrendChart({ data }: { data: FuelTrendPoint[] }) {
  if (data.length === 0) return <ChartEmpty />;
  const labels = data.map((d) => formatDateLabel(d.date));
  const lines: LineData[] = [
    { label: "LSFO", color: "hsl(210, 80%, 60%)", values: data.map((d) => d.lsfo) },
    { label: "HSFO", color: "hsl(30, 80%, 55%)", values: data.map((d) => d.hsfo) },
    { label: "MGO", color: "hsl(150, 60%, 50%)", values: data.map((d) => d.mgo) },
  ];
  return <SimpleLineChart lines={lines} labels={labels} yUnit=" MT" />;
}

// ── Speed Trend Chart ───────────────────────────────────────────────────────

export function SpeedTrendChart({ data }: { data: SpeedTrendPoint[] }) {
  if (data.length === 0) return <ChartEmpty />;
  const labels = data.map((d) => formatDateLabel(d.date));
  const lines: LineData[] = [
    { label: "Speed (kts)", color: "hsl(210, 80%, 60%)", values: data.map((d) => d.speed) },
    { label: "RPM", color: "hsl(280, 60%, 60%)", values: data.map((d) => d.rpm) },
  ];
  return <SimpleLineChart lines={lines} labels={labels} />;
}

// ── Weather Trend Chart ─────────────────────────────────────────────────────

export function WeatherTrendChart({ data }: { data: WeatherTrendPoint[] }) {
  if (data.length === 0) return <ChartEmpty />;
  const labels = data.map((d) => formatDateLabel(d.date));
  const lines: LineData[] = [
    { label: "Beaufort", color: "hsl(210, 80%, 60%)", values: data.map((d) => d.beaufort) },
    { label: "Wind (kts)", color: "hsl(40, 80%, 55%)", values: data.map((d) => d.windSpeed) },
  ];
  return <SimpleLineChart lines={lines} labels={labels} />;
}

// ── Empty placeholder ───────────────────────────────────────────────────────

function ChartEmpty() {
  return (
    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-xs">
      No trend data available.
    </div>
  );
}
