'use client';

import React, { useState, useEffect, useCallback } from 'react';

const BOARD_SIZE = 4;
type BoardState = number[][];

interface LeaderboardItem {
  name: string;
  score: number;
  maxTile: number;
}

export default function Game2048() {
  const [username, setUsername] = useState<string>('');
  const [isStarted, setIsStarted] = useState<boolean>(false);

  const [board, setBoard] = useState<BoardState>(() => getInitialBoard());
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [maxTile, setMaxTile] = useState<number>(2);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // Load Kỷ lục và Bảng xếp hạng có tự động reset sau 24h
  useEffect(() => {
    const savedHighScore = localStorage.getItem('game2048_highscore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));

    const now = Date.now();
    const TwentyFourHours = 24 * 60 * 60 * 1000;
    const savedTime = localStorage.getItem('game2048_lb_time');

    if (!savedTime || now - parseInt(savedTime, 10) > TwentyFourHours) {
      localStorage.removeItem('game2048_leaderboard');
      localStorage.setItem('game2048_lb_time', now.toString());
      setLeaderboard([]);
    } else {
      const savedLb = localStorage.getItem('game2048_leaderboard');
      if (savedLb) {
        try {
          setLeaderboard(JSON.parse(savedLb));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  function getInitialBoard(): BoardState {
    let newBoard: BoardState = Array(BOARD_SIZE)
      .fill(0)
      .map(() => Array(BOARD_SIZE).fill(0));
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    return newBoard;
  }

  function addRandomTile(currentBoard: BoardState): BoardState {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (currentBoard[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length === 0) return currentBoard;

    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const clone = currentBoard.map((row) => [...row]);
    clone[r][c] = Math.random() < 0.9 ? 2 : 4;
    return clone;
  }

  function slideRow(row: number[]): { newRow: number[]; gainedScore: number } {
    const arr = row.filter((val) => val !== 0);
    let gainedScore = 0;
    const newRow: number[] = [];

    for (let i = 0; i < arr.length; i++) {
      if (i < arr.length - 1 && arr[i] === arr[i + 1]) {
        const mergedValue = arr[i] * 2;
        newRow.push(mergedValue);
        gainedScore += mergedValue;
        i++;
      } else {
        newRow.push(arr[i]);
      }
    }

    while (newRow.length < BOARD_SIZE) {
      newRow.push(0);
    }

    return { newRow, gainedScore };
  }

  function rotateBoard(currentBoard: BoardState, times: number): BoardState {
    let b = currentBoard.map((row) => [...row]);
    for (let t = 0; t < times; t++) {
      const rotated: BoardState = Array(BOARD_SIZE)
        .fill(0)
        .map(() => Array(BOARD_SIZE).fill(0));
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          rotated[c][BOARD_SIZE - 1 - r] = b[r][c];
        }
      }
      b = rotated;
    }
    return b;
  }

  function boardsEqual(b1: BoardState, b2: BoardState): boolean {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (b1[r][c] !== b2[r][c]) return false;
      }
    }
    return true;
  }

  function checkGameOver(currentBoard: BoardState): boolean {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (currentBoard[r][c] === 0) return false;
      }
    }
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const val = currentBoard[r][c];
        if (c < BOARD_SIZE - 1 && val === currentBoard[r][c + 1]) return false;
        if (r < BOARD_SIZE - 1 && val === currentBoard[r + 1][c]) return false;
      }
    }
    return true;
  }

  const saveScoreToLeaderboard = (finalScore: number, finalMaxTile: number) => {
    if (!username.trim()) return;
    
    const newEntry: LeaderboardItem = {
      name: username.trim(),
      score: finalScore,
      maxTile: finalMaxTile,
    };

    const savedLb = localStorage.getItem('game2048_leaderboard');
    let currentLb: LeaderboardItem[] = savedLb ? JSON.parse(savedLb) : [];

    const existingIndex = currentLb.findIndex(
      (item) => item.name.toLowerCase() === username.trim().toLowerCase()
    );
    
    if (existingIndex !== -1) {
      if (finalScore > currentLb[existingIndex].score) {
        currentLb[existingIndex] = newEntry;
      }
    } else {
      currentLb.push(newEntry);
    }

    const updatedLb = currentLb
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLeaderboard(updatedLb);
    localStorage.setItem('game2048_leaderboard', JSON.stringify(updatedLb));
  };

  const move = useCallback(
    (rotations: number) => {
      if (gameOver) return;

      let workingBoard = rotateBoard(board, rotations);
      let totalGained = 0;
      const newBoardRows: BoardState = [];

      for (let r = 0; r < BOARD_SIZE; r++) {
        const { newRow, gainedScore } = slideRow(workingBoard[r]);
        newBoardRows.push(newRow);
        totalGained += gainedScore;
      }

      let nextBoard = rotateBoard(newBoardRows, (4 - rotations) % 4);

      if (!boardsEqual(board, nextBoard)) {
        nextBoard = addRandomTile(nextBoard);
        setBoard(nextBoard);

        const newScore = score + totalGained;
        setScore(newScore);

        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('game2048_highscore', newScore.toString());
        }

        let currentMax = maxTile;
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (nextBoard[r][c] > currentMax) {
              currentMax = nextBoard[r][c];
            }
          }
        }
        setMaxTile(currentMax);

        saveScoreToLeaderboard(newScore, currentMax);

        if (!won) {
          for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
              if (nextBoard[r][c] === 2048) setWon(true);
            }
          }
        }

        if (checkGameOver(nextBoard)) {
          setGameOver(true);
        }
      }
    },
    [board, gameOver, won, score, highScore, maxTile, username]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isStarted) return;
      let rotations = 0;
      if (e.key === 'ArrowLeft') rotations = 0;
      else if (e.key === 'ArrowUp') rotations = 3;
      else if (e.key === 'ArrowRight') rotations = 2;
      else if (e.key === 'ArrowDown') rotations = 1;
      else return;

      e.preventDefault();
      move(rotations);
    },
    [move, isStarted]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || gameOver || !isStarted) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const minSwipeDistance = 15;

    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      return;
    }

    let rotations = 0;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) rotations = 2;
      else rotations = 0;
    } else {
      if (deltaY > 0) rotations = 1;
      else rotations = 3;
    }

    move(rotations);
    setTouchStart(null);
  };

  const restartGame = () => {
    setBoard(getInitialBoard());
    setScore(0);
    setMaxTile(2);
    setGameOver(false);
    setWon(false);
  };

  const startGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsStarted(true);
    restartGame();
  };

  if (!isStarted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-4 text-white select-none">
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/20 text-center">
          <h1 className="text-4xl font-black mb-2 tracking-wider text-amber-400">2048 Game</h1>
          <p className="text-sm text-stone-300 mb-6">Nhập tên của bạn để bắt đầu thử thách</p>
          
          <form onSubmit={startGame} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nhập tên người chơi..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/30 text-white placeholder-stone-400 focus:outline-none focus:border-amber-400 font-medium text-center text-lg"
              autoFocus
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer text-lg"
            >
              Vào Chơi Ngay
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-900 text-stone-100 p-4 select-none">
      <div className="w-full max-w-md flex flex-col items-center">
        
        <div className="w-full flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-amber-400 tracking-wider">2048</h1>
            <p className="text-xs text-stone-400 font-medium">Xin chào, <span className="text-white font-bold">{username}</span></p>
          </div>

          <div className="flex gap-2">
            <div className="bg-stone-800 border border-stone-700 px-3 py-1.5 rounded-lg text-center shadow">
              <div className="text-[9px] uppercase text-stone-400 font-bold">Điểm</div>
              <div className="text-sm font-black text-white">{score}</div>
            </div>
            <div className="bg-stone-800 border border-stone-700 px-3 py-1.5 rounded-lg text-center shadow">
              <div className="text-[9px] uppercase text-stone-400 font-bold">Kỷ lục</div>
              <div className="text-sm font-black text-amber-400">{highScore}</div>
            </div>
            <div className="bg-stone-800 border border-stone-700 px-3 py-1.5 rounded-lg text-center shadow">
              <div className="text-[9px] uppercase text-stone-400 font-bold">Ô cao nhất</div>
              <div className="text-sm font-black text-emerald-400">{maxTile}</div>
            </div>
          </div>
        </div>

        <div
          className="relative bg-stone-800 border-4 border-stone-700 p-3 rounded-2xl shadow-2xl w-full aspect-square grid grid-cols-4 grid-rows-4 gap-2.5 touch-none overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {board.map((row, rIdx) =>
            row.map((val, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`w-full h-full flex items-center justify-center rounded-xl font-bold transition-all duration-75 shadow-inner ${
                  val === 0 ? 'bg-stone-700/50' : 'relative overflow-hidden border-2 border-pink-300 shadow-md'
                }`}
                style={
                  val !== 0
                    ? {
                        // Sửa đường dẫn từ img-${val}.jpg thành ${val}.jpg để khớp với tên file thực tế trong public/images/
                        backgroundImage: `url('/images/img-${val}.jpg')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : {}
                }
              >
                {val !== 0 && (
                  <span className="absolute bottom-1 right-1.5 bg-black/75 text-white px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-black tracking-wider shadow">
                    {val}
                  </span>
                )}
              </div>
            ))
          )}

          {(gameOver || won) && (
            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center text-white p-4">
              <h2 className="text-3xl font-black mb-2 text-amber-400">
                {won ? '🎉 Bạn Đã Thắng!' : 'Game Over!'}
              </h2>
              <p className="text-xs mb-4 text-stone-300 text-center">
                {won ? 'Tuyệt vời! Bạn đã chạm mốc 2048.' : 'Rất tiếc, không còn nước đi nào.'}
              </p>
              <button
                onClick={restartGame}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                Chơi Lại
              </button>
            </div>
          )}
        </div>

        <div className="w-full flex justify-between items-center mt-4">
          <button
            onClick={restartGame}
            className="flex-1 mr-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 py-2.5 rounded-xl font-bold text-sm shadow transition-all active:scale-95 cursor-pointer text-center"
          >
            🔄 Chơi lại
          </button>
          
          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex-1 ml-2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-sm shadow transition-all active:scale-95 cursor-pointer text-center"
          >
            🏆 Bảng xếp hạng
          </button>
        </div>

        {showLeaderboard && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-stone-900 border border-stone-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-white">
              <div className="flex justify-between items-center mb-4 border-b border-stone-800 pb-3">
                <h3 className="text-lg font-black text-amber-400">🏆 Bảng Xếp Hạng Top 10</h3>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-stone-400 hover:text-white font-bold text-xl px-2 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {leaderboard.length === 0 ? (
                  <p className="text-center text-stone-500 py-6 text-sm">Chưa có lượt chơi nào được ghi nhận.</p>
                ) : (
                  leaderboard.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between items-center px-3 py-2 rounded-xl text-sm font-semibold ${
                        idx === 0 ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' :
                        idx === 1 ? 'bg-slate-400/20 border border-slate-400/40 text-slate-200' :
                        idx === 2 ? 'bg-orange-600/20 border border-orange-600/40 text-orange-300' :
                        'bg-stone-800 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-black w-5 text-center">#{idx + 1}</span>
                        <span className="truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-stone-400">Ô max: {item.maxTile}</span>
                        <span className="font-black text-white">{item.score} đ</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full mt-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        <p className="text-[11px] text-stone-400 mt-4 text-center">
          Dùng phím mũi tên hoặc vuốt trên điện thoại để di chuyển các ô số.
        </p>
      </div>
    </main>
  );
}