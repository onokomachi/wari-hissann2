import React, { useState, useEffect, useMemo } from 'react';
import { Problem, StepType } from '../types';
import { ArrowDown, Delete, ChevronLeft, RotateCcw, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface Props {
  problem: Problem;
  onBack: () => void;
  onFinish?: (results: { isPerfect: boolean; dividend: number; divisor: number }) => void;
  isMasterMode?: boolean;
}

export const DivisionSimulator: React.FC<Props> = ({ problem, onBack, onFinish, isMasterMode = false }) => {
  const { dividend, divisor } = problem;
  const dividendStr = dividend.toString();
  const divisorStr = divisor.toString();

  // Procedural analysis of the division to know correct steps
  const realSteps = useMemo(() => {
    const steps: any[] = [];
    let currentValStr = '';
    
    for (let i = 0; i < dividendStr.length; i++) {
       currentValStr += dividendStr[i];
       const currentVal = parseInt(currentValStr);
       
       if (currentVal >= divisor || (i === dividendStr.length - 1 && steps.length === 0)) {
         const q = Math.floor(currentVal / divisor);
         const m = q * divisor;
         const r = currentVal - divisor * q;
         steps.push({
           type: 'CALC',
           index: i,
           digitIndex: i,
           quotient: q,
           multiply: m,
           remainder: r,
           dividendPart: currentVal
         });
         currentValStr = r.toString();
       } else {
         // Lead zero case (estimations)
         if (steps.length > 0) {
            steps.push({
               type: 'ZERO',
               index: i,
               digitIndex: i,
               quotient: 0,
               multiply: 0,
               remainder: currentVal,
               dividendPart: currentVal
            });
            currentValStr = currentVal.toString();
         }
       }
    }
    return steps;
  }, [dividend, divisor]);

  const [stepIndex, setStepIndex] = useState(0);
  const [subStep, setSubStep] = useState<StepType>('DIVIDE');
  const [userInput, setUserInput] = useState<string>('');
  const [gridData, setGridData] = useState<any[]>([]); // Current rendered rows
  const [isFinished, setIsFinished] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Master Mode States
  const [history, setHistory] = useState<{
    stepIndex: number;
    subStep: StepType;
    gridData: any[];
    userInput: string;
  }[]>([]);
  const [isAllEntered, setIsAllEntered] = useState(false);
  const [isGraded, setIsGraded] = useState(false);
  const [hasMistakes, setHasMistakes] = useState<boolean | null>(null);

  const isProcessing = React.useRef(false);

  // Initialize display grid
  useEffect(() => {
    // Row 0: Quotient (empty)
    // Row 1: Division frame (divisor + dividend)
    const initialGrid = [
      { type: 'quotient', values: Array(dividendStr.length).fill(null) },
      { type: 'frame', divisor: divisorStr, dividend: dividendStr }
    ];
    setGridData(initialGrid);
    setMistakeCount(0);
    setHistory([]);
    setIsAllEntered(false);
    setIsGraded(false);
    setHasMistakes(null);
  }, [dividend, divisor]);

  const activeStep = realSteps[stepIndex];
  const nextStep = realSteps[stepIndex + 1];

  const pushHistory = () => {
    setHistory(prev => [...prev, {
      stepIndex,
      subStep,
      gridData: JSON.parse(JSON.stringify(gridData)),
      userInput
    }]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setStepIndex(prev.stepIndex);
    setSubStep(prev.subStep);
    setGridData(prev.gridData);
    setUserInput(prev.userInput);
    setIsAllEntered(false);
    setIsGraded(false);
    setHasMistakes(null);
  };

  const getRowCorrectValue = (rowIdx: number): string => {
    const rIdx = rowIdx - 2;
    const stepNum = Math.floor(rIdx / 2);
    const isMultiply = rIdx % 2 === 0;
    const step = realSteps[stepNum];
    if (!step) return '';

    if (isMultiply) {
      return step.multiply.toString();
    } else {
      if (stepNum < realSteps.length - 1) {
        const remStr = step.remainder === 0 ? '' : step.remainder.toString();
        const nextDigit = dividendStr[realSteps[stepNum + 1].digitIndex];
        return remStr + nextDigit;
      } else {
        return step.remainder.toString();
      }
    }
  };

  const isQuotientDigitCorrect = (colIdx: number) => {
    const userDigit = gridData[0]?.values?.[colIdx];
    const matchingStep = realSteps.find(s => s.index === colIdx);
    if (!matchingStep) {
      return userDigit === null || userDigit === undefined;
    }
    return userDigit === matchingStep.quotient;
  };

  const doGrading = () => {
    let errorsFound = false;

    // Check quotient
    for (let i = 0; i < dividendStr.length; i++) {
      if (!isQuotientDigitCorrect(i)) {
        errorsFound = true;
      }
    }

    // Check step rows (multiply and remainder)
    for (let rowIdx = 2; rowIdx < gridData.length; rowIdx++) {
      const row = gridData[rowIdx];
      const valStr = row.value.toString();
      const correctVal = getRowCorrectValue(rowIdx);
      if (valStr !== correctVal) {
        errorsFound = true;
      }
    }

    setIsGraded(true);
    setHasMistakes(errorsFound);

    if (!errorsFound) {
      setIsFinished(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      onFinish?.({
        isPerfect: true,
        dividend,
        divisor
      });
    } else {
      onFinish?.({
        isPerfect: false,
        dividend,
        divisor
      });
    }
  };

  // Check if we can proceed to next bit
  const handleKeypad = (val: string) => {
    if (isFinished || isAllEntered) return;
    if (subStep === 'BRING_DOWN') return; // Must click Check/Next to proceed
    setUserInput(prev => prev + val);
  };

  const handleBackspace = () => {
    if (isAllEntered || isFinished) return;
    setUserInput(prev => prev.slice(0, -1));
  };

  const checkAnswer = () => {
    if (!activeStep || isProcessing.current) return;

    if (isMasterMode) {
      pushHistory();

      if (subStep === 'DIVIDE') {
        const enteredQuotient = parseInt(userInput) || 0;
        setGridData(prev => {
          const next = [...prev];
          if (next[0]) {
             const newValues = [...next[0].values];
             newValues[activeStep.index] = enteredQuotient;
             next[0] = { ...next[0], values: newValues };
          }
          return next;
        });
        setUserInput('');
        setSubStep('MULTIPLY');
      } else if (subStep === 'MULTIPLY') {
        setGridData(prev => {
          const next = [...prev];
          next.push({ type: 'multiply', value: userInput || '0', offset: activeStep.index });
          return next;
        });
        setUserInput('');
        setSubStep('SUBTRACT');
      } else if (subStep === 'SUBTRACT') {
        setGridData(prev => {
          const next = [...prev];
          next.push({ type: 'remainder', value: userInput || '0', offset: activeStep.index });
          return next;
        });
        setUserInput('');
        
        if (stepIndex < realSteps.length - 1) {
          setSubStep('BRING_DOWN');
        } else {
          setIsAllEntered(true);
        }
      } else if (subStep === 'BRING_DOWN') {
        if (!nextStep) return;
        isProcessing.current = true;
        setGridData(prev => {
          const next = [...prev];
          const lastRow = next[next.length - 1];
          if (lastRow && lastRow.type === 'remainder') {
             const enteredRem = lastRow.value.toString();
             const nextDigit = dividendStr[nextStep.digitIndex];
             lastRow.value = (enteredRem === '0' ? '' : enteredRem) + nextDigit;
             lastRow.offset = nextStep.digitIndex;
          }
          return next;
        });

        setTimeout(() => {
          setStepIndex(prev => prev + 1);
          setSubStep('DIVIDE');
          setUserInput('');
          isProcessing.current = false;
        }, 300);
      }
      return;
    }

    // Normal Mode Flow
    if (subStep === 'DIVIDE') {
      if (parseInt(userInput) === activeStep.quotient) {
        setGridData(prev => {
          const next = [...prev];
          if (next[0]) {
             const newValues = [...next[0].values];
             newValues[activeStep.index] = activeStep.quotient;
             next[0] = { ...next[0], values: newValues };
          }
          return next;
        });
        setUserInput('');
        setSubStep('MULTIPLY');
      } else {
        const inputVal = parseInt(userInput);
        let msg = "おしい！ もう一度考えてみよう。";
        if (inputVal < activeStep.quotient) {
          msg = "もっと大きく わけられそうだよ！\n（あまりが わる数より大きくなっちゃうよ）";
        } else if (inputVal > activeStep.quotient) {
          msg = "ちょっと 大きすぎたかも？\n（下のひき算が できなくなっちゃうよ）";
        }
        triggerError(msg);
      }
    } else if (subStep === 'MULTIPLY') {
      if (parseInt(userInput) === activeStep.multiply) {
        setGridData(prev => {
          const next = [...prev];
          next.push({ type: 'multiply', value: userInput, offset: activeStep.index });
          return next;
        });
        setUserInput('');
        setSubStep('SUBTRACT');
      } else {
        triggerError("かけ算を もういちど かくにんしてみよう！");
      }
    } else if (subStep === 'SUBTRACT') {
       if (parseInt(userInput) === activeStep.remainder) {
         setGridData(prev => {
           const next = [...prev];
           next.push({ type: 'remainder', value: userInput, offset: activeStep.index });
           return next;
         });
         setUserInput('');
         
         if (stepIndex < realSteps.length - 1) {
           setSubStep('BRING_DOWN');
         } else {
           finish();
         }
       } else {
         triggerError("ひき算を もういちど かくにんしてみよう！");
       }
    } else if (subStep === 'BRING_DOWN') {
       if (!nextStep) return;
       isProcessing.current = true;
       setGridData(prev => {
          const next = [...prev];
          const lastRow = next[next.length - 1];
          if (lastRow && lastRow.type === 'remainder') {
             // CRITICAL: use the activeStep.remainder (source of truth) 
             // rather than current text value to avoid duplicating digits (e.g. 19 -> 199)
             const remainderString = activeStep.remainder.toString();
             const nextDigit = dividendStr[nextStep.digitIndex];
             
             // In school math, if remainder is 0, we just show the brought down digit (e.g. 0 and 5 -> 5)
             lastRow.value = (remainderString === '0' ? '' : remainderString) + nextDigit;
             lastRow.offset = nextStep.digitIndex;
          }
          return next;
       });

       // Briefly delay the transition to allow the user to see the digit land
       setTimeout(() => {
         setStepIndex(prev => prev + 1);
         setSubStep('DIVIDE');
         setUserInput('');
         isProcessing.current = false;
       }, 300);
    }
  };

  const triggerError = (msg?: string) => {
    setMistakeCount(prev => prev + 1);
    if (msg) setFeedback(msg);
    // Visual feedback for error
    const el = document.getElementById('input-area');
    el?.classList.add('animate-shake');
    setTimeout(() => el?.classList.remove('animate-shake'), 500);
    setUserInput('');
  };

  const finish = () => {
    setIsFinished(true);
    setSubStep('DIVIDE'); // Clear active interactions
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    onFinish?.({
      isPerfect: mistakeCount === 0,
      dividend,
      divisor
    });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 simulator-container">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-slate-100 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          <ChevronLeft size={24} />
          もどる
        </button>
        <div className="flex items-center gap-3">
           <span className="text-sm font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">わる算ラボ</span>
           <h1 className="text-2xl font-black text-slate-800">{dividend} ÷ {divisor}</h1>
        </div>
        <div className="w-24"></div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Feedback Overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFeedback(null)}
              className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl text-center border-4 border-amber-400"
              >
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">💡</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4 whitespace-pre-wrap">
                  {feedback}
                </h3>
                <button 
                  onClick={() => setFeedback(null)}
                  className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-2xl font-black text-xl shadow-lg shadow-amber-200 transition-all active:scale-95"
                >
                  わかった！
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Workspace */}
        <div className="flex-1 relative overflow-auto p-4 md:p-12 flex justify-center items-start">
          <div className="bg-white p-8 md:p-12 rounded-[30px] md:rounded-[40px] shadow-2xl border border-blue-50/50 min-w-[500px] md:min-w-[600px] relative">
            
            {/* Instruction Overlay (Moved inside or adjusted for iPad) */}
            <div className="hidden lg:block absolute -left-28 top-0 mt-8 w-24 space-y-3">
               {['たてる', 'かける', 'ひく', 'おろす'].map((s, i) => {
                 const stepWords = ['DIVIDE', 'MULTIPLY', 'SUBTRACT', 'BRING_DOWN'];
                 const isActive = subStep === stepWords[i];
                 return (
                   <div key={s} className={`p-2.5 rounded-xl text-center font-black text-sm transition-all ${isActive && !isAllEntered ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-white text-slate-300 border border-slate-100'}`}>
                     {s}
                   </div>
                 )
               })}
            </div>

            {/* Mobile/iPad Step Indicator */}
            <div className="lg:hidden flex gap-2 mb-6 overflow-x-auto pb-2">
               {['たてる', 'かける', 'ひく', 'おろす'].map((s, i) => {
                 const stepWords = ['DIVIDE', 'MULTIPLY', 'SUBTRACT', 'BRING_DOWN'];
                 const isActive = subStep === stepWords[i];
                 return (
                   <div key={s} className={`px-4 py-2 rounded-full text-center font-black text-xs whitespace-nowrap transition-all ${isActive && !isAllEntered ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-300 border border-slate-100'}`}>
                     {s}
                   </div>
                 )
               })}
            </div>
            
            <div className="font-mono text-5xl leading-none tracking-widest text-slate-700 select-none">
              
              {/* Row 0: Quotient */}
              <div 
                className="grid items-center text-center"
                style={{ gridTemplateColumns: `64px repeat(${dividendStr.length}, 56px)` }}
              >
                 <div className="col-start-1"></div>
                 {dividendStr.split('').map((_, i) => (
                    <div key={i} className={`w-14 h-16 flex items-center justify-center relative ${subStep === 'DIVIDE' && activeStep?.index === i && !isAllEntered ? 'bg-blue-50 ring-4 ring-blue-400 ring-inset rounded-xl z-30' : ''}`}>
                       <AnimatePresence mode="wait">
                         {(() => {
                           const userVal = gridData[0]?.values?.[i];
                           if (userVal != null) {
                             if (isGraded) {
                               const isCorrect = isQuotientDigitCorrect(i);
                               return (
                                 <motion.span
                                   initial={{ scale: 0 }}
                                   animate={{ scale: 1 }}
                                   key="val"
                                   className={isCorrect ? "text-emerald-650 font-extrabold" : "text-rose-500 font-extrabold animate-pulse ring-1 ring-rose-300 bg-rose-50 px-1.5 rounded z-10"}
                                 >
                                   {userVal}
                                 </motion.span>
                               );
                             }
                             return (
                               <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key="val">
                                 {userVal}
                               </motion.span>
                             );
                           } else {
                             if (isGraded) {
                               const matchingStep = realSteps.find(s => s.index === i);
                               if (matchingStep) {
                                 // Misplaced/skipped quotient digit
                                 return <span className="text-rose-500 font-extrabold animate-pulse bg-rose-50 border border-rose-200 px-1 rounded">?</span>;
                               }
                             }
                             return subStep === 'DIVIDE' && activeStep?.index === i && !isAllEntered && (
                               <span className="text-blue-500 animate-pulse">{userInput || '？'}</span>
                             );
                           }
                         })()}
                       </AnimatePresence>
                    </div>
                 ))}
              </div>

              {/* Row 1: The Frame (Divisor | Dividend) */}
              <div 
                className="grid items-center text-center relative h-16"
                style={{ gridTemplateColumns: `64px repeat(${dividendStr.length}, 56px)` }}
              >
                 {/* Divisor */}
                 <div className="col-start-1 flex justify-end pr-3 text-slate-800 font-bold border-r-4 border-slate-800 h-full items-center z-20">
                     {divisor}
                 </div>
                 
                 <div className="absolute left-[62px] right-0 top-0 border-t-4 border-slate-800 z-20"></div>

                 {/* Dividend */}
                 {dividendStr.split('').map((d, i) => {
                   const isBeingUsed = !isFinished && !isAllEntered && subStep === 'DIVIDE' && i <= activeStep?.index && (i >= (stepIndex === 0 ? 0 : realSteps[stepIndex-1].index + 1));
                   
                   return (
                     <div key={i} className={`w-14 h-16 flex items-center justify-center relative font-bold text-slate-800 transition-colors ${isBeingUsed ? 'bg-amber-50 text-amber-700' : ''}`}>
                        <AnimatePresence>
                          {subStep === 'BRING_DOWN' && nextStep?.digitIndex === i && !isAllEntered ? (
                            <motion.div
                              drag="y"
                              dragConstraints={{ top: 0, bottom: 250 }}
                              dragSnapToOrigin
                              onDragEnd={(_, info) => {
                                if (info.offset.y > 80) {
                                  checkAnswer();
                                }
                              }}
                              className="bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-lg shadow-xl cursor-grab active:cursor-grabbing z-40 border-2 border-white"
                            >
                              {d}
                            </motion.div>
                          ) : (
                            <span className={subStep === 'BRING_DOWN' && nextStep?.digitIndex === i ? 'opacity-20' : ''}>{d}</span>
                          )}
                        </AnimatePresence>
                        {isBeingUsed && <div className="absolute bottom-0 left-1 right-1 h-1 bg-amber-400 rounded-full"></div>}
                     </div>
                   );
                 })}
              </div>

              {/* Steps (Multiply and Remainder) */}
              <div className="relative">
                  {gridData.slice(2).map((row, idx) => {
                    const rowIdx = idx + 2;
                    const isLastRow = idx === gridData.length - 3;
                    const isFocusRow = !isFinished && isLastRow && (subStep === 'DIVIDE' || subStep === 'BRING_DOWN') && !isAllEntered;

                    return (
                      <div 
                         key={idx} 
                         className={`grid items-center text-center relative h-16 transition-colors duration-300 ${isFocusRow ? 'bg-blue-50/20' : ''}`}
                         style={{ gridTemplateColumns: `64px repeat(${dividendStr.length}, 56px)` }}
                      >
                         {row.type === 'multiply' && (
                            <div className="absolute left-[64px] right-0 bottom-0 border-b-2 border-slate-300"></div>
                         )}
                         
                         <div className="col-start-1 text-slate-400 font-bold text-xl flex justify-end pr-3">
                            {row.type === 'multiply' ? '×' : (idx > 0 && gridData.slice(2)[idx-1].type === 'multiply' ? '-' : '')}
                         </div>

                         {Array(dividendStr.length).fill(0).map((_, dividendIdx) => {
                            const valStr = row.value.toString();
                            const offset = row.offset;
                            const digitsNeeded = valStr.length;
                            const startIdx = offset - digitsNeeded + 1;
                            const char = (dividendIdx >= startIdx && dividendIdx <= offset) ? valStr[dividendIdx - startIdx] : '';
                            
                            const isActiveDigitInDivision = !isFinished && subStep === 'DIVIDE' && isLastRow && row.type === 'remainder' && dividendIdx >= startIdx && dividendIdx <= offset && !isAllEntered;
                            const isBringDownEmptySpot = subStep === 'BRING_DOWN' && row.type === 'remainder' && isLastRow && nextStep?.digitIndex === dividendIdx && !isAllEntered;

                            return (
                              <div key={dividendIdx} className="w-14 h-16 flex justify-center items-center relative">
                                 {(() => {
                                   if (!char) {
                                     return isBringDownEmptySpot ? (
                                       <motion.div 
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          className="absolute inset-2 border-2 border-dashed border-blue-400 rounded-lg bg-blue-100/50 flex flex-col items-center justify-center p-1"
                                       >
                                          <ArrowDown className="text-blue-500 animate-bounce" size={24} />
                                       </motion.div>
                                     ) : null;
                                   }

                                   if (isGraded) {
                                     const correctVal = getRowCorrectValue(rowIdx);
                                     const expectedDigitsNeeded = correctVal.length;
                                     const expectedStartIdx = offset - expectedDigitsNeeded + 1;
                                     const expectedChar = (dividendIdx >= expectedStartIdx && dividendIdx <= offset) ? correctVal[dividendIdx - expectedStartIdx] : '';
                                     const isCharCorrect = char === expectedChar;

                                     return (
                                       <span className={isCharCorrect ? "z-10 text-3xl font-extrabold text-emerald-600" : "z-10 text-3xl font-extrabold text-rose-500 animate-pulse ring-1 ring-rose-300 bg-rose-50 px-1 rounded"}>
                                         {char}
                                       </span>
                                     );
                                   }

                                   return (
                                     <span className={`z-10 text-3xl font-medium ${isActiveDigitInDivision ? 'text-blue-600 font-extrabold' : ''}`}>
                                       {char}
                                     </span>
                                   );
                                 })()}
                                 {!isGraded && isActiveDigitInDivision && (
                                   <div className="absolute bottom-1 left-1 right-1 h-1 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                 )}
                              </div>
                            );
                         })}
                      </div>
                    );
                  })}

                  {/* Current Input Zone (Floating row for Multiply/Subtract result entry) */}
                  {!isFinished && !isAllEntered && (subStep === 'MULTIPLY' || subStep === 'SUBTRACT') && (
                     <div 
                        className="grid items-center text-center relative h-16 bg-blue-100/20 ring-4 ring-blue-400/30 rounded-2xl mx-1 shadow-sm mt-1 mb-1"
                        style={{ gridTemplateColumns: `64px repeat(${dividendStr.length}, 56px)` }}
                     >
                        <div className="col-start-1 text-blue-500 font-bold text-3xl flex justify-end pr-3">
                           {subStep === 'MULTIPLY' ? '×' : '-'}
                        </div>
                        {subStep === 'SUBTRACT' && (
                          <div className="absolute left-[64px] right-0 bottom-0 border-b-4 border-blue-400 rounded-full"></div>
                        )}
                        
                        {Array(dividendStr.length).fill(0).map((_, dividendIdx) => {
                           const valStr = userInput;
                           const offset = activeStep.index;
                           const digitsNeeded = valStr.length || 1;
                           const startIdx = offset - digitsNeeded + 1;
                           const isTarget = (dividendIdx >= startIdx && dividendIdx <= offset);
                           const char = isTarget ? valStr[dividendIdx - startIdx] : '';
                           
                           return (
                             <div key={dividendIdx} className={`w-14 h-16 flex justify-center items-center ${isTarget ? 'bg-white shadow-lg ring-4 ring-blue-500 ring-inset rounded-xl z-10' : ''}`}>
                                <span className="text-blue-600 font-black text-4xl">{char}</span>
                                {isTarget && !char && dividendIdx === startIdx && <span className="text-blue-200 animate-pulse">？</span>}
                             </div>
                           );
                        })}
                     </div>
                  )}
              </div>

               {isFinished && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="absolute -right-48 bottom-0 bg-blue-600 text-white p-6 rounded-3xl shadow-xl z-20 text-center"
                 >
                   <div className="text-sm font-bold uppercase tracking-widest mb-1 opacity-85">けいさん おわり！</div>
                   <div className="text-3xl font-black">あまり：{problem.remainder}</div>
                 </motion.div>
               )}
            </div>
          </div>
        </div>

        {/* Side Controls / Keypad */}
        <div className="w-full md:w-[400px] bg-white border-l border-slate-100 p-6 md:p-8 flex flex-col gap-6 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] overflow-y-auto">
          
          {/* Graded and Perfect Score State */}
          {isGraded && !hasMistakes && (
            <div className="flex-1 flex flex-col justify-center items-center p-6 bg-emerald-50 border border-emerald-150 rounded-3xl text-center">
              <span className="text-6xl mb-4">🏆</span>
              <h3 className="text-2xl font-black text-emerald-800 mb-2">パーフェクト！</h3>
              <p className="text-emerald-600 font-bold mb-6">全問せいかいです！すばらしい！</p>
              <button
                onClick={onBack}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-emerald-250 transition-all active:scale-95"
              >
                もどる
              </button>
            </div>
          )}

          {/* Graded with Mistakes State */}
          {isGraded && hasMistakes && (
            <div className="flex-1 flex flex-col justify-center items-center p-6 bg-rose-50 border border-rose-150 rounded-3xl text-center">
              <span className="text-6xl mb-4">💡</span>
              <h3 className="text-2xl font-black text-rose-800 mb-2">おしい！</h3>
              <p className="text-rose-600 text-sm font-bold leading-relaxed mb-6">
                赤マスのまちがっているすう字を、もういちど見なおしてみてね。
              </p>
              
              <button
                onClick={() => {
                  setIsGraded(false);
                }}
                className="w-full py-4 bg-blue-600 hover:bg-blue-750 text-white rounded-2xl font-black text-lg shadow-md transition-all active:scale-95 mb-3"
              >
                まちがいをなおす
              </button>

              <button
                onClick={() => {
                  setGridData([
                    { type: 'quotient', values: Array(dividendStr.length).fill(null) },
                    { type: 'frame', divisor: divisorStr, dividend: dividendStr }
                  ]);
                  setStepIndex(0);
                  setSubStep('DIVIDE');
                  setUserInput('');
                  setHistory([]);
                  setIsAllEntered(false);
                  setIsGraded(false);
                  setHasMistakes(null);
                }}
                className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-bold transition-all"
              >
                はじめからやりなおす
              </button>
            </div>
          )}

          {/* Master Mode Completion Screen (Click grading button to grade) */}
          {isMasterMode && isAllEntered && !isGraded && (
             <div className="flex-1 flex flex-col justify-center items-center p-4 bg-amber-50/50 border border-amber-100 rounded-3xl text-center">
               <span className="text-5xl mb-4">📝</span>
               <h3 className="text-2xl font-black text-slate-800 mb-2">すべて入力しました！</h3>
               <p className="text-slate-500 font-medium mb-6">さいごに「答え合わせ」ボタンをおして、まる付けをしよう！</p>
               <button
                 onClick={doGrading}
                 className="w-full py-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-3xl font-black text-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 animate-bounce"
               >
                 <span>答え合わせをする</span>
               </button>
               <button
                 onClick={handleUndo}
                 className="mt-4 text-slate-400 hover:text-slate-600 font-bold flex items-center gap-2 text-sm"
               >
                 <RotateCcw size={16} /> <span>1つもどってなおす</span>
               </button>
             </div>
          )}

          {/* Normal Mode Hints or Default Master Mode Box */}
          {(!isAllEntered && !isGraded) && (
            <>
              {isMasterMode ? (
                <div className="bg-gradient-to-br from-indigo-50 to-amber-50 p-6 rounded-3xl shrink-0 border border-slate-100">
                   <h3 className="text-indigo-650 font-black text-lg mb-2 flex items-center gap-2">
                       👑 マスターモード
                   </h3>
                   <p className="text-slate-600 font-black text-sm leading-relaxed">
                     ヒントは なしだよ！じぶんで かんがえて、すべてのマスを うめてね。さいごに「答え合わせ」ボタンを押そう！
                   </p>
                </div>
              ) : (
                <div className="bg-blue-50 p-6 rounded-3xl shrink-0 border border-blue-10/50">
                   <h3 className="text-blue-600 font-black text-lg mb-2 flex items-center gap-2">
                       <PartyPopper size={20} /> ヒント
                   </h3>
                   <p className="text-slate-605 font-medium leading-relaxed">
                     {subStep === 'DIVIDE' && `${activeStep?.dividendPart} の中に ${divisor} はいくつあるかな？`}
                     {subStep === 'MULTIPLY' && `${divisor} × ${activeStep?.quotient} をけいさんしよう。`}
                     {subStep === 'SUBTRACT' && `${activeStep?.dividendPart} - ${activeStep?.multiply} は？`}
                     {subStep === 'BRING_DOWN' && `つぎの かずを おろそう。`}
                     {isFinished && `正かい！よくできました！`}
                   </p>
                </div>
              )}

              <div id="input-area" className="flex-1 flex flex-col justify-center gap-4">
                 {/* 1つもどる button context when editing */}
                 {isMasterMode && history.length > 0 && (
                   <button
                     onClick={handleUndo}
                     className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-3xl text-sm font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                   >
                     <RotateCcw size={16} />
                     <span>1つもどる</span>
                   </button>
                 )}

                 <div className="grid grid-cols-3 gap-3">
                   {[1,2,3,4,5,6,7,8,9,0].map(n => (
                     <button
                       key={n}
                       onClick={() => handleKeypad(n.toString())}
                       className="h-20 bg-slate-100 hover:bg-slate-200 active:bg-blue-600 active:text-white rounded-2xl text-3xl font-black text-slate-700 transition-all flex items-center justify-center shadow-sm"
                     >
                       {n}
                     </button>
                   ))}
                   <button 
                    onClick={handleBackspace}
                    className="h-20 bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl flex items-center justify-center transition-all shadow-sm"
                   >
                     <Delete size={32} />
                   </button>
                 </div>

                 <button
                   onClick={checkAnswer}
                   disabled={userInput === '' && subStep !== 'BRING_DOWN'}
                   className={`w-full py-6 rounded-3xl text-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3 ${
                     (userInput !== '' || subStep === 'BRING_DOWN') ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' : 'bg-slate-100 text-slate-300'
                   }`}
                 >
                   {isMasterMode ? 'つぎへ' : (subStep === 'BRING_DOWN' ? 'つぎへ' : 'チェック')}
                 </button>
              </div>
            </>
          )}

          <button onClick={onBack} className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 py-4 font-bold border-t border-slate-100 shrink-0">
            <RotateCcw size={20} /> {isFinished ? 'もう１問ちょうせん' : 'さいしょから'}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
