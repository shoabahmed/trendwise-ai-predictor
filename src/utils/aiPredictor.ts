
/**
 * Enhanced AI prediction engine with multiple models and confidence scoring
 * Simulates real ML models with improved accuracy and ensemble techniques
 */

export interface PredictionModel {
  name: string;
  version: string;
  weight: number;
  confidence: number;
}

export interface MarketIndicators {
  rsi: number;
  macd: number;
  bollinger: { upper: number; lower: number; middle: number };
  movingAverages: { sma20: number; sma50: number; ema12: number; ema26: number };
  volatility: number;
  momentum: number;
}

export interface EnhancedPrediction {
  targetPrice: number;
  priceRange: { low: number; high: number };
  confidence: number;
  probability: { bullish: number; bearish: number; neutral: number };
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  reasoning: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  timeHorizon: string;
  marketIndicators: MarketIndicators;
  modelBreakdown: {
    ensemble: number;
    individual: Record<string, { prediction: number; confidence: number; weight: number }>;
  };
  features: Record<string, number>;
  anomalyScore: number;
}

export class EnhancedAIPredictor {
  private static readonly MODELS: PredictionModel[] = [
    { name: 'LightGBM', version: '3.3.5', weight: 0.35, confidence: 0.82 },
    { name: 'XGBoost', version: '1.7.4', weight: 0.35, confidence: 0.78 },
    { name: 'CatBoost', version: '1.2.0', weight: 0.20, confidence: 0.75 },
    { name: 'Neural Network', version: 'custom', weight: 0.10, confidence: 0.70 }
  ];

  static async generatePrediction(data: any[], targetDate: string = 'tomorrow'): Promise<EnhancedPrediction> {
    console.log('🤖 Generating enhanced AI prediction...');
    
    if (data.length < 10) {
      throw new Error('Insufficient data for reliable prediction. Need at least 10 data points.');
    }

    // Extract and analyze historical data
    const prices = this.extractPrices(data);
    const volumes = this.extractVolumes(data);
    const features = this.engineerFeatures(prices, volumes);
    const indicators = this.calculateTechnicalIndicators(prices, volumes);
    
    // Generate individual model predictions
    const modelPredictions = this.generateModelPredictions(prices, features, indicators);
    
    // Ensemble prediction
    const ensemblePrediction = this.combineModelPredictions(modelPredictions);
    
    // Risk and probability assessment
    const riskAssessment = this.assessRisk(prices, indicators, ensemblePrediction);
    const probabilities = this.calculateProbabilities(indicators, ensemblePrediction, prices);
    
    // Generate recommendation and reasoning
    const recommendation = this.generateRecommendation(indicators, probabilities, riskAssessment);
    const reasoning = this.generateReasoning(indicators, probabilities, recommendation, prices);
    
    // Anomaly detection
    const anomalyScore = this.detectAnomalies(prices, volumes, features);
    
    console.log('✅ Enhanced prediction generated successfully');
    
    return {
      targetPrice: ensemblePrediction.price,
      priceRange: {
        low: ensemblePrediction.price * (1 - ensemblePrediction.uncertainty),
        high: ensemblePrediction.price * (1 + ensemblePrediction.uncertainty)
      },
      confidence: ensemblePrediction.confidence,
      probability: probabilities,
      recommendation: recommendation.action,
      reasoning,
      riskLevel: riskAssessment.level,
      timeHorizon: targetDate === 'tomorrow' ? '1 Day' : targetDate,
      marketIndicators: indicators,
      modelBreakdown: {
        ensemble: ensemblePrediction.price,
        individual: modelPredictions
      },
      features,
      anomalyScore
    };
  }

  private static extractPrices(data: any[]): number[] {
    return data.map(row => {
      const close = parseFloat(row.close || row.Close || row.CLOSE || '0');
      return isNaN(close) ? 0 : close;
    }).filter(p => p > 0);
  }

