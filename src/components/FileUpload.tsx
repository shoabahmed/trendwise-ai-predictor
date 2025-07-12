import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Enhanced column mappings with detailed understanding
const columnMappings = {
  date: {
    variations: ['Date', 'DATE', 'date', 'timestamp', 'Timestamp', 'TIME', 'time', 'trading_date'],
    description: 'Trading date for the stock data'
  },
  series: {
    variations: ['series', 'Series', 'SERIES', 'symbol', 'Symbol', 'SYMBOL', 'ticker', 'Ticker', 'market_segment'],
    description: 'Market segment code (EQ=Equity, BE=Book Entry, etc.)'
  },
  open: {
    variations: ['OPEN', 'open', 'Open', 'opening', 'Opening', 'open_price'],
    description: 'Opening price - first traded price of the day'
  },
  high: {
    variations: ['HIGH', 'high', 'High', 'maximum', 'max', 'Max', 'day_high'],
    description: 'Highest price reached during trading day'
  },
  low: {
    variations: ['LOW', 'low', 'Low', 'minimum', 'min', 'Min', 'day_low'],
    description: 'Lowest price reached during trading day'
  },
  close: {
    variations: ['close', 'Close', 'CLOSE', 'closing', 'Closing', 'ltp', 'LTP', 'last_price'],
    description: 'Final closing price when market closed'
  },
  prevClose: {
    variations: ['PREV. CLOSE', 'prev close', 'previous close', 'prevclose', 'prev_close', 'previous_close'],
    description: 'Previous day closing price for return calculations'
  },
  vwap: {
    variations: ['vwap', 'VWAP', 'Vwap', 'weighted average', 'avg price', 'volume_weighted_avg'],
    description: 'Volume Weighted Average Price - more accurate than simple average'
  },
  volume: {
    variations: ['VOLUME', 'volume', 'Volume', 'vol', 'Vol', 'VOL', 'quantity', 'Quantity', 'shares_traded'],
    description: 'Total number of shares traded'
  },
  value: {
    variations: ['VALUE', 'value', 'Value', 'turnover', 'Turnover', 'amount', 'Amount', 'total_value'],
    description: 'Total turnover (Volume × Price) in currency'
  },
  trades: {
    variations: ['No of trades', 'trades', 'trade count', 'transactions', 'no_of_trades', 'trade_count'],
    description: 'Total number of buy/sell transactions executed'
  },
  fiftyTwoWeekHigh: {
    variations: ['52W H', '52w high', '52 week high', 'yearly high', '52_week_high'],
    description: '52-week high - highest price in past year'
  },
  fiftyTwoWeekLow: {
    variations: ['52W L', '52w low', '52 week low', 'yearly low', '52_week_low'],
    description: '52-week low - lowest price in past year'
  }
};

interface NormalizedCSVRow {
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
  onFileUpload: (data: NormalizedCSVRow[]) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [columnMappingInfo, setColumnMappingInfo] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSupportedFileTypes = () => ['.csv', '.txt', '.xlsx', '.xls', '.xlsm', '.xlsb', '.xltx'];

