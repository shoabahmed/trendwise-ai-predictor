
/**
 * Enhanced number parsing utility for financial data
 * Handles various number formats and provides validation
 */

export interface ParsedNumber {
  value: number;
  isValid: boolean;
  confidence: number;
  originalValue: any;
  formatted: string;
}

export class EnhancedNumberParser {
  private static readonly CURRENCY_SYMBOLS = ['₹', '$', '€', '£', '¥', '₽'];
  private static readonly NUMBER_PATTERNS = [
    // Standard decimal with commas (1,234.56)
    { regex: /^[\₹\$€£¥₽]?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)$/, confidence: 0.9 },
    // Indian numbering (1,23,456.78)
    { regex: /^[\₹\$€£¥₽]?\s*([0-9]{1,2}(?:,[0-9]{2})*(?:,[0-9]{3})?(?:\.[0-9]+)?)$/, confidence: 0.85 },
    // Scientific notation (1.23E+5)
    { regex: /^[\₹\$€£¥₽]?\s*([0-9]+\.?[0-9]*[eE][+-]?[0-9]+)$/, confidence: 0.8 },
    // Simple decimal (1234.56)
    { regex: /^[\₹\$€£¥₽]?\s*([0-9]+\.?[0-9]*)$/, confidence: 0.7 },
  ];

  static parseNumber(value: any, context: 'price' | 'volume' | 'percentage' = 'price'): ParsedNumber {
    if (value === null || value === undefined || value === '') {
      return this.createResult(0, false, 0, value, '0.00');
    }

    // Already a number
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        return this.createResult(0, false, 0, value, '0.00');
      }
      return this.createResult(value, true, 1.0, value, this.formatNumber(value, context));
    }

    // String processing
    if (typeof value === 'string') {
      const cleanValue = value.toString().trim();
      console.log(`🔢 Parsing number: "${cleanValue}" (context: ${context})`);

      // Remove currency symbols and spaces
      let processedValue = cleanValue;
      for (const symbol of this.CURRENCY_SYMBOLS) {
        processedValue = processedValue.replace(new RegExp(`\\${symbol}`, 'g'), '');
      }
      processedValue = processedValue.trim();

      // Try each pattern
      for (const pattern of this.NUMBER_PATTERNS) {
        const match = processedValue.match(pattern.regex);
        if (match) {
          const numStr = match[1].replace(/,/g, '');
          const parsed = parseFloat(numStr);
          
          if (!isNaN(parsed) && isFinite(parsed)) {
            const validated = this.validateNumber(parsed, context);
            console.log(`✅ Parsed "${cleanValue}" -> ${parsed} (confidence: ${pattern.confidence * validated.confidence})`);
            
            return this.createResult(
              parsed,
              validated.isValid,
              pattern.confidence * validated.confidence,
              value,
              this.formatNumber(parsed, context)
            );
          }
        }
      }
    }

    // Fallback: try direct parseFloat
    const fallback = parseFloat(value.toString());
    if (!isNaN(fallback) && isFinite(fallback)) {
      const validated = this.validateNumber(fallback, context);
      console.log(`⚠️ Fallback parsing "${value}" -> ${fallback}`);
      
      return this.createResult(
        fallback,
        validated.isValid,
        0.3 * validated.confidence,
        value,
        this.formatNumber(fallback, context)
      );
    }

    console.warn(`❌ Could not parse number: "${value}"`);
    return this.createResult(0, false, 0, value, '0.00');
  }

  private static createResult(value: number, isValid: boolean, confidence: number, originalValue: any, formatted: string): ParsedNumber {
    return { value, isValid, confidence, originalValue, formatted };
  }

  private static validateNumber(num: number, context: 'price' | 'volume' | 'percentage'): { isValid: boolean; confidence: number } {
    switch (context) {
      case 'price':
        // Stock prices should be positive and reasonable
        if (num < 0) return { isValid: false, confidence: 0 };
        if (num > 100000) return { isValid: true, confidence: 0.7 }; // High but possible
        if (num < 0.01) return { isValid: true, confidence: 0.6 }; // Penny stocks
        return { isValid: true, confidence: 0.9 };

      case 'volume':
        // Volume should be positive integer
        if (num < 0) return { isValid: false, confidence: 0 };
        if (num !== Math.floor(num)) return { isValid: true, confidence: 0.7 }; // Fractional volume
        if (num > 1e10) return { isValid: true, confidence: 0.6 }; // Very high volume
        return { isValid: true, confidence: 0.9 };

      case 'percentage':
        // Percentages should be reasonable for stock returns
        if (Math.abs(num) > 50) return { isValid: true, confidence: 0.5 }; // Extreme moves
        if (Math.abs(num) > 20) return { isValid: true, confidence: 0.7 }; // Large moves
        return { isValid: true, confidence: 0.9 };

      default:
        return { isValid: true, confidence: 0.8 };
    }
  }

  private static formatNumber(num: number, context: 'price' | 'volume' | 'percentage'): string {
    switch (context) {
      case 'price':
        return num.toFixed(2);
      case 'volume':
        return Math.floor(num).toLocaleString();
      case 'percentage':
        return num.toFixed(2) + '%';
      default:
        return num.toString();
    }
  }

  static calculateStatistics(numbers: ParsedNumber[]): {
    mean: number;
    median: number;
    stdDev: number;
    outliers: ParsedNumber[];
    confidence: number;
  } {
    const validNumbers = numbers.filter(n => n.isValid && isFinite(n.value));
    if (validNumbers.length === 0) {
      return { mean: 0, median: 0, stdDev: 0, outliers: [], confidence: 0 };
    }

    const values = validNumbers.map(n => n.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];

    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect outliers using IQR method
    const q1Index = Math.floor(sortedValues.length * 0.25);
    const q3Index = Math.floor(sortedValues.length * 0.75);
    const q1 = sortedValues[q1Index];
    const q3 = sortedValues[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = validNumbers.filter(n => n.value < lowerBound || n.value > upperBound);

    // Overall confidence based on data quality
    const avgConfidence = validNumbers.reduce((acc, n) => acc + n.confidence, 0) / validNumbers.length;
    const outlierPenalty = Math.min(outliers.length / validNumbers.length, 0.3);
    const confidence = Math.max(avgConfidence - outlierPenalty, 0.1);

    return { mean, median, stdDev, outliers, confidence };
  }
}