  private static extractVolumes(data: any[]): number[] {
    return data.map(row => {
      const volume = parseFloat(row.VOLUME || row.volume || row.Volume || '0');
      return isNaN(volume) ? 0 : volume;
    }).filter(v => v > 0);
  }

  private static engineerFeatures(prices: number[], volumes: number[]): Record<string, number> {
    if (prices.length === 0) return {};

    const returns = this.calculateReturns(prices);
    const volatility = this.calculateVolatility(returns);
    
    return {
      priceLevel: prices[prices.length - 1],
      volatility,
      momentum: this.calculateMomentum(prices, 5),
      trend: this.calculateTrend(prices, 10),
      meanReversion: this.calculateMeanReversion(prices, 20),
      volumeTrend: volumes.length > 5 ? this.calculateVolumeTrend(volumes, 5) : 0,
      priceVolumeTrend: this.calculatePriceVolumeTrend(prices, volumes),
      supportLevel: this.calculateSupport(prices, 20),
      resistanceLevel: this.calculateResistance(prices, 20),
      relativeStrength: this.calculateRelativeStrength(prices, 14)
    };
  }

  private static calculateTechnicalIndicators(prices: number[], volumes: number[]): MarketIndicators {
    return {
      rsi: this.calculateRSI(prices, 14),
      macd: this.calculateMACD(prices),
      bollinger: this.calculateBollingerBands(prices, 20),
      movingAverages: {
        sma20: this.calculateSMA(prices, 20),
        sma50: this.calculateSMA(prices, 50),
        ema12: this.calculateEMA(prices, 12),
        ema26: this.calculateEMA(prices, 26)
      },
      volatility: this.calculateVolatility(this.calculateReturns(prices)) * 100,
      momentum: this.calculateMomentum(prices, 10)
    };
  }

  private static generateModelPredictions(prices: number[], features: Record<string, number>, indicators: MarketIndicators): Record<string, { prediction: number; confidence: number; weight: number }> {
    const lastPrice = prices[prices.length - 1];
    const predictions: Record<string, { prediction: number; confidence: number; weight: number }> = {};

    for (const model of this.MODELS) {
      let prediction = lastPrice;
      let confidence = model.confidence;

      switch (model.name) {
        case 'LightGBM':
          prediction = this.simulateLightGBM(lastPrice, features, indicators);
          break;
        case 'XGBoost':
          prediction = this.simulateXGBoost(lastPrice, features, indicators);
          break;
        case 'CatBoost':
          prediction = this.simulateCatBoost(lastPrice, features, indicators);
          break;
        case 'Neural Network':
          prediction = this.simulateNeuralNetwork(lastPrice, features, indicators);
          break;
      }

      // Adjust confidence based on market conditions
      if (features.volatility > 0.3) confidence *= 0.8; // High volatility reduces confidence
      if (Math.abs(indicators.rsi - 50) > 30) confidence *= 0.9; // Extreme RSI reduces confidence

      predictions[model.name] = {
        prediction,
        confidence,
        weight: model.weight
      };
    }

    return predictions;
  }

  private static combineModelPredictions(modelPredictions: Record<string, { prediction: number; confidence: number; weight: number }>): { price: number; confidence: number; uncertainty: number } {
    let weightedSum = 0;
    let totalWeight = 0;
    let confidenceSum = 0;
    const predictions = Object.values(modelPredictions);

    for (const pred of predictions) {
      const adjustedWeight = pred.weight * pred.confidence;
      weightedSum += pred.prediction * adjustedWeight;
      totalWeight += adjustedWeight;
      confidenceSum += pred.confidence * pred.weight;
    }

    const ensemblePrice = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const ensembleConfidence = confidenceSum / this.MODELS.reduce((sum, m) => sum + m.weight, 0);
    
    // Calculate uncertainty based on prediction variance
    const variance = predictions.reduce((acc, pred) => {
      return acc + pred.weight * Math.pow(pred.prediction - ensemblePrice, 2);
    }, 0);
    
    const uncertainty = Math.sqrt(variance) / ensemblePrice;

    return {
      price: ensemblePrice,
      confidence: ensembleConfidence,
      uncertainty: Math.min(uncertainty, 0.2) // Cap uncertainty at 20%
    };
  }

