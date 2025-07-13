
/**
 * Enhanced column mapping utility with fuzzy matching and confidence scoring
 * Intelligently maps various column name formats to standardized names
 */

export interface ColumnMapping {
  standardName: string;
  originalName: string;
  confidence: number;
  variations: string[];
  description: string;
}

export interface MappingResult {
  mappings: Record<string, ColumnMapping>;
  unmappedColumns: string[];
  confidence: number;
  suggestions: string[];
}

export class EnhancedColumnMapper {
  private static readonly COLUMN_DEFINITIONS = {
    date: {
      variations: [
        'Date', 'DATE', 'date', 'timestamp', 'Timestamp', 'TIME', 'time', 
        'trading_date', 'TRADING_DATE', 'trade_date', 'TRADE_DATE',
        'dt', 'DT', 'day', 'Day', 'DAY'
      ],
      description: 'Trading date for the stock data',
      required: true,
      weight: 1.0
    },
    series: {
      variations: [
        'series', 'Series', 'SERIES', 'symbol', 'Symbol', 'SYMBOL', 
        'ticker', 'Ticker', 'TICKER', 'market_segment', 'MARKET_SEGMENT',
        'seg', 'SEG', 'segment', 'Segment', 'SEGMENT'
      ],
      description: 'Market segment code (EQ=Equity, BE=Book Entry, etc.)',
      required: false,
      weight: 0.6
    },
    open: {
      variations: [
        'OPEN', 'open', 'Open', 'opening', 'Opening', 'OPENING',
        'open_price', 'OPEN_PRICE', 'openPrice', 'OpenPrice',
        'o', 'O'
      ],
      description: 'Opening price - first traded price of the day',
      required: true,
      weight: 0.9
    },
    high: {
      variations: [
        'HIGH', 'high', 'High', 'maximum', 'max', 'Max', 'MAX',
        'day_high', 'DAY_HIGH', 'dayHigh', 'DayHigh',
        'h', 'H', 'peak', 'Peak', 'PEAK'
      ],
      description: 'Highest price reached during trading day',
      required: true,
      weight: 0.9
    },
    low: {
      variations: [
        'LOW', 'low', 'Low', 'minimum', 'min', 'Min', 'MIN',
        'day_low', 'DAY_LOW', 'dayLow', 'DayLow',
        'l', 'L', 'bottom', 'Bottom', 'BOTTOM'
      ],
      description: 'Lowest price reached during trading day',
      required: true,
      weight: 0.9
    },
    close: {
      variations: [
        'close', 'Close', 'CLOSE', 'closing', 'Closing', 'CLOSING',
        'closing_price', 'CLOSING_PRICE', 'closingPrice', 'ClosingPrice',
        'c', 'C', 'end', 'End', 'END'
      ],
      description: 'Final closing price when market closed',
      required: true,
      weight: 1.0
    },
    prevClose: {
      variations: [
        'PREV. CLOSE', 'PREV CLOSE', 'prev close', 'previous close', 
        'prevclose', 'prev_close', 'previous_close', 'PREVIOUS_CLOSE',
        'prevClose', 'PrevClose', 'previousClose', 'PreviousClose',
        'last_close', 'LAST_CLOSE'
      ],
      description: 'Previous day closing price for return calculations',
      required: false,
      weight: 0.7
    },
    ltp: {
      variations: [
        'ltp', 'LTP', 'Ltp', 'last_price', 'LAST_PRICE', 'lastPrice',
        'last_traded_price', 'LAST_TRADED_PRICE', 'lastTradedPrice',
        'current', 'Current', 'CURRENT', 'latest', 'Latest', 'LATEST'
      ],
      description: 'Last Traded Price - most recent trading price',
      required: false,
      weight: 0.8
    },
    vwap: {
      variations: [
        'vwap', 'VWAP', 'Vwap', 'weighted average', 'avg price', 'avgPrice',
        'volume_weighted_avg', 'VOLUME_WEIGHTED_AVG', 'volumeWeightedAvg',
        'wap', 'WAP', 'weighted_avg', 'WEIGHTED_AVG'
      ],
      description: 'Volume Weighted Average Price - more accurate than simple average',
      required: false,
      weight: 0.6
    },
    volume: {
      variations: [
        'VOLUME', 'volume', 'Volume', 'vol', 'Vol', 'VOL',
        'quantity', 'Quantity', 'QUANTITY', 'qty', 'Qty', 'QTY',
        'shares_traded', 'SHARES_TRADED', 'sharesTrade', 'SharesTraded',
        'units', 'Units', 'UNITS'
      ],
      description: 'Total number of shares traded',
      required: true,
      weight: 0.9
    },
    value: {
      variations: [
        'VALUE', 'value', 'Value', 'turnover', 'Turnover', 'TURNOVER',
        'amount', 'Amount', 'AMOUNT', 'total_value', 'TOTAL_VALUE',
        'totalValue', 'TotalValue', 'worth', 'Worth', 'WORTH'
      ],
      description: 'Total turnover (Volume × Price) in currency',
      required: false,
      weight: 0.7
    },
    trades: {
      variations: [
        'No of trades', 'NO OF TRADES', 'trades', 'trade count', 'tradeCount',
        'transactions', 'no_of_trades', 'trade_count', 'TRADE_COUNT',
        'Number of trades', 'NUMBER OF TRADES', 'numberOfTrades',
        'tx', 'TX', 'trans', 'Trans', 'TRANS'
      ],
      description: 'Total number of buy/sell transactions executed',
      required: false,
      weight: 0.6
    },
    fiftyTwoWeekHigh: {
      variations: [
        '52W H', '52W_H', '52w high', '52 week high', '52WeekHigh',
        'yearly high', '52_week_high', '52WH', '52W HIGH',
        'year_high', 'YEAR_HIGH', 'yearHigh', 'YearHigh'
      ],
      description: '52-week high - highest price in past year',
      required: false,
      weight: 0.5
    },
    fiftyTwoWeekLow: {
      variations: [
        '52W L', '52W_L', '52w low', '52 week low', '52WeekLow',
        'yearly low', '52_week_low', '52WL', '52W LOW',
        'year_low', 'YEAR_LOW', 'yearLow', 'YearLow'
      ],
      description: '52-week low - lowest price in past year',
      required: false,
      weight: 0.5
    }
  };

