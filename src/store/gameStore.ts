import { create } from 'zustand';
import { GameSession, GameState, BingoCard, DrawnNumber, BingoLetter, BingoPattern, ClassicLineType } from '../types';

interface GameStore {
  currentSession: GameSession | null;
  gameState: GameState;
  
  // Game Actions
  startGame: (settings: any) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  
  // Number Drawing
  drawNumber: () => DrawnNumber | null;
  addDrawnNumber: (drawnNumber: DrawnNumber) => void;
  
  // Card Management
  generateCard: () => BingoCard;
  checkWin: () => boolean;
  
  // Session Management
  resetGame: () => void;
}

// Number ranges for each letter
const NUMBER_RANGES = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
};

export const useGameStore = create<GameStore>((set, get) => ({
  currentSession: null,
  gameState: 'idle',

  startGame: (settings) => {
    const card = get().generateCard();
    const newSession: GameSession = {
      id: Date.now().toString(),
      card,
      drawnNumbers: [],
      currentState: 'playing',
      settings,
      startTime: new Date(),
      isWin: false,
    };
    
    set({ 
      currentSession: newSession, 
      gameState: 'playing' 
    });
  },

  pauseGame: () => {
    const { currentSession } = get();
    if (currentSession) {
      set({
        currentSession: { 
          ...currentSession, 
          currentState: 'paused' 
        },
        gameState: 'paused'
      });
    }
  },

  resumeGame: () => {
    const { currentSession } = get();
    if (currentSession) {
      set({
        currentSession: { 
          ...currentSession, 
          currentState: 'playing' 
        },
        gameState: 'playing'
      });
    }
  },

  endGame: () => {
    const { currentSession } = get();
    if (currentSession) {
      set({
        currentSession: { 
          ...currentSession, 
          currentState: 'completed',
          endTime: new Date()
        },
        gameState: 'completed'
      });
    }
  },

  drawNumber: () => {
    const { currentSession } = get();
    if (!currentSession || currentSession.currentState !== 'playing') {
      return null;
    }

    const drawnNumbers = currentSession.drawnNumbers;
    const availableNumbers: Array<{letter: BingoLetter, number: number}> = [];

    // Generate all possible numbers
    Object.entries(NUMBER_RANGES).forEach(([letter, [min, max]]) => {
      for (let num = min; num <= max; num++) {
        const isDrawn = drawnNumbers.some(
          drawn => drawn.letter === letter && drawn.number === num
        );
        if (!isDrawn) {
          availableNumbers.push({ letter: letter as BingoLetter, number: num });
        }
      }
    });

    if (availableNumbers.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const selected = availableNumbers[randomIndex];
    
    const drawnNumber: DrawnNumber = {
      letter: selected.letter,
      number: selected.number,
      timestamp: new Date(),
    };

    get().addDrawnNumber(drawnNumber);
    return drawnNumber;
  },

  addDrawnNumber: (drawnNumber: DrawnNumber) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      drawnNumbers: [...currentSession.drawnNumbers, drawnNumber],
    };

    set({ currentSession: updatedSession });

    // Check for win condition
    if (get().checkWin()) {
      set({
        currentSession: { 
          ...updatedSession, 
          isWin: true,
          currentState: 'completed',
          endTime: new Date()
        },
        gameState: 'completed'
      });
    }
  },

  generateCard: (): BingoCard => {
    const generateColumnNumbers = (min: number, max: number, count: number = 5): number[] => {
      const numbers: number[] = [];
      while (numbers.length < count) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!numbers.includes(num)) {
          numbers.push(num);
        }
      }
      return numbers.sort((a, b) => a - b);
    };

    return {
      B: generateColumnNumbers(1, 15),
      I: generateColumnNumbers(16, 30),
      N: generateColumnNumbers(31, 45),
      G: generateColumnNumbers(46, 60),
      O: generateColumnNumbers(61, 75),
    };
  },

  checkWin: (): boolean => {
    const { currentSession } = get();
    if (!currentSession) return false;

    const { card, drawnNumbers, settings } = currentSession;

    // Create a 5x5 grid to check patterns
    const grid: boolean[][] = Array(5).fill(null).map(() => Array(5).fill(false));
    
    // Mark drawn numbers on the grid
    const columns = ['B', 'I', 'N', 'G', 'O'] as const;
    drawnNumbers.forEach(drawn => {
      const colIndex = columns.indexOf(drawn.letter);
      const rowIndex = card[drawn.letter].indexOf(drawn.number);
      if (rowIndex !== -1) {
        grid[rowIndex][colIndex] = true;
      }
    });

    // Free center space (traditional bingo)
    grid[2][2] = true;

    // If classic category with new configurable rules
    if (settings.patternCategory === 'classic') {
      if (settings.selectedPattern === 'full_house') {
        return checkFullHouse(grid);
      }
      const target = settings.classicLinesTarget || 1;
      const allowed = new Set<ClassicLineType>(settings.classicSelectedLineTypes || []);
      let achieved = 0;

      // Count straight lines
      if (allowed.has('horizontal')) {
        achieved += countCompletedRows(grid);
      }
      if (allowed.has('vertical')) {
        achieved += countCompletedColumns(grid);
      }
      if (allowed.has('diagonal')) {
        achieved += countCompletedDiagonals(grid);
      }

      // Four corners counts as one line equivalent
      if (allowed.has('four_corners') && checkFourCorners(grid)) {
        achieved += 1;
      }

      // Plus and X each count as one line equivalent
      if (allowed.has('plus') && checkPlusSign(grid)) {
        achieved += 1;
      }
      if (allowed.has('x') && checkXShape(grid)) {
        achieved += 1;
      }

      return achieved >= target;
    }

    // Modern patterns
    const pattern = settings.selectedPattern as BingoPattern;
    return checkPatternMatch(grid, pattern);
  },

  resetGame: () => {
    set({ 
      currentSession: null, 
      gameState: 'idle' 
    });
  },
}));