  // Simulate different ML models with realistic behavior
  private static simulateLightGBM(price: number, features: Record<string, number>, indicators: MarketIndicators): number {
    // LightGBM tends to be good with feature interactions
    const trendFactor = features.trend * 0.1;
    const momentumFactor = features.momentum * 0.05;
    const rsiAdjustment = (indicators.rsi - 50) / 1000;
    
    return price * (1 + trendFactor + momentumFactor + rsiAdjustment + (Math.random() - 0.5) * 0.02);
  }

  private static simulateXGBoost(price: number, features: Record<string, number>, indicators: MarketIndicators): number {
    // XGBoost good with handling outliers and regularization
    const volatilityAdjustment = -features.volatility * 0.1;
    const macdSignal = Math.sign(indicators.macd) * 0.01;
    const volumeFactor = Math.log(features.volumeTrend + 1) * 0.005;
    
    return price * (1 + volatilityAdjustment + macdSignal + volumeFactor + (Math.random() - 0.5) * 0.025);
  }

  private static simulateCatBoost(price: number, features: Record<string, number>, indicators: MarketIndicators): number {
    // CatBoost handles categorical features well
    const supportResistance = (price - features.supportLevel) / (features.resistanceLevel - features.supportLevel);
    const meanReversionSignal = features.meanReversion * 0.02;
    const bollingerPosition = (price - indicators.bollinger.middle) / (indicators.bollinger.upper - indicators.bollinger.lower);
    
    return price * (1 + supportResistance * 0.01 + meanReversionSignal - bollingerPosition * 0.005 + (Math.random() - 0.5) * 0.03);
  }

  private static simulateNeuralNetwork(price: number, features: Record<string, number>, indicators: MarketIndicators): number {
    // Neural network with non-linear combinations
    const complexity = Math.sin(features.momentum) * Math.cos(indicators.rsi / 50) * 0.01;
    const hiddenLayer = Math.tanh(features.trend + indicators.volatility / 100) * 0.015;
    
    return price * (1 + complexity + hiddenLayer + (Math.random() - 0.5) * 0.04);
  }

  // Technical indicator calculations (simplified but realistic)
  private static calculateReturns(prices: number[]): number[] {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  private static calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  private static calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];
    
