import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer }   from '../hooks/useTimer.js';
import { useSudoku }  from '../hooks/useSudoku.js';
import { useAuth }    from '../context/AuthContext.jsx';
import { gamesApi }   from '../api/games.js';
import Board           from '../components/Board.jsx';
import Controls        from '../components/Controls.jsx';
import HintPanel       from '../components/HintPanel.jsx';
import HintExplanation from '../components/HintExplanation.jsx';
import NumberPad       from '../components/NumberPad.jsx';
import WinModal        from '../components/WinModal.jsx';

export default function GamePage() {
  const timer  = useTimer();
  const sudoku = useSudoku(timer.start, timer.stop, timer.reset);
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { newGame, difficulty } = sudoku;

  // ── Save completed game ───────────────────────────────────────────────────
  useEffect(() => {
    if (!sudoku.won || !user || timer.seconds === 0) return;
    gamesApi
      .create({
        difficulty:  sudoku.difficulty,
        puzzle:      sudoku.puzzleStr,
        solution:    sudoku.solutionStr,
        userGrid:    sudoku.grid.join(''),
        hintsUsed:   sudoku.hintsUsed,
        timeSeconds: timer.seconds,
      })
      .catch(() => {});
  }, [sudoku.won]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col min-h-[calc(100dvh-2.75rem)] px-4 pb-8">

      <header className="text-center pt-6 pb-3">
        <h1 className="font-title text-[clamp(2rem,5vw,3.25rem)] font-bold text-accent tracking-[.04em] [text-shadow:0_0_40px_rgba(201,169,110,.35)]">
          Sudoku
        </h1>
      </header>

      <main className="flex flex-col items-center gap-4 w-full max-w-[900px] mx-auto">
        <Controls
          difficulty={sudoku.difficulty}
          onDifficulty={sudoku.setDifficulty}
          onNewGame={newGame}
          onUndo={sudoku.undo}
          canUndo={sudoku.canUndo}
          timerFormatted={timer.formatted}
          won={sudoku.won}
          notesMode={sudoku.notesMode}
          onToggleNotes={() => sudoku.setNotesMode(m => !m)}
        />

        <div className="flex flex-row items-start gap-6 w-full justify-center max-[700px]:flex-col max-[700px]:items-center">
          <div className="flex flex-col items-center gap-3">
            <Board
              grid={sudoku.grid}
              given={sudoku.given}
              selected={sudoku.selected}
              conflicts={sudoku.conflicts}
              highlights={sudoku.highlights}
              sameValueCells={sudoku.sameValueCells}
              hintResult={sudoku.hintResult}
              notes={sudoku.notes}
              onSelect={sudoku.setSelected}
            />

            <HintExplanation
              hintResult={sudoku.hintResult}
              onDismiss={sudoku.clearHint}
            />

            <NumberPad
              onInput={sudoku.inputNumber}
              selected={sudoku.selected}
              given={sudoku.given}
              notesMode={sudoku.notesMode}
            />
          </div>

          <aside className="w-[220px] flex-shrink-0 max-[700px]:w-[min(540px,94vw)]">
            <HintPanel
              hintType={sudoku.hintType}
              onHintType={sudoku.setHintType}
              onUseHint={sudoku.useHint}
              hintsUsed={sudoku.hintsUsed}
              won={sudoku.won}
            />
          </aside>
        </div>
      </main>

      {sudoku.won && (
        <WinModal
          timerFormatted={timer.formatted}
          difficulty={difficulty}
          hintsUsed={sudoku.hintsUsed}
          onNewGame={() => newGame(difficulty)}
          onViewStats={user ? () => navigate('/stats') : null}
        />
      )}
    </div>
  );
}
