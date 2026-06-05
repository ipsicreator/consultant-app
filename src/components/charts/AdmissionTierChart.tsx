
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
  Cell
} from 'recharts';
import { ADMISSION_TIERS } from '../../utils/admissionLines';

interface AdmissionTierChartProps {
  studentGpa: number | null;
}

export default function AdmissionTierChart({ studentGpa }: AdmissionTierChartProps) {
  // Format data for chart
  // We want to show a bar indicating the range from safeGpa to reachGpa
  // Since we want 1.0 to be at the top, we will invert the Y axis
  
  const data = ADMISSION_TIERS.map(tier => {
    return {
      name: tier.name.split(' ')[0], // e.g. "Sê·¸ë£¹"
      univs: tier.universities.join(', '),
      safe: tier.safeGpa,
      match: tier.matchGpa,
      reach: tier.reachGpa,
      // To draw a range bar from safe to reach, we can use a range bar [safe, reach]
      range: [tier.safeGpa, tier.reachGpa],
      color: tier.color,
      studentDot: studentGpa // Same for all, we'll plot it using a scatter
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h4 style={{ margin: '0 0 5px 0', color: data.color }}>{data.name}</h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{data.univs}</p>
          <hr style={{ margin: '5px 0', borderTop: '1px solid #eee' }} />
          <p style={{ margin: 0, fontSize: '13px' }}>?ˆì •ì»? <strong>{data.safe.toFixed(2)}</strong></p>
          <p style={{ margin: 0, fontSize: '13px' }}>?ì •ì»? <strong>{data.match.toFixed(2)}</strong></p>
          <p style={{ margin: 0, fontSize: '13px' }}>?í–¥ì»? <strong>{data.reach.toFixed(2)}</strong></p>
          {studentGpa && (
            <>
              <hr style={{ margin: '5px 0', borderTop: '1px solid #eee' }} />
              <p style={{ margin: 0, fontSize: '13px', color: '#ef4444', fontWeight: 'bold' }}>???±ì : {studentGpa.toFixed(2)}</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid stroke="#f5f5f5" />
          <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 'bold' }} />
          {/* Y Axis inverted because 1.0 is better than 5.0 */}
          <YAxis reversed={true} domain={[1.0, 4.0]} tickCount={7} tick={{ fontSize: 13 }} label={{ value: '?´ì‹  ?±ê¸‰', angle: -90, position: 'insideLeft', offset: 0 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Range bar representing the safe-reach gap */}
          <Bar dataKey="range" name="ì§€??ê°€??êµ¬ê°„ (?ˆì •~?í–¥)" barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.4} />
            ))}
          </Bar>

          {/* Student's GPA across all columns to show a horizontal line of dots */}
          {studentGpa && (
            <Scatter dataKey="studentDot" name="?˜ì˜ ?´ì‹  ?„ì¹˜" fill="#ef4444" shape="circle" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