    const k = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    
    return ema;
  }

  private static calculateMACD(prices: number[]): number {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    return ema12 - ema26;
  }

  private static calculateBollingerBands(prices: number[], period: number = 20): { upper: number; lower: number; middle: number } {
    const sma = this.calculateSMA(prices, period);
    const slice = prices.slice(-period);
    const variance = slice.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      middle: sma,
      upper: sma + (stdDev * 2),
      lower: sma - (stdDev * 2)
    };
  }

  private static calculateMomentum(prices: number[], period: number): number {
    if (prices.length < period + 1) return 0;
    const current = prices[prices.length - 1];
    const past = prices[prices.length - 1 - period];
    return ((current - past) / past) * 100;
  }

  private static calculateTrend(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const recent = prices.slice(-period);
    const n = recent.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = recent.reduce((a, b) => a + b, 0);
    const sumXY = recent.reduce((acc, price, index) => acc + price * index, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private static calculateMeanReversion(prices: number[], period: number): number {
    const sma = this.calculateSMA(prices, period);
    const current = prices[prices.length - 1];
    return (current - sma) / sma;
  }

  private static calculateVolumeTrend(volumes: number[], period: number): number {
    if (volumes.length < period) return 0;
    const recent = volumes.slice(-period);
    const older = volumes.slice(-period * 2, -period);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  private static calculatePriceVolumeTrend(prices: number[], volumes: number[]): number {
    if (prices.length < 2 || volumes.length < 2) return 0;
    
    const priceChange = (prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2];
    const volumeChange = (volumes[volumes.length - 1] - volumes[volumes.length - 2]) / volumes[volumes.length - 2];
    
    return priceChange * volumeChange;
  }

  private static calculateSupport(prices: number[], period: number): number {
    if (prices.length < period) return Math.min(...prices);
    return Math.min(...prices.slice(-period));
  }

  private static calculateResistance(prices: number[], period: number): number {
    if (prices.length < period) return Math.max(...prices);
    return Math.max(...prices.slice(-period));
  }

  private static calculateRelativeStrength(prices: number[], period: number): number {
    // Simplified relative strength calculation
    const recent = prices.slice(-period);
    const benchmark = prices.slice(-period * 2, -period);
    
    const recentReturn = (recent[recent.length - 1] - recent[0]) / recent[0];
    const benchmarkReturn = (benchmark[benchmark.length - 1] - benchmark[0]) / benchmark[0];
    
    return recentReturn - benchmarkReturn;
  }

  private static assessRisk(prices: number[], indicators: MarketIndicators, prediction: { price: number; confidence: number }): { level: 'Low' | 'Medium' | 'High'; score: number } {
    let riskScore = 0;
    
    // Volatility risk
    if (indicators.volatility > 30) riskScore += 3;
    else if (indicators.volatility > 15) riskScore += 2;
    else riskScore += 1;
    
    // RSI extremes
    if (indicators.rsi > 80 || indicators.rsi < 20) riskScore += 2;
    else if (indicators.rsi > 70 || indicators.rsi < 30) riskScore += 1;
    
    // Prediction confidence
    if (prediction.confidence < 0.5) riskScore += 2;
    else if (prediction.confidence < 0.7) riskScore += 1;
    
    // Price trend consistency
    const currentPrice = prices[prices.length - 1];
    const sma20 = indicators.movingAverages.sma20;
    const priceDeviation = Math.abs(currentPrice - sma20) / sma20;
    
    if (priceDeviation > 0.1) riskScore += 2;
    else if (priceDeviation > 0.05) riskScore += 1;
    
    let level: 'Low' | 'Medium' | 'High';
    if (riskScore <= 3) level = 'Low';
    else if (riskScore <= 6) level = 'Medium';
    else level = 'High';
    
    return { level, score: riskScore };
  }

  private static calculateProbabilities(indicators: MarketIndicators, prediction: { price: number; confidence: number }, prices: number[]): { bullish: number; bearish: number; neutral: number } {
    const currentPrice = prices[prices.length - 1];
    const expectedReturn = (prediction.price - currentPrice) / currentPrice;
    
    let bullishProb = 0.33;
    let bearishProb = 0.33;
    
    // RSI influence
    if (indicators.rsi > 70) bearishProb += 0.1;
    else if (indicators.rsi < 30) bullishProb += 0.1;
    
    // MACD influence
    if (indicators.macd > 0) bullishProb += 0.05;
    else bearishProb += 0.05;
    
    // Trend influence
    if (currentPrice > indicators.movingAverages.sma20) bullishProb += 0.1;
    else bearishProb += 0.1;
    
    // Expected return influence
    if (expectedReturn > 0.02) bullishProb += 0.15;
    else if (expectedReturn < -0.02) bearishProb += 0.15;
    
    // Normalize probabilities
    const total = bullishProb + bearishProb;
    const neutralProb = Math.max(0, 1 - total);
    
    const normalizedTotal = bullishProb + bearishProb + neutralProb;
    
    return {
      bullish: Math.round((bullishProb / normalizedTotal) * 100) / 100,
      bearish: Math.round((bearishProb / normalizedTotal) * 100) / 100,  
      neutral: Math.round((neutralProb / normalizedTotal) * 100) / 100
    };
  }

  private static generateRecommendation(indicators: MarketIndicators, probabilities: { bullish: number; bearish: number; neutral: number }, risk: { level: 'Low' | 'Medium' | 'High' }): { action: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' } {
    if (probabilities.bullish > 0.6 && risk.level === 'Low') return { action: 'Strong Buy' };
    if (probabilities.bullish > 0.5 && risk.level !== 'High') return { action: 'Buy' };
    if (probabilities.bearish > 0.6 && risk.level === 'Low') return { action: 'Strong Sell' };
    if (probabilities.bearish > 0.5 && risk.level !== 'High') return { action: 'Sell' };
    return { action: 'Hold' };
  }

  private static generateReasoning(indicators: MarketIndicators, probabilities: { bullish: number; bearish: number; neutral: number }, recommendation: { action: string }, prices: number[]): string[] {
    const reasons: string[] = [];
    
    // RSI reasoning
    if (indicators.rsi > 70) {
      reasons.push(`RSI at ${indicators.rsi.toFixed(1)} indicates overbought conditions`);
    } else if (indicators.rsi < 30) {
      reasons.push(`RSI at ${indicators.rsi.toFixed(1)} suggests oversold conditions, potential buying opportunity`);
    }
    
    // Trend reasoning
    const currentPrice = prices[prices.length - 1];
    if (currentPrice > indicators.movingAverages.sma20) {
      reasons.push(`Price above 20-day SMA (₹${indicators.movingAverages.sma20.toFixed(2)}) indicates upward trend`);
    } else {
      reasons.push(`Price below 20-day SMA (₹${indicators.movingAverages.sma20.toFixed(2)}) suggests downward pressure`);
    }
    
    // Volatility reasoning
    if (indicators.volatility > 25) {
      reasons.push(`High volatility (${indicators.volatility.toFixed(1)}%) increases investment risk`);
    } else if (indicators.volatility < 10) {
      reasons.push(`Low volatility (${indicators.volatility.toFixed(1)}%) suggests stable price movement`);
    }
    
    // MACD reasoning
    if (Math.abs(indicators.macd) > 1) {
      const direction = indicators.macd > 0 ? 'bullish' : 'bearish';
      reasons.push(`MACD shows ${direction} momentum with value ${indicators.macd.toFixed(2)}`);
    }
    
    // Probability reasoning
    const dominantProb = Math.max(probabilities.bullish, probabilities.bearish, probabilities.neutral);
    if (dominantProb === probabilities.bullish && probabilities.bullish > 0.5) {
      reasons.push(`AI models show ${(probabilities.bullish * 100).toFixed(0)}% bullish probability`);
    } else if (dominantProb === probabilities.bearish && probabilities.bearish > 0.5) {
      reasons.push(`AI models indicate ${(probabilities.bearish * 100).toFixed(0)}% bearish probability`);
    }
    
    return reasons.slice(0, 4); // Limit to top 4 reasons
  }

  private static detectAnomalies(prices: number[], volumes: number[], features: Record<string, number>): number {
    let anomalyScore = 0;
    
    // Price anomalies
    const priceVolatility = this.calculateVolatility(this.calculateReturns(prices));
    if (priceVolatility > 0.1) anomalyScore += 30;
    
    // Volume anomalies
    if (volumes.length > 5) {
      const recentVolume = volumes[volumes.length - 1];
      const avgVolume = volumes.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, volumes.length);
      
      if (recentVolume > avgVolume * 3) anomalyScore += 25;
    }
    
    // Feature anomalies
    if (Math.abs(features.momentum) > 10) anomalyScore += 20;
    if (Math.abs(features.meanReversion) > 0.2) anomalyScore += 15;
    
    return Math.min(anomalyScore, 100);
  }
}
