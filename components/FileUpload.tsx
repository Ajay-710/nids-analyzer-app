import React, { useCallback, useState, DragEvent } from 'react';
import { NetworkDataRow } from '../types';

interface FileUploadProps {
  onDataUploaded: (data: NetworkDataRow[], headers: string[]) => void;
  onError: (message: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataUploaded, onError }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      onError("No file selected.");
      setFileName(null);
      return;
    }

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        onError("Invalid file type. Please upload a CSV file.");
        setFileName(null);
        event.target.value = ''; // Reset file input
        return;
    }
    
    setFileName(file.name);
    onError(""); 

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
            throw new Error("CSV file must contain a header row and at least one data row.");
        }
        
        const headerRow = lines[0].split(',');
        const headers = headerRow.map(h => h.trim());
        
        const data: NetworkDataRow[] = lines.slice(1).map(line => {
          const values = line.split(',');
          const row: NetworkDataRow = {};
          headers.forEach((header, index) => {
            const value = values[index]?.trim();
            const numValue = parseFloat(value);
            row[header] = !isNaN(numValue) && isFinite(Number(value)) ? numValue : value;
          });
          return row;
        });
        onDataUploaded(data, headers);
      } catch (err) {
        console.error("Error parsing CSV:", err);
        onError(err instanceof Error ? err.message : "Failed to parse CSV file. Ensure it is correctly formatted.");
        setFileName(null);
      } finally {
        if(event.target) event.target.value = ''; 
      }
    };
    reader.onerror = () => {
        onError("Failed to read file.");
        setFileName(null);
        if(event.target) event.target.value = ''; 
    };
    reader.readAsText(file);
  }, [onDataUploaded, onError]);

  const handleDragEnter = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation(); 
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const syntheticEvent = {
        target: { files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(syntheticEvent);
    }
  };


  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-zinc-600 border-dashed rounded-lg cursor-pointer bg-zinc-700/60 hover:bg-zinc-700/80 transition-all duration-200 ease-in-out
                    ${isDragActive ? 'border-zinc-400 bg-zinc-700/90 dropzone-active-pulse' : 'hover:border-zinc-500'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className={`w-10 h-10 mb-3 ${isDragActive ? 'text-zinc-300' : 'text-zinc-400'} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          <p className="mb-2 text-sm text-zinc-400">
            <span className={`font-semibold ${isDragActive ? 'text-zinc-200' : 'text-zinc-300'}`}>Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-zinc-500">CSV files only</p>
          {fileName && <p className="text-xs text-green-400 mt-2">Selected: {fileName}</p>}
        </div>
        <input id="file-upload" type="file" className="hidden" accept=".csv,text/csv" onChange={handleFileChange} />
      </label>
    </div>
  );
};