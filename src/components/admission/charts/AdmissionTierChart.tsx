"use client";

import {
  ComposedChart,
  Bar,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ADMISSION_TIERS } from '../../../utils/admission/admissionLines';

interface AdmissionTierChartProps {
  studentGpa: number | null;
}

function CustomTooltip({ active, payload, studentGpa }: { active?: boolean; payload?: Array<{ payload: unknown }>; studentGpa: number | null }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload as {
    color: string;
    name: string;
    univs: string;
    safe: number;
    match: number;
    reach: number;
  };
  return (
    <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h4 style={{ margin: '0 0 5px 0', color: data.color }}>{data.name}</h4>
      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{data.univs}</p>
      <hr style={{ margin: '5px 0', borderTop: '1px solid #eee' }} />
      <p style={{ margin: 0, fontSize: '13px' }}>안정컷 <strong>{data.safe.toFixed(2)}</strong></p>
      <p style={{ margin: 0, fontSize: '13px' }}>적정컷 <strong>{data.match.toFixed(2)}</strong></p>
      <p style={{ margin: 0, fontSize: '13px' }}>도전컷 <strong>{data.reach.toFixed(2)}</strong></p>
      {studentGpa != null && (
        <>
          <hr style={{ margin: '5px 0', borderTop: '1px solid #eee' }} />
          <p style={{ margin: 0, fontSize: '13px', color: '#ef4444', fontWeight: 'bold' }}>학생 성적: {studentGpa.toFixed(2)}</p>
        </>
      )}
    </div>
  );
}

export default function AdmissionTierChart({ studentGpa }: AdmissionTierChartProps) {
  const data = ADMISSION_TIERS.map((tier) => ({
    name: tier.name.split(' ')[0],
    univs: tier.universities.join(', '),
    safe: tier.safeGpa,
    match: tier.matchGpa,
    reach: tier.reachGpa,
    range: [tier.safeGpa, tier.reachGpa],
    color: tier.color,
    studentDot: studentGpa,
  }));

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid stroke="#f5f5f5" />
          <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 'bold' }} />
          <YAxis reversed={true} domain={[1.0, 4.0]} tickCount={7} tick={{ fontSize: 13 }} label={{ value: '학생 등급', angle: -90, position: 'insideLeft', offset: 0 }} />
          <Tooltip content={<CustomTooltip studentGpa={studentGpa} />} />
          <Legend />
          <Bar dataKey="range" name="지원 가능 구간 (안정~도전)" barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.4} />
            ))}
          </Bar>
          {studentGpa != null && <Scatter dataKey="studentDot" name="학생의 내신 위치" fill="#ef4444" shape="circle" />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