  const isFileTypeSupported = (fileName: string): boolean => {
    const extension = fileName.toLowerCase().split('.').pop();
    return getSupportedFileTypes().some(type => type.slice(1) === extension);
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: ''
          });
          
          if (jsonData.length < 2) {
            throw new Error('Excel file must have at least header and one data row');
          }
          
          // Convert array format to object format
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          const objectData = rows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          resolve(objectData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const readTextFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: file.name.toLowerCase().endsWith('.txt') ? '\t' : ',',
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error('Failed to parse text file: ' + results.errors[0].message));
          } else {
            resolve(results.data as any[]);
          }
        },
        error: (error) => reject(error)
      });
    });
  };

  const findBestColumnMatch = (headers: string[], targetColumn: any): string | null => {
    for (const variation of targetColumn.variations) {
      const match = headers.find(header => 
        header.toLowerCase().includes(variation.toLowerCase()) || 
        variation.toLowerCase().includes(header.toLowerCase())
      );
      if (match) return match;
    }
    return null;
  };

  const normalizeColumnNames = (data: any[]): { mappedData: any[], mappings: Record<string, string>, descriptions: Record<string, string> } => {
    if (data.length === 0) return { mappedData: [], mappings: {}, descriptions: {} };
    
    const headers = Object.keys(data[0]);
    const mappings: Record<string, string> = {};
    const descriptions: Record<string, string> = {};
    
    console.log('📊 Analyzing uploaded data columns:', headers);
    
    // Try to map each required column with enhanced understanding
    for (const [standardName, columnInfo] of Object.entries(columnMappings)) {
      const match = findBestColumnMatch(headers, columnInfo);
      if (match) {
        mappings[standardName] = match;
        descriptions[standardName] = columnInfo.description;
        console.log(`✅ Mapped "${match}" → ${standardName}: ${columnInfo.description}`);
      }
    }
    
    // Log unmapped columns for user awareness
    const unmappedColumns = headers.filter(header => 
      !Object.values(mappings).includes(header)
    );
    if (unmappedColumns.length > 0) {
      console.log('ℹ️ Unmapped columns (will use as-is):', unmappedColumns);
    }
    
    return { mappedData: data, mappings, descriptions };
  };

  const enhancedDataFilling = (data: any[], mappings: Record<string, string>): NormalizedCSVRow[] => {
    console.log('🔧 Applying AI-enhanced data filling with stock market intelligence...');
    
    return data.map((row, index) => {
      const normalizedRow: any = {};
      
      // Enhanced date handling
      normalizedRow.Date = row[mappings.date] || new Date(Date.now() - (data.length - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      normalizedRow.series = row[mappings.series] || 'EQ'; // Default to Equity
      
      // Get price data with market intelligence
      const open = parseFloat(row[mappings.open]) || 0;
      const high = parseFloat(row[mappings.high]) || 0;
      const low = parseFloat(row[mappings.low]) || 0;
      const close = parseFloat(row[mappings.close]) || 0;
      const prevClose = parseFloat(row[mappings.prevClose]) || 0;
      
      // Smart price reconstruction using market relationships
      if (close > 0) {
        // Use close as base price for calculations
        normalizedRow.close = close.toFixed(2);
        normalizedRow.ltp = close.toFixed(2);
        
        // Calculate realistic open if missing (typically 98-102% of previous close)
        if (open === 0) {
          const gap = (Math.random() - 0.5) * 0.04; // ±2% gap
          normalizedRow.OPEN = (close * (1 + gap)).toFixed(2);
        } else {
          normalizedRow.OPEN = open.toFixed(2);
        }
        
        // Calculate realistic high (must be >= max(open, close))
        const baseHigh = Math.max(parseFloat(normalizedRow.OPEN), close);
        if (high === 0 || high < baseHigh) {
          normalizedRow.HIGH = (baseHigh * (1 + Math.random() * 0.03)).toFixed(2); // Up to 3% above
        } else {
          normalizedRow.HIGH = high.toFixed(2);
        }
        
        // Calculate realistic low (must be <= min(open, close))
        const baseLow = Math.min(parseFloat(normalizedRow.OPEN), close);
        if (low === 0 || low > baseLow) {
          normalizedRow.LOW = (baseLow * (1 - Math.random() * 0.03)).toFixed(2); // Up to 3% below
        } else {
          normalizedRow.LOW = low.toFixed(2);
        }
      } else {
        // If no close price, use available data or generate realistic prices
        const basePrice = open || high || low || 100;
        normalizedRow.close = basePrice.toFixed(2);
        normalizedRow.ltp = basePrice.toFixed(2);
        normalizedRow.OPEN = (basePrice * (0.99 + Math.random() * 0.02)).toFixed(2);
        normalizedRow.HIGH = (basePrice * (1.01 + Math.random() * 0.02)).toFixed(2);
        normalizedRow.LOW = (basePrice * (0.97 + Math.random() * 0.02)).toFixed(2);
      }
      
      // Calculate VWAP using OHLC if not provided
      const currentHigh = parseFloat(normalizedRow.HIGH);
      const currentLow = parseFloat(normalizedRow.LOW);
      const currentClose = parseFloat(normalizedRow.close);
      const currentOpen = parseFloat(normalizedRow.OPEN);
      
      if (row[mappings.vwap]) {
        normalizedRow.vwap = parseFloat(row[mappings.vwap]).toFixed(2);
      } else {
        // Typical VWAP approximation: (H+L+C)/3 or (H+L+2C)/4
        normalizedRow.vwap = ((currentHigh + currentLow + currentClose * 2) / 4).toFixed(2);
      }
      
      // Previous close handling with market continuity
      if (index > 0 && mappings.prevClose) {
        normalizedRow['PREV. CLOSE'] = row[mappings.prevClose] || 
          parseFloat(data[index - 1][mappings.close] || normalizedRow.close).toFixed(2);
      } else {
        // For first row or missing data, estimate based on current price
        const estimatedPrevClose = prevClose || (currentClose * (0.98 + Math.random() * 0.04));
        normalizedRow['PREV. CLOSE'] = estimatedPrevClose.toFixed(2);
      }
      
      // Volume and VALUE with realistic market patterns
      let volume = parseFloat(row[mappings.volume]) || 0;
      if (volume === 0) {
        // Generate realistic volume based on price movement
        const priceChange = Math.abs(currentClose - parseFloat(normalizedRow['PREV. CLOSE']));
        const volatility = priceChange / parseFloat(normalizedRow['PREV. CLOSE']);
        // Higher volatility typically means higher volume
        volume = Math.floor((50000 + volatility * 500000) * (0.5 + Math.random()));
      }
      normalizedRow.VOLUME = volume.toString();
      
      // Calculate VALUE (Turnover)
      if (row[mappings.value]) {
        normalizedRow.VALUE = parseFloat(row[mappings.value]).toFixed(2);
      } else {
        // VALUE = Volume × Average Price (approximated by VWAP)
        normalizedRow.VALUE = (volume * parseFloat(normalizedRow.vwap)).toFixed(2);
      }
      
      // Number of trades estimation
      if (row[mappings.trades]) {
        normalizedRow['No of trades'] = row[mappings.trades];
      } else {
        // Typical lot size ranges, estimate trades from volume
        const avgTradeSize = 50 + Math.random() * 200; // 50-250 shares per trade
        normalizedRow['No of trades'] = Math.floor(volume / avgTradeSize).toString();
      }
      
      // 52-week high/low with market intelligence
      if (row[mappings.fiftyTwoWeekHigh]) {
        normalizedRow['52W H'] = parseFloat(row[mappings.fiftyTwoWeekHigh]).toFixed(2);
      } else {
        // Estimate: current price is typically 70-100% of 52W high
        const ratio = 0.7 + Math.random() * 0.3;
        normalizedRow['52W H'] = (currentClose / ratio).toFixed(2);
      }
      
      if (row[mappings.fiftyTwoWeekLow]) {
        normalizedRow['52W L'] = parseFloat(row[mappings.fiftyTwoWeekLow]).toFixed(2);
      } else {
        // Estimate: current price is typically 100-150% of 52W low
        const ratio = 1.0 + Math.random() * 0.5;
        normalizedRow['52W L'] = (currentClose / ratio).toFixed(2);
      }
      
      return normalizedRow as NormalizedCSVRow;
    });
  };

  const validateAndProcessData = async (file: File): Promise<NormalizedCSVRow[]> => {
    let data: any[];
    
    // Parse different file types
    if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
      data = await readTextFile(file);
    } else {
      // Excel files
      data = await readExcelFile(file);
    }

    if (!data || data.length === 0) {
      throw new Error('File is empty or contains no valid data');
    }

    console.log(`📁 Processing ${file.name} with ${data.length} rows`);
    console.log('📋 Original columns:', Object.keys(data[0]));
    
    const { mappedData, mappings, descriptions } = normalizeColumnNames(data);
    console.log('🎯 Column mappings found:', mappings);
    
    setColumnMappingInfo(descriptions);
    
    // Enhanced data processing with stock market intelligence
    const normalizedData = enhancedDataFilling(mappedData, mappings);
    
    // Sort by date for time series analysis
    const sortedData = normalizedData.sort((a, b) => 
      new Date(a.Date).getTime() - new Date(b.Date).getTime()
    );

    console.log('✅ AI-enhanced data sample:', {
      firstRow: sortedData[0],
      totalRows: sortedData.length,
      dateRange: {
        from: sortedData[0]?.Date,
        to: sortedData[sortedData.length - 1]?.Date
      }
    });
    
    if (sortedData.length < 5) {
      throw new Error('Insufficient data. Please provide at least 5 rows for meaningful analysis.');
    }

    return sortedData;
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    if (!isFileTypeSupported(file.name)) {
      setError(`Unsupported file type. Please upload: ${getSupportedFileTypes().join(', ')}`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // Increased to 50MB for Excel files
      setError('File size must be less than 50MB');
      return;
    }

    setError('');
    setFileName(file.name);
    setIsProcessing(true);

    try {
      const processedData = await validateAndProcessData(file);
      onFileUpload(processedData);
    } catch (err) {
      setError((err as Error).message);
      setFileName('');
      setColumnMappingInfo({});
    } finally {
      setIsProcessing(false);
    }
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
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length > 0) handleFileUpload(files[0]);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {isProcessing ? (
          <Bot className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-pulse" />
        ) : (
          <Upload className={`h-12 w-12 mx-auto mb-4 ${
            isDragOver ? 'text-blue-500' : 'text-gray-400'
          }`} />
        )}
        
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isProcessing ? 'AI Processing Your Data...' : 
           isDragOver ? 'Drop your file here' : 'Upload Stock Data'}
        </p>
        
        <p className="text-sm text-gray-500 mb-4">
          {isProcessing ? 'Understanding market data and filling gaps intelligently' :
           'Support for CSV, TXT, Excel (.xlsx, .xls, .xlsm, .xlsb, .xltx) - AI will enhance your data'}
        </p>
        
        <Button variant="outline" disabled={disabled || isProcessing}>
          {isProcessing ? 'Processing...' : 'Choose File'}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={getSupportedFileTypes().join(',')}
          onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {fileName && !isProcessing && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                <span className="font-medium">{fileName}</span> - AI enhanced with market intelligence
              </div>
              {Object.keys(columnMappingInfo).length > 0 && (
                <div className="text-xs text-gray-600 mt-2">
                  <p className="font-medium mb-1">📊 Detected stock data columns:</p>
                  {Object.entries(columnMappingInfo).map(([key, description]) => (
                    <p key={key} className="ml-2">• <span className="font-medium">{key}</span>: {description}</p>
                  ))}
                </div>
              )}
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

      <div className="text-xs text-gray-500 space-y-2">
        <div className="flex items-center space-x-2">
          <Bot className="h-4 w-4 text-blue-500" />
          <span><strong>AI-Powered Stock Analysis:</strong> Upload any format - Excel, CSV, TXT supported</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p><strong>Supported formats:</strong></p>
            <p>CSV, TXT, Excel (.xlsx, .xls, .xlsm, .xlsb, .xltx)</p>
          </div>
          <div>
            <p><strong>Intelligent data understanding:</strong></p>
            <p>OHLC, Volume, VWAP, 52W High/Low, Trades</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
