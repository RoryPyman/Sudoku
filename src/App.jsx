import { useTimer } from './hooks/useTimer.js';
import { useSudoku } from './hooks/useSudoku.js';
import Board from './components/Board.jsx';
import Controls from './components/Controls.jsx';
import HintPanel from './components/HintPanel.jsx';
import NumberPad from './components/NumberPad.jsx';
import WinModal from './components/WinModal.jsx';

export default function App() {
  const timer = useTimer();

  const sudoku = useSudoku(timer.start, timer.stop, timer.reset);

  const { newGame, difficulty } = sudoku;

  return (
    <div className="relative z-[1] flex flex-col min-h-dvh px-4 pb-8 bg-bg">

      {/* Animated dot-grid background */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none animate-bg-drift bg-[image:linear-gradient(rgba(201,169,110,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(201,169,110,.03)_1px,transparent_1px)] bg-[size:40px_40px]"
        aria-hidden="true"
      />

      {/* Header */}
      <header className="text-center pt-6 pb-3">
        <h1 className="font-title text-[clamp(2rem,5vw,3.25rem)] font-bold text-accent tracking-[.04em] [text-shadow:0_0_40px_rgba(201,169,110,.35)]">
          Sudoku
        </h1>
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center gap-4 w-full max-w-[900px] mx-auto">

        <Controls
          difficulty={sudoku.difficulty}
          onDifficulty={sudoku.setDifficulty}
          onNewGame={newGame}
          onUndo={sudoku.undo}
          canUndo={sudoku.canUndo}
          timerFormatted={timer.formatted}
          won={sudoku.won}
        />

        {/* Board + sidebar */}
        <div className="flex flex-row items-start gap-6 w-full justify-center max-[700px]:flex-col max-[700px]:items-center">

          {/* Board + mobile number pad */}
          <div className="flex flex-col items-center gap-4">
            <Board
              grid={sudoku.grid}
              given={sudoku.given}
              selected={sudoku.selected}
              conflicts={sudoku.conflicts}
              highlights={sudoku.highlights}
              sameValueCells={sudoku.sameValueCells}
              spotlightCell={sudoku.spotlightCell}
              eliminationInfo={sudoku.eliminationInfo}
              onSelect={sudoku.setSelected}
            />
            <NumberPad
              onInput={sudoku.inputNumber}
              selected={sudoku.selected}
              given={sudoku.given}
            />
          </div>

          {/* Hint sidebar */}
          <aside className="w-[220px] flex-shrink-0 max-[700px]:w-[min(540px,94vw)]">
            <HintPanel
              hintType={sudoku.hintType}
              onHintType={sudoku.setHintType}
              onUseHint={sudoku.useHint}
              hintsUsed={sudoku.hintsUsed}
              eliminationInfo={sudoku.eliminationInfo}
              strategyInfo={sudoku.strategyInfo}
              won={sudoku.won}
            />
          </aside>
        </div>
      </main>

      {/* Win overlay */}
      {sudoku.won && (
        <WinModal
          timerFormatted={timer.formatted}
          difficulty={difficulty}
          hintsUsed={sudoku.hintsUsed}
          onNewGame={() => newGame(difficulty)}
        />
      )}
    </div>
  );
}
