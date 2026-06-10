
import { Difficulty } from '../types';

export interface LogEntry {
  id: string;
  timestamp: number;
  difficulty: Difficulty;
  problem: {
    dividend: number;
    divisor: number;
  };
  hasRemainder: boolean;
  isPerfect: boolean;
  isMasterMode?: boolean;
}

export interface ProgressData {
  stats: Record<string, number>;
  logs: LogEntry[];
  currentStreak: number;
  maxStreak: number;
}

const STORAGE_KEY = 'hissann_progress_v3';

export const progressService = {
  getData(): ProgressData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return { stats: {}, logs: [], currentStreak: 0, maxStreak: 0 };
      const parsed = JSON.parse(data);
      return {
        stats: parsed.stats || {},
        logs: parsed.logs || [],
        currentStreak: parsed.currentStreak || 0,
        maxStreak: parsed.maxStreak || 0
      };
    } catch (e) {
      console.error('Failed to load progress', e);
      return { stats: {}, logs: [], currentStreak: 0, maxStreak: 0 };
    }
  },

  recordWin(difficulty: Difficulty, hasRemainder: boolean, dividend: number, divisor: number, isPerfect: boolean, isMasterMode: boolean = false) {
    const data = this.getData();
    const key = `${difficulty}_${hasRemainder ? 'rem' : 'no_rem'}`;
    
    // Update stats
    data.stats[key] = (data.stats[key] || 0) + 1;
    
    // Update streak
    if (isPerfect) {
      data.currentStreak += 1;
      if (data.currentStreak > data.maxStreak) {
        data.maxStreak = data.currentStreak;
      }
    } else {
      data.currentStreak = 0;
    }

    // Add log entry
    const newEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      difficulty,
      problem: { dividend, divisor },
      hasRemainder,
      isPerfect,
      isMasterMode
    };
    
    data.logs.unshift(newEntry); // Newest first
    if (data.logs.length > 100) data.logs.pop(); // Keep last 100
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  },

  getStats() {
    return this.getData().stats;
  },

  getTodayStats() {
    const logs = this.getLogs();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const todayStats: Record<string, number> = {};
    const logsToday = logs.filter(log => log.timestamp >= todayTimestamp);
    
    logsToday.forEach(log => {
      const key = `${log.difficulty}_${log.hasRemainder ? 'rem' : 'no_rem'}`;
      todayStats[key] = (todayStats[key] || 0) + 1;
    });
    
    return todayStats;
  },

  getLogs() {
    return this.getData().logs;
  },

  getStreaks() {
    const data = this.getData();
    return {
      current: data.currentStreak,
      max: data.maxStreak
    };
  }
};
