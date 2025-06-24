import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis } from 'recharts';
import { AnomalyDetectionResult } from '../types';

interface TrafficChartProps {
  results: AnomalyDetectionResult[];
  featureX: string | null;
  featureY: string | null;
}

interface ChartDataPoint {
    x: number;
    y: number;
    z: number; 
    isAnomaly: boolean;
    cluster?: number;
    original: AnomalyDetectionResult;
}

const ANOMALY_COLOR = '#fafafa';   // zinc-50 (white) for high contrast anomalies
const NORMAL_COLOR = '#a1a1aa'; // zinc-400 (medium gray) for normal points

export const TrafficChart: React.FC<TrafficChartProps> = ({ results, featureX, featureY }) => {
  if (!results || results.length === 0 || !featureX || !featureY) {
    return <p className="text-zinc-400">Not enough data or features selected for chart.</p>;
  }

  const chartData: ChartDataPoint[] = results.map(r => ({
    x: Number(r[featureX]) || 0,
    y: Number(r[featureY]) || 0,
    z: r.isAnomaly ? 70 : 40, // Make anomalies slightly larger if ZAxis is used for size
    isAnomaly: r.isAnomaly,
    cluster: r.cluster,
    original: r,
  })).filter(p => !isNaN(p.x) && !isNaN(p.y));


  if (chartData.length === 0) {
    return <p className="text-zinc-400">Selected features do not contain valid numeric data for charting.</p>;
  }

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data: ChartDataPoint = payload[0].payload;
      // Tooltip styles are now primarily handled by global CSS in index.html
      return (
        <div className="p-3"> 
          <p className="font-semibold text-base mb-1">{data.isAnomaly ? 'Anomaly Detected' : 'Normal Traffic'}</p>
          <p className="text-sm">{`${featureX}: ${data.x.toLocaleString()}`}</p>
          <p className="text-sm">{`${featureY}: ${data.y.toLocaleString()}`}</p>
          {data.cluster !== undefined && <p className="text-sm">{`Cluster: ${data.cluster}`}</p>}
          {data.original.distanceToCentroid !== undefined && <p className="text-sm">{`Distance: ${data.original.distanceToCentroid.toFixed(2)}`}</p>}
        </div>
      );
    }
    return null;
  };
  
  const axisTickColor = '#a1a1aa'; // zinc-400
  const axisLabelColor = '#d4d4d8'; // zinc-300
  const gridStrokeColor = '#3f3f46'; // zinc-700
  const legendColor = '#d4d4d8'; // zinc-300

  return (
    <div className="w-full h-96 bg-zinc-800/90 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-zinc-700">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
          <XAxis 
            type="number" 
            dataKey="x" 
            name={featureX} 
            stroke={axisTickColor}
            tick={{ fill: axisTickColor, fontSize: 12 }}
            label={{ value: featureX, position: 'insideBottomRight', offset: -10, fill: axisLabelColor, fontSize: 14 }}
            tickFormatter={(tick) => tick.toLocaleString()}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name={featureY} 
            stroke={axisTickColor}
            tick={{ fill: axisTickColor, fontSize: 12 }}
            label={{ value: featureY, angle: -90, position: 'insideLeft', fill: axisLabelColor, dy: 60, dx:-5, fontSize: 14 }}
            tickFormatter={(tick) => tick.toLocaleString()}
          />
          <ZAxis type="number" dataKey="z" range={[30, 120]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#52525b' /* zinc-600 */ }} />
          <Legend wrapperStyle={{ color: legendColor, paddingTop: '10px' }} />
          <Scatter name="Normal" data={chartData.filter(d => !d.isAnomaly)} fill={NORMAL_COLOR} shape="circle" />
          <Scatter name="Anomaly" data={chartData.filter(d => d.isAnomaly)} fill={ANOMALY_COLOR} shape="triangle" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};