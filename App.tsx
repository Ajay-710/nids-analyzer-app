import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { LoadingSpinner } from './components/LoadingSpinner';
import { TrafficChart } from './components/TrafficChart';
import { detectAnomaliesWithKMeans } from './services/anomalyDetector';
import { AnomalyDetectionResult, NetworkDataRow } from './types';
import { DEFAULT_NUMERIC_FEATURES_FOR_ANALYSIS } from './constants';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<NetworkDataRow[] | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnomalyDetectionResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [availableNumericFeatures, setAvailableNumericFeatures] = useState<string[]>([]);
  const [selectedFeaturesForAnalysis, setSelectedFeaturesForAnalysis] = useState<string[]>(DEFAULT_NUMERIC_FEATURES_FOR_ANALYSIS);
  const [featureX, setFeatureX] = useState<string | null>(null);
  const [featureY, setFeatureY] = useState<string | null>(null);

  const resetState = () => {
    setRawData(null);
    setAnalysisResults(null);
    setError(null);
    setAvailableNumericFeatures([]);
    setSelectedFeaturesForAnalysis(DEFAULT_NUMERIC_FEATURES_FOR_ANALYSIS);
    setFeatureX(null);
    setFeatureY(null);
  };

  const handleDataUploaded = useCallback((data: NetworkDataRow[], headers: string[]) => {
    resetState();
    setRawData(data);
    
    const numericFeatures = headers.filter(header => 
      data.length > 0 && data.some(row => typeof row[header] === 'number' || !isNaN(parseFloat(row[header])))
    );
    setAvailableNumericFeatures(numericFeatures);

    const defaultAnalysisFeatures = DEFAULT_NUMERIC_FEATURES_FOR_ANALYSIS.filter(f => numericFeatures.includes(f));
    setSelectedFeaturesForAnalysis(defaultAnalysisFeatures.length > 1 ? defaultAnalysisFeatures : numericFeatures.slice(0, 2));

    if (numericFeatures.length > 0) {
      setFeatureX(numericFeatures[0]);
    }
    if (numericFeatures.length > 1) {
      setFeatureY(numericFeatures[1]);
    } else if (numericFeatures.length === 1) {
      setFeatureY(numericFeatures[0]); 
    }
    setError(null);
  }, []);

  const handleAnalyzeData = useCallback(async () => {
    if (!rawData || selectedFeaturesForAnalysis.length < 1) {
      setError("No data or not enough features selected for analysis. Please select at least one numeric feature.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      const results = detectAnomaliesWithKMeans(rawData, selectedFeaturesForAnalysis);
      setAnalysisResults(results);
    } catch (e) {
      console.error("Analysis error:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred during analysis.");
      setAnalysisResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [rawData, selectedFeaturesForAnalysis]);

  useEffect(() => {
    if (availableNumericFeatures.length > 0 && (!featureX || !availableNumericFeatures.includes(featureX))) {
      setFeatureX(availableNumericFeatures[0]);
    }
    if (availableNumericFeatures.length > 0 && (!featureY || !availableNumericFeatures.includes(featureY))) {
        setFeatureY(availableNumericFeatures.length > 1 ? availableNumericFeatures[1] : availableNumericFeatures[0]);
    }
  }, [availableNumericFeatures, featureX, featureY]);


  const handleFeatureSelectionChange = (featureName: string, checked: boolean) => {
    setSelectedFeaturesForAnalysis(prev => {
        const newSelection = checked 
            ? [...prev, featureName]
            : prev.filter(f => f !== featureName);
        
        if (newSelection.length === 0 && availableNumericFeatures.length > 0) {
           return [availableNumericFeatures[0]]; 
        }
        return newSelection;
    });
  };

  const headingColor = "text-white"; 
  const inputRingFocus = "focus:border-zinc-400 focus:ring-zinc-400";
  
  const primaryButtonBg = "bg-zinc-700 hover:bg-zinc-600";
  const primaryButtonFocusRing = "focus:ring-zinc-500";

  const sectionStyle = "bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/70 p-6 rounded-lg shadow-xl animate-fadeInUp";

  return (
    <div className="min-h-screen flex flex-col items-center p-4 selection:bg-zinc-600 selection:text-zinc-100">
      <Header />
      <main className="container mx-auto mt-8 w-full max-w-7xl space-y-8">
        <div className={sectionStyle}>
          <h2 className={`text-2xl font-semibold ${headingColor} mb-4`}>1. Upload Network Traffic Data (CSV)</h2>
          <FileUpload onDataUploaded={handleDataUploaded} onError={setError} />
          {error && <p className="mt-4 text-red-300 bg-red-700/50 p-3 rounded-md border border-red-600 animate-shakeAndFadeIn">{error}</p>}
        </div>

        {rawData && (
          <div className={`${sectionStyle} space-y-6`} style={{animationDelay: '0.1s'}}>
            <div>
              <h2 className={`text-2xl font-semibold ${headingColor} mb-4`}>2. Configure Analysis</h2>
              <div className="mb-4">
                <label className="block text-lg font-medium text-zinc-200 mb-2">Select Features for K-Means Analysis:</label>
                {availableNumericFeatures.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableNumericFeatures.map(feature => (
                        <label key={feature} className="flex items-center space-x-2 p-3 bg-zinc-700/70 rounded-md hover:bg-zinc-600/80 transition-colors cursor-pointer border border-zinc-600">
                        <input
                            type="checkbox"
                            className={`form-checkbox h-5 w-5 text-zinc-400 bg-zinc-600 border-zinc-500 rounded focus:ring-offset-zinc-800 focus:ring-zinc-400 transition-transform duration-100 ease-in-out transform hover:scale-110 active:scale-95`}
                            checked={selectedFeaturesForAnalysis.includes(feature)}
                            onChange={(e) => handleFeatureSelectionChange(feature, e.target.checked)}
                        />
                        <span className="text-zinc-200">{feature}</span>
                        </label>
                    ))}
                    </div>
                ) : (
                    <p className="text-zinc-400">No numeric features found in the uploaded CSV or CSV not yet uploaded.</p>
                )}
              </div>
              <button
                onClick={handleAnalyzeData}
                disabled={isLoading || !rawData || selectedFeaturesForAnalysis.length === 0}
                className={`w-full sm:w-auto ${primaryButtonBg} disabled:bg-zinc-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md transition-all duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 ${primaryButtonFocusRing} focus:ring-offset-2 focus:ring-offset-zinc-800 hover:scale-[1.03] active:scale-[0.98]`}
              >
                {isLoading ? <LoadingSpinner size="sm" color="white" /> : 'Analyze Traffic'}
              </button>
            </div>
          
            {analysisResults && (
              <>
                <div className="mt-6 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
                    <h2 className={`text-2xl font-semibold ${headingColor} mb-4`}>3. Analysis Results</h2>
                    <DataTable results={analysisResults} />
                </div>
                
                {featureX && featureY && availableNumericFeatures.length > 0 && (
                <div className="mt-6 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
                    <h2 className={`text-2xl font-semibold ${headingColor} mb-4`}>4. Traffic Visualization</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="featureX" className="block text-sm font-medium text-zinc-300">X-Axis Feature:</label>
                        <select
                        id="featureX"
                        value={featureX || ''}
                        onChange={(e) => setFeatureX(e.target.value)}
                        className={`mt-1 block w-full p-2.5 bg-zinc-700 border border-zinc-600 rounded-md shadow-sm ${inputRingFocus} text-zinc-100 placeholder-zinc-400 focus:ring-offset-zinc-800`}
                        >
                        {availableNumericFeatures.map(f => <option key={`x-${f}`} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="featureY" className="block text-sm font-medium text-zinc-300">Y-Axis Feature:</label>
                        <select
                        id="featureY"
                        value={featureY || ''}
                        onChange={(e) => setFeatureY(e.target.value)}
                        className={`mt-1 block w-full p-2.5 bg-zinc-700 border border-zinc-600 rounded-md shadow-sm ${inputRingFocus} text-zinc-100 placeholder-zinc-400 focus:ring-offset-zinc-800`}
                        >
                        {availableNumericFeatures.map(f => <option key={`y-${f}`} value={f}>{f}</option>)}
                        </select>
                    </div>
                    </div>
                    <TrafficChart results={analysisResults} featureX={featureX} featureY={featureY} />
                </div>
                )}
              </>
            )}
          </div>
        )}
        {isLoading && !analysisResults && (
            <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeInUp">
                <LoadingSpinner text="Analyzing data..." color="zinc-300" textColor="text-zinc-200" />
            </div>
        )}
      </main>
      <footer className="w-full max-w-7xl mx-auto text-center py-8 mt-12 border-t border-zinc-700">
        <p className="text-zinc-500 text-sm">NIDS Analyzer &copy; {new Date().getFullYear()}. For demonstration purposes only.</p>
      </footer>
    </div>
  );
};

export default App;