
import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Calendar, Award, CheckCircle2, History, Trophy, TrendingUp, Crown } from 'lucide-react';
import { LogEntry, progressService } from '../services/progressService';
import { LEVEL_CONFIG } from '../constants';

interface Props {
  onBack: () => void;
}

export const LogView: React.FC<Props> = ({ onBack }) => {
  const logs = progressService.getLogs();
  const streaks = progressService.getStreaks();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  const logsToday = logs.filter(log => log.timestamp >= todayTimestamp);
  const countToday = logsToday.length;
  const masterClearsToday = logsToday.filter(log => log.isMasterMode).length;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold"
        >
          <ChevronLeft size={20} />
          <span>もどる</span>
        </button>
        <div className="flex items-center gap-2 text-blue-600">
          <History size={24} />
          <h2 className="text-xl font-black tracking-tight">がくしゅうのきろく</h2>
        </div>
        <div className="w-20"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Today's Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl shadow-blue-200/50 flex items-center justify-between overflow-hidden relative"
            >
              <div className="relative z-10">
                <div className="text-blue-100 text-xs font-black uppercase tracking-widest mb-1">きょう 正解（せいかい）した数</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black">{countToday}</span>
                  <span className="text-blue-100 text-xl font-bold">問</span>
                </div>
              </div>
              <CheckCircle2 size={80} className="text-white/10 absolute -right-3 -bottom-3" strokeWidth={3} />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-200/50 flex items-center justify-between overflow-hidden relative"
            >
              <div className="relative z-10">
                <div className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">きょうのマスターモードクリア</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black">{masterClearsToday}</span>
                  <span className="text-indigo-100 text-xl font-bold">問</span>
                </div>
              </div>
              <Crown size={80} className="text-white/10 absolute -right-3 -bottom-3" strokeWidth={2} />
            </motion.div>
          </div>

          {/* Streaks Header Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[32px] text-white shadow-lg shadow-amber-200/50 flex items-center justify-between"
            >
              <div>
                <div className="text-amber-100/80 text-xs font-black uppercase tracking-widest mb-1">現在のれんぞくノーミス</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">{streaks.current}</span>
                  <span className="text-amber-100 text-sm font-bold">問</span>
                </div>
              </div>
              <TrendingUp size={40} className="text-white/30" strokeWidth={3} />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-[32px] text-slate-800 border border-slate-100 shadow-sm flex items-center justify-between"
            >
              <div>
                <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">さいこうれんぞくきろく</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-700">{streaks.max}</span>
                  <span className="text-slate-400 text-sm font-bold">問</span>
                </div>
              </div>
              <Trophy size={40} className="text-amber-400/20" strokeWidth={3} />
            </motion.div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <History size={16} className="text-slate-400" />
              <span className="text-slate-400 text-xs font-black uppercase tracking-widest">これまでのきろく</span>
            </div>
          {logs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-bold">まだデータがありません。問題を解いてみよう！</p>
            </div>
          ) : (
            logs.map((log, idx) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{formatDate(log.timestamp)}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">
                        {LEVEL_CONFIG[log.difficulty]?.label}
                      </span>
                    </div>
                    <div className="text-xl font-black text-slate-800">
                      {log.problem.dividend} ÷ {log.problem.divisor}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {log.isPerfect && (
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-black shadow-sm ring-1 ring-amber-200">
                      <Award size={14} />
                      <span>ノーミス！</span>
                    </div>
                  )}
                  {log.isMasterMode && (
                    <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-black shadow-sm ring-1 ring-indigo-200">
                      <Crown size={14} className="text-indigo-600" />
                      <span>マスター</span>
                    </div>
                  )}
                  <div className="text-slate-400 font-black text-xs uppercase tracking-widest hidden sm:block">
                    COMPLETED
                  </div>
                </div>
              </motion.div>
            ))
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
