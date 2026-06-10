import { Difficulty, Problem } from '../types';

export function generateProblem(difficulty: Difficulty, allowRemainder: boolean): Problem {
  let dividend = 0;
  let divisor = 1;

  switch (difficulty) {
    case '2-1':
      divisor = Math.floor(Math.random() * 8) + 2; // 2-9
      dividend = Math.floor(Math.random() * 90) + 10; // 10-99
      break;
    case '3-1':
      divisor = Math.floor(Math.random() * 8) + 2; // 2-9
      dividend = Math.floor(Math.random() * 900) + 100; // 100-999
      break;
    case '2-2':
      divisor = Math.floor(Math.random() * 80) + 11; // 11-90
      dividend = Math.floor(Math.random() * 80) + 11; // 11-90
      if (dividend < divisor) [dividend, divisor] = [divisor, dividend];
      break;
    case '3-2':
      divisor = Math.floor(Math.random() * 80) + 11; // 11-90
      dividend = Math.floor(Math.random() * 800) + 101; // 101-900
      break;
  }

  if (!allowRemainder) {
    dividend = dividend - (dividend % divisor);
    // Ensure dividend is still in range if it became too small
    if (dividend < divisor) {
       dividend = divisor * (Math.floor(Math.random() * 5) + 2);
    }
  }

  return {
    dividend,
    divisor,
    quotient: Math.floor(dividend / divisor),
    remainder: dividend % divisor
  };
}
