import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';

interface NDVIChartProps {
  data: Array<{date: string, ndvi: number}>;
  baseline: number;
}

export default function NDVIChart({ data, baseline }: NDVIChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM dd')
  }));

  return (
    <div className="w-full h-64 bg-dark-800 p-4 rounded-xl border border-dark-700 shadow-md">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">NDVI Time Series</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="formattedDate" 
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#334155' }}
          />
          <YAxis 
            domain={[0, 1]} 
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#334155' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f1f5f9' }}
            itemStyle={{ color: '#10b981' }}
          />
          <ReferenceLine y={0.3} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Stress Threshold', fill: '#ef4444', fontSize: 12 }} />
          <ReferenceLine y={baseline} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Baseline Avg', fill: '#94a3b8', fontSize: 12 }} />
          
          <Line 
            type="monotone" 
            dataKey="ndvi" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#10b981', stroke: '#1e293b', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#10b981', stroke: '#1e293b', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