// Pattern checking functions
function checkPatternMatch(grid: boolean[][], pattern: BingoPattern): boolean {
  switch (pattern) {
    case 'one_line':
      return checkOneLine(grid);
    case 'two_lines':
      return checkTwoLines(grid);
    case 'three_lines':
      return checkThreeLines(grid);
    case 'full_house':
      return checkFullHouse(grid);
    case 't_shape':
      return checkTShape(grid);
    case 'u_shape':
      return checkUShape(grid);
    case 'x_shape':
      return checkXShape(grid);
    case 'plus_sign':
      return checkPlusSign(grid);
    case 'diamond':
      return checkDiamond(grid);
    default:
      return false;
  }
}

function checkOneLine(grid: boolean[][]): boolean {
  // Check rows
  for (let i = 0; i < 5; i++) {
    if (grid[i].every(cell => cell)) return true;
  }
  
  // Check columns
  for (let j = 0; j < 5; j++) {
    if (grid.every(row => row[j])) return true;
  }
  
  // Check diagonals
  if (grid.every((row, i) => row[i])) return true;
  if (grid.every((row, i) => row[4 - i])) return true;
  
  return false;
}

function countCompletedRows(grid: boolean[][]): number {
  let count = 0;
  for (let i = 0; i < 5; i++) {
    if (grid[i].every(cell => cell)) count++;
  }
  return count;
}

function countCompletedColumns(grid: boolean[][]): number {
  let count = 0;
  for (let j = 0; j < 5; j++) {
    if (grid.every(row => row[j])) count++;
  }
  return count;
}

function countCompletedDiagonals(grid: boolean[][]): number {
  let count = 0;
  if (grid.every((row, i) => row[i])) count++;
  if (grid.every((row, i) => row[4 - i])) count++;
  return count;
}

function checkFourCorners(grid: boolean[][]): boolean {
  return grid[0][0] && grid[0][4] && grid[4][0] && grid[4][4];
}

function checkTwoLines(grid: boolean[][]): boolean {
  let lineCount = 0;
  
  // Check rows
  for (let i = 0; i < 5; i++) {
    if (grid[i].every(cell => cell)) lineCount++;
  }
  
  return lineCount >= 2;
}

function checkThreeLines(grid: boolean[][]): boolean {
  let lineCount = 0;
  
  // Check rows
  for (let i = 0; i < 5; i++) {
    if (grid[i].every(cell => cell)) lineCount++;
  }
  
  return lineCount >= 3;
}

function checkFullHouse(grid: boolean[][]): boolean {
  return grid.every(row => row.every(cell => cell));
}

function checkTShape(grid: boolean[][]): boolean {
  // Top row complete and middle column complete
  const topRowComplete = grid[0].every(cell => cell);
  const middleColumnComplete = grid.every(row => row[2]);
  
  return topRowComplete && middleColumnComplete;
}

function checkUShape(grid: boolean[][]): boolean {
  // First and last columns complete, and bottom row complete
  const leftColumnComplete = grid.every(row => row[0]);
  const rightColumnComplete = grid.every(row => row[4]);
  const bottomRowComplete = grid[4].every(cell => cell);
  
  return leftColumnComplete && rightColumnComplete && bottomRowComplete;
}

function checkXShape(grid: boolean[][]): boolean {
  // Both diagonals complete
  const mainDiagonal = grid.every((row, i) => row[i]);
  const antiDiagonal = grid.every((row, i) => row[4 - i]);
  
  return mainDiagonal && antiDiagonal;
}

function checkPlusSign(grid: boolean[][]): boolean {
  // Middle row and middle column complete
  const middleRowComplete = grid[2].every(cell => cell);
  const middleColumnComplete = grid.every(row => row[2]);
  
  return middleRowComplete && middleColumnComplete;
}

function checkDiamond(grid: boolean[][]): boolean {
  // Diamond pattern: corners of a diamond shape
  const diamondPositions = [
    [0, 2], [1, 1], [1, 3], [2, 0], [2, 2], [2, 4], [3, 1], [3, 3], [4, 2]
  ];
  
  return diamondPositions.every(([row, col]) => grid[row][col]);
}