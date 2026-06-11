/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ProblemSelector } from './components/ProblemSelector';
import { DivisionSimulator } from './components/DivisionSimulator';
import { generateProblem } from './components/ProblemGenerator';
import { Difficulty, Problem, StartOptions } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { progressService } from './services/progressService';
import { LogView } from './components/LogView';
import { History } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'HOME' | 'SIMULATOR' | 'LOG'>('HOME');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [lastSettings, setLastSettings] = useState<{ diff: Difficulty; options: StartOptions } | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [todayStats, setTodayStats] = useState<Record<string, number>>({});
  const [streaks, setStreaks] = useState<{ current: number; max: number }>({ current: 0, max: 0 });

  useEffect(() => {
    setStats(progressService.getStats());
    setTodayStats(progressService.getTodayStats());
    setStreaks(progressService.getStreaks());
  }, [view]);

  const handleStart = (diff: Difficulty, options: StartOptions) => {
    const problem = generateProblem(diff, options.allowRemainder, options.zeroFocus);
    setCurrentProblem(problem);
    setLastSettings({ diff, options });
    setView('SIMULATOR');
  };

  const handleBack = () => {
    setView('HOME');
    setCurrentProblem(null);
  };

  const handleFinish = (results: { isPerfect: boolean; dividend: number; divisor: number }) => {
    if (lastSettings) {
      progressService.recordWin(
        lastSettings.diff,
        lastSettings.options.allowRemainder,
        results.dividend,
        results.divisor,
        results.isPerfect,
        lastSettings.options.masterMode
      );
      setStats(progressService.getStats());
      setTodayStats(progressService.getTodayStats());
    }
  };

  const totalCleared = (Object.values(stats) as number[]).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="w-full h-screen bg-slate-50 overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {view === 'HOME' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center overflow-y-auto"
          >
            {/* Top Bar for Log Access */}
            <div className="w-full max-w-6xl flex justify-end p-6">
              <button 
                onClick={() => setView('LOG')}
                className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100 text-slate-600 font-bold hover:bg-slate-50 transition-all hover:shadow-md"
              >
                <History size={20} />
                <span>がくしゅうのきろく</span>
              </button>
            </div>

            <div className="text-center px-4 pt-2 pb-8 w-full max-w-5xl flex flex-col items-center">
              <div className="mb-4">
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-blue-200">
                  Mathematics Learning Tool
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter mb-1">
                わり算の筆算 <span className="text-blue-600">ラボEX</span>
              </h1>
              <p className="text-slate-500 font-medium text-base mb-3">
                4年生のための「たてる・かける・ひく・おろす」マスターアプリ
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-2">
                {totalCleared > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 bg-white px-6 py-2.5 rounded-2xl shadow-md border border-slate-50"
                  >
                    <span className="text-slate-400 text-xs font-black uppercase tracking-wider">合計クリア</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-blue-600 tabular-nums">{totalCleared}</span>
                      <span className="text-slate-400 text-[10px] font-black uppercase">問</span>
                    </div>
                  </motion.div>
                )}

                {streaks.current > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 bg-white px-6 py-2.5 rounded-2xl shadow-md border border-amber-50"
                  >
                    <span className="text-amber-500 text-xs font-black uppercase tracking-wider">れんぞくノーミス</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-amber-500 tabular-nums">{streaks.current}</span>
                      <span className="text-amber-400 text-[10px] font-black uppercase">問</span>
                    </div>
                  </motion.div>
                )}
              </div>

              <ProblemSelector
                onStart={handleStart}
                stats={todayStats}
                initialDifficulty={lastSettings?.diff}
                initialOptions={lastSettings?.options}
              />
            </div>
          </motion.div>
        ) : view === 'SIMULATOR' ? (
          <motion.div
            key="simulator"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="w-full h-full"
          >
            {currentProblem && (
              <DivisionSimulator
                problem={currentProblem}
                onBack={handleBack}
                onFinish={handleFinish}
                isMasterMode={lastSettings?.options.masterMode}
                zeroShortcut={lastSettings?.options.zeroShortcut}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="log"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full h-full"
          >
            <LogView onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-2 right-3 text-[10px] text-slate-400 pointer-events-none select-none z-50">
        presented by onokomachi
      </div>

      {/* Decorative BG pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1] overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(#1e293b 1.5px, transparent 1.5px)`, backgroundSize: '40px 40px' }} />
      </div>
    </div>
  );
}