  static mapColumns(headers: string[]): MappingResult {
    console.log('🎯 Starting enhanced column mapping for headers:', headers);
    
    const mappings: Record<string, ColumnMapping> = {};
    const unmappedColumns: string[] = [];
    const suggestions: string[] = [];
    let totalConfidence = 0;
    let mappedCount = 0;

    // Map each standard column
    for (const [standardName, definition] of Object.entries(this.COLUMN_DEFINITIONS)) {
      const bestMatch = this.findBestMatch(headers, definition.variations, standardName);
      
      if (bestMatch) {
        mappings[standardName] = {
          standardName,
          originalName: bestMatch.header,
          confidence: bestMatch.confidence,
          variations: definition.variations,
          description: definition.description
        };
        
        totalConfidence += bestMatch.confidence * definition.weight;
        mappedCount++;
        
        console.log(`✅ Mapped "${bestMatch.header}" -> ${standardName} (confidence: ${bestMatch.confidence.toFixed(2)})`);
      } else if (definition.required) {
        console.log(`❌ Required column "${standardName}" not found`);
        suggestions.push(`Missing required column: ${standardName}. Expected variations: ${definition.variations.slice(0, 3).join(', ')}`);
      }
    }

    // Identify unmapped columns
    const mappedHeaders = Object.values(mappings).map(m => m.originalName);
    unmappedColumns.push(...headers.filter(h => !mappedHeaders.includes(h)));

    if (unmappedColumns.length > 0) {
      console.log('📋 Unmapped columns:', unmappedColumns);
      // Suggest possible mappings for unmapped columns
      for (const unmapped of unmappedColumns) {
        const suggestion = this.suggestMapping(unmapped);
        if (suggestion) {
          suggestions.push(`"${unmapped}" might be "${suggestion}"`);
        }
      }
    }

    const overallConfidence = mappedCount > 0 ? totalConfidence / mappedCount : 0;

    return {
      mappings,
      unmappedColumns,
      confidence: overallConfidence,
      suggestions
    };
  }

  private static findBestMatch(headers: string[], variations: string[], standardName: string): { header: string; confidence: number } | null {
    let bestMatch: { header: string; confidence: number } | null = null;

    for (const header of headers) {
      for (const variation of variations) {
        const confidence = this.calculateSimilarity(header, variation);
        
        if (confidence > 0.7 && (!bestMatch || confidence > bestMatch.confidence)) {
          bestMatch = { header, confidence };
        }
      }
    }

    return bestMatch;
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    // Exact match (case-insensitive)
    if (str1.toLowerCase().trim() === str2.toLowerCase().trim()) {
      return 1.0;
    }

    // Contains match
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.9;
    }

    // Fuzzy matching using Levenshtein-like approach
    return this.levenshteinSimilarity(s1, s2);
  }

  private static levenshteinSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    
    return maxLength > 0 ? 1 - (distance / maxLength) : 0;
  }

  private static suggestMapping(unmappedColumn: string): string | null {
    let bestSuggestion: { name: string; confidence: number } | null = null;

    for (const [standardName, definition] of Object.entries(this.COLUMN_DEFINITIONS)) {
      for (const variation of definition.variations) {
        const confidence = this.calculateSimilarity(unmappedColumn, variation);
        
        if (confidence > 0.5 && (!bestSuggestion || confidence > bestSuggestion.confidence)) {
          bestSuggestion = { name: standardName, confidence };
        }
      }
    }

    return bestSuggestion && bestSuggestion.confidence > 0.6 ? bestSuggestion.name : null;
  }

  static validateMappings(mappings: Record<string, ColumnMapping>): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const requiredColumns = Object.entries(this.COLUMN_DEFINITIONS)
      .filter(([_, def]) => def.required)
      .map(([name, _]) => name);

    // Check required columns
    for (const required of requiredColumns) {
      if (!mappings[required]) {
        issues.push(`Missing required column: ${required}`);
      } else if (mappings[required].confidence < 0.6) {
        issues.push(`Low confidence mapping for required column: ${required} (${mappings[required].confidence.toFixed(2)})`);
      }
    }

    // Check for duplicate mappings
    const originalNames = Object.values(mappings).map(m => m.originalName);
    const duplicates = originalNames.filter((name, index) => originalNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      issues.push(`Duplicate column mappings: ${duplicates.join(', ')}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
