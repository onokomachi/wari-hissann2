
export type Difficulty = '2-1' | '3-1' | '2-2' | '3-2';

export interface Problem {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
}

export type StepType = 'DIVIDE' | 'MULTIPLY' | 'SUBTRACT' | 'BRING_DOWN' | 'COMPLETE';

export interface CalculationState {
  currentStep: StepType;
  focusIndex: number; // For quotient or subtraction index
  userQuotient: (number | null)[];
  userSteps: {
    multiplyResult: (number | null)[][];
    subtractResult: (number | null)[][];
  };
}
