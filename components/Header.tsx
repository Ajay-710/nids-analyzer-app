import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full max-w-7xl mx-auto py-6 text-center">
      <h1 className="text-5xl font-bold text-white hover:text-zinc-100 transition-colors tracking-tight">
        Network Intrusion Detection Analyzer
      </h1>
      <p className="text-xl text-zinc-400 mt-3">
        Upload network traffic (CSV) to identify anomalies using K-Means clustering.
      </p>
    </header>
  );
};