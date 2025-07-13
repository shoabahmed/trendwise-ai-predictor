
/**
 * Enhanced date parsing utility for stock data
 * Handles multiple date formats commonly found in financial data
 */

export interface ParsedDate {
  date: Date;
  formatted: string;
  isValid: boolean;
  confidence: number;
}

export class EnhancedDateParser {
  private static readonly DATE_FORMATS = [
    // DD-MMM-YY format (most common in Indian stock data)
    { regex: /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/, type: 'DD-MMM-YY', confidence: 0.9 },
    // DD-MMM-YYYY format
    { regex: /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/, type: 'DD-MMM-YYYY', confidence: 0.95 },
    // YYYY-MM-DD format
    { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, type: 'YYYY-MM-DD', confidence: 0.85 },
    // DD/MM/YYYY format
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, type: 'DD/MM/YYYY', confidence: 0.7 },
    // MM/DD/YYYY format
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, type: 'MM/DD/YYYY', confidence: 0.6 },
  ];

  private static readonly MONTH_MAP: { [key: string]: number } = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
  };

  static parseDate(dateStr: string): ParsedDate {
    if (!dateStr || dateStr.trim() === '') {
      return {
        date: new Date(),
        formatted: new Date().toISOString().split('T')[0],
        isValid: false,
        confidence: 0
      };
    }

    const cleanDateStr = dateStr.toString().trim();
    console.log(`🗓️ Parsing date: "${cleanDateStr}"`);

    // Try each format with confidence scoring
    for (const format of this.DATE_FORMATS) {
      const match = cleanDateStr.match(format.regex);
      if (match) {
        const parsedDate = this.parseWithFormat(match, format.type);
        if (parsedDate.isValid) {
          console.log(`✅ Successfully parsed "${cleanDateStr}" as ${format.type} with confidence ${format.confidence}`);
          return {
            ...parsedDate,
            confidence: format.confidence
          };
        }
      }
    }

    // Fallback: try standard Date parsing
    const fallbackDate = new Date(cleanDateStr);
    if (!isNaN(fallbackDate.getTime())) {
      console.log(`⚠️ Fallback parsing for "${cleanDateStr}"`);
      return {
        date: fallbackDate,
        formatted: fallbackDate.toISOString().split('T')[0],
        isValid: true,
        confidence: 0.4
      };
    }

    // Complete failure - return current date with low confidence
    console.warn(`❌ Could not parse date: "${cleanDateStr}", using current date`);
    return {
      date: new Date(),
      formatted: new Date().toISOString().split('T')[0],
      isValid: false,
      confidence: 0
    };
  }

  private static parseWithFormat(match: RegExpMatchArray, type: string): ParsedDate {
    try {
      let day: number, month: number, year: number;

      switch (type) {
        case 'DD-MMM-YY':
          day = parseInt(match[1]);
          month = this.MONTH_MAP[match[2].toLowerCase()];
          year = parseInt(match[3]);
          year = year < 50 ? 2000 + year : 1900 + year; // Y2K handling
          break;

        case 'DD-MMM-YYYY':
          day = parseInt(match[1]);
          month = this.MONTH_MAP[match[2].toLowerCase()];
          year = parseInt(match[3]);
          break;

        case 'YYYY-MM-DD':
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1; // JavaScript months are 0-indexed
          day = parseInt(match[3]);
          break;

        case 'DD/MM/YYYY':
          day = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          year = parseInt(match[3]);
          break;

        case 'MM/DD/YYYY':
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
          year = parseInt(match[3]);
          break;

        default:
          throw new Error(`Unknown format: ${type}`);
      }

      if (month === undefined || month < 0 || month > 11) {
        throw new Error('Invalid month');
      }

      const parsedDate = new Date(year, month, day);
      
      // Validate the date makes sense
      if (parsedDate.getDate() !== day || parsedDate.getMonth() !== month || parsedDate.getFullYear() !== year) {
        throw new Error('Invalid date components');
      }

      // Check if date is reasonable for stock data (not too far in future/past)
      const now = new Date();
      const yearsDiff = Math.abs(now.getFullYear() - year);
      if (yearsDiff > 50) {
        throw new Error('Date too far from present');
      }

      return {
        date: parsedDate,
        formatted: parsedDate.toISOString().split('T')[0],
        isValid: true,
        confidence: 0.8
      };
    } catch (error) {
      return {
        date: new Date(),
        formatted: new Date().toISOString().split('T')[0],
        isValid: false,
        confidence: 0
      };
    }
  }

  static validateDateRange(dates: ParsedDate[]): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (dates.length === 0) {
      return { isValid: false, issues: ['No dates provided'] };
    }

    // Check for chronological order
    const sortedDates = [...dates].sort((a, b) => a.date.getTime() - b.date.getTime());
    const hasGaps = this.detectDateGaps(sortedDates);
    
    if (hasGaps.length > 0) {
      issues.push(`Date gaps detected: ${hasGaps.join(', ')}`);
    }

    // Check confidence levels
    const lowConfidenceDates = dates.filter(d => d.confidence < 0.5);
    if (lowConfidenceDates.length > 0) {
      issues.push(`${lowConfidenceDates.length} dates parsed with low confidence`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private static detectDateGaps(sortedDates: ParsedDate[]): string[] {
    const gaps: string[] = [];
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1].date;
      const currDate = sortedDates[i].date;
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Flag gaps larger than 5 days (excluding weekends)
      if (daysDiff > 7) {
        gaps.push(`${daysDiff} days between ${prevDate.toDateString()} and ${currDate.toDateString()}`);
      }
    }
    
    return gaps;
  }
}
