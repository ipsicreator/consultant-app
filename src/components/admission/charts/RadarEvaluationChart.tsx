"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface RadarEvaluationChartProps {
  rubricState: Record<string, string>;
  labels: string[];
}

const mapGradeToValue: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };

export default function RadarEvaluationChart({ rubricState, labels }: RadarEvaluationChartProps) {
  const keys = ['academic', 'career', 'community', 'inquiry', 'attitude', 'growth'];
  
  const data = labels.map((label, index) => {
    const key = keys[index] || keys[0];
    const grade = rubricState[key] || 'B';
    return {
      subject: label,
      A: mapGradeToValue[grade],
      fullMark: 4,
    };
  });

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 4]} tickCount={5} />
          <Radar name="??웾(泥댄뿕)" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}


