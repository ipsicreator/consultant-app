
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EVALUATION_TERMS, REF_AVG } from '../../utils/evaluationLogic';

interface GradeTrendChartProps {
  studentTrend: (number | null)[];
}

export default function GradeTrendChart({ studentTrend }: GradeTrendChartProps) {
  const data = EVALUATION_TERMS.map((term, index) => {
    return {
      name: term,
      student: studentTrend[index] ?? null,
      refAvg: REF_AVG[index]
    };
  });

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis reversed domain={[1, 6]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="student" name="?�생(조합)" stroke="#8884d8" strokeWidth={3} connectNulls />
          <Line type="monotone" dataKey="refAvg" name="?�사집단" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
