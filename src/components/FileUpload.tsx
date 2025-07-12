import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Papa from 'papaparse';

const requiredColumns = [
  'Date', 'series', 'OPEN', 'HIGH', 'LOW', 'PREV. CLOSE', 
  'ltp', 'close', 'vwap', '52W H', '52W L', 'VOLUME', 
  'VALUE', 'No of trades'
];

interface CSVRow {
  Date: string;
  series: string;
  OPEN: string;
  HIGH: string;
  LOW: string;
  'PREV. CLOSE': string;
  ltp: string;
  close: string;
  vwap: string;
  '52W H': string;
  '52W L': string;
  VOLUME: string;
  VALUE: string;
  'No of trades': string;
  [key: string]: string;
}

interface FileUploadProps {
  onFileUpload: (data: CSVRow[]) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateCSV = (data: CSVRow[]) => {
    if (!data || data.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = Object.keys(data[0]);
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Validate data types
    for (let i = 0; i < Math.min(data.length, 5); i++) {
      const row = data[i];
      
      // Check if numeric fields are valid
      const numericFields = ['OPEN', 'HIGH', 'LOW', 'close', 'VOLUME'];
      for (const field of numericFields) {
        if (isNaN(parseFloat(row[field]))) {
          throw new Error(`Invalid numeric value in ${field} at row ${i + 1}`);
        }
      }

      // Check date format
      if (!Date.parse(row.Date)) {
        throw new Error(`Invalid date format at row ${i + 1}`);
      }
    }

    if (data.length < 20) {
      throw new Error('Insufficient data. Please provide at least 20 rows for accurate predictions.');
    }

    return true;
  };

  const handleFileUpload = (file: File | null) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setError('');
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const csvData = results.data as CSVRow[];
          validateCSV(csvData);
          
          // Sort by date
          const sortedData = csvData.sort((a: CSVRow, b: CSVRow) => 
            new Date(a.Date).getTime() - new Date(b.Date).getTime()
          );

          onFileUpload(sortedData);
        } catch (err) {
          setError((err as Error).message);
          setFileName('');
        }
      },
      error: (error) => {
        setError('Failed to parse CSV file: ' + error.message);
        setFileName('');
      }
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className={`h-12 w-12 mx-auto mb-4 ${
          isDragOver ? 'text-blue-500' : 'text-gray-400'
        }`} />
        
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragOver ? 'Drop your CSV file here' : 'Upload Stock Data CSV'}
        </p>
        
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop your file here, or click to browse
        </p>
        
        <Button variant="outline" disabled={disabled}>
          Choose File
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {fileName && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              {fileName}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Required columns:</strong></p>
        <p className="font-mono text-xs">
          Date, series, OPEN, HIGH, LOW, PREV. CLOSE, ltp, close, vwap, 52W H, 52W L, VOLUME, VALUE, No of trades
        </p>
      </div>
    </div>
  );
};

export default FileUpload;
