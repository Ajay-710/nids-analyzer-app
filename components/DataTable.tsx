import React from 'react';
import { AnomalyDetectionResult } from '../types';

interface DataTableProps {
  results: AnomalyDetectionResult[];
}

export const DataTable: React.FC<DataTableProps> = ({ results }) => {
  if (!results || results.length === 0) {
    return <p className="text-zinc-400">No analysis results to display.</p>;
  }

  const headers = Object.keys(results[0]);
  const displayHeaders = headers.filter(h => h !== 'originalData' && h !== 'features');

  return (
    <div className="overflow-x-auto bg-zinc-800/90 backdrop-blur-sm shadow-lg rounded-lg border border-zinc-700">
      <table className="min-w-full text-sm text-left text-zinc-300">
        <thead className="text-xs text-zinc-100 uppercase bg-zinc-700/80">
          <tr>
            {displayHeaders.map(header => (
              <th key={header} scope="col" className="px-6 py-3 whitespace-nowrap font-semibold">
                {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-zinc-700
                ${row.isAnomaly ? 'bg-zinc-700/60 hover:bg-zinc-700/90' : 'hover:bg-zinc-700/50'} transition-colors duration-150`}
            >
              {displayHeaders.map(header => (
                <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-nowrap">
                  {header === 'isAnomaly' ? (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      row.isAnomaly 
                        ? 'bg-zinc-300 text-zinc-800 border border-zinc-400' 
                        : 'bg-zinc-600 text-zinc-200 border border-zinc-500'
                    }`}>
                      {row.isAnomaly ? 'Anomaly' : 'Normal'}
                    </span>
                  ) : typeof row[header] === 'number' ? (
                    (row[header] as number).toFixed(2)
                  ) : (
                    String(row[header] ?? '')
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};