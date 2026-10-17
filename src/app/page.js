'use client';

import { useState, useEffect, useRef } from 'react';
import playersData from '../data/players.json';
import teamsData from '../data/teams.json';

// Alphabetize teams by full name
const sortedTeams = [...teamsData].sort((a, b) => a.name.localeCompare(b.name));

const normalizeText = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['ʻ’.-]/g, '')
    .toLowerCase()
    .trim();
};

const teamAliases = {
  'cavs': 'Cleveland Cavaliers',
  'mavs': 'Dallas Mavericks',
  'wolves': 'Minnesota Timberwolves',
  'twolves': 'Minnesota Timberwolves',
  'blazers': 'Portland Trail Blazers',
  'trailblazers': 'Portland Trail Blazers',
  'sixers': 'Philadelphia 76ers',
  '76ers': 'Philadelphia 76ers',
  'philly': 'Philadelphia 76ers',
  'dubs': 'Golden State Warriors',
  'pels': 'New Orleans Pelicans',
  'spurs': 'San Antonio Spurs',
  'nugs': 'Denver Nuggets',
  'clips': 'Los Angeles Clippers',
  'grizz': 'Memphis Grizzlies',
  'la lakers': 'Los Angeles Lakers',
  'la clippers': 'Los Angeles Clippers',
};

// Mulberry32 seeded PRNG
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDayString() {
  const d = new Date();
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getDailyFive(players, dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = Math.imul(31, hash) + dateStr.charCodeAt(i) | 0;
  }
  const rng = mulberry32(hash);
  const pool = [...players];
  const selected = [];
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(rng() * (pool.length - i)) + i;
    [pool[i], pool[idx]] = [pool[idx], pool[i]];
    selected.push(pool[i]);
  }
  return selected;
}

export default function Home() {
  const todayStr = getDayString();
  const storageKey = `whpf_${todayStr}`;

  const [dailyPlayers, setDailyPlayers] = useState(() => getDailyFive(playersData, todayStr));
  const [round, setRound] = useState(0);
  const [results, setResults] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect' | null
  const [shareText, setShareText] = useState('SHARE RESULTS');
  const [showInfo, setShowInfo] = useState(false);

  const inputRef = useRef(null);
  const ulRef = useRef(null);

  // Restore saved state from localStorage safely on client
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.results)) setResults(parsed.results);
        if (typeof parsed.round === 'number') setRound(parsed.round);
      }
    } catch (e) {
      console.warn('localStorage read skipped:', e);
    }
  }, [storageKey]);

  // Preload next player headshot
  useEffect(() => {
    if (dailyPlayers.length > 0 && round < dailyPlayers.length - 1) {
      const nextPlayer = dailyPlayers[round + 1];
      if (nextPlayer?.image) {
        const img = new Image();
        img.src = nextPlayer.image;
      }
    }
  }, [round, dailyPlayers]);

  useEffect(() => {
    if (focusedIndex >= 0 && ulRef.current) {
      const li = ulRef.current.children[focusedIndex];
      if (li) li.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        ulRef.current &&
        !ulRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const executeNextTurn = () => {
    const nextRound = round + 1;
    setRound(nextRound);
    setInputValue('');
    setShowDropdown(false);
    setFocusedIndex(-1);
    setFeedback(null);

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          round: nextRound,
          results,
        })
      );
    } catch (e) {
      console.warn('localStorage write skipped:', e);
    }

    setTimeout(() => {
      if (inputRef.current && !showInfo && nextRound < 5) {
        inputRef.current.focus();
      }
    }, 10);
  };

  const submitGuess = (team) => {
    if (!team) return;

    const currentPlayer = dailyPlayers[round];
    const isCorrect = team.id === currentPlayer.team_id;
    const newResults = [...results, { player: currentPlayer, selected: team, isCorrect }];

    setResults(newResults);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setShowDropdown(false);
    setFocusedIndex(-1);
    setInputValue(team.name.toUpperCase());

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          round,
          results: newResults,
        })
      );
    } catch (e) {
      console.warn('localStorage write skipped:', e);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFocusedIndex(-1);

    if (value.trim().length > 0) {
      const query = normalizeText(value);
      const matches = sortedTeams.filter((team) => {
        const normName = normalizeText(team.name);
        const normCity = normalizeText(team.city);
        const normNick = normalizeText(team.nickname);
        const normAbbr = normalizeText(team.abbr);

        if (
          normName.includes(query) ||
          normCity.includes(query) ||
          normNick.includes(query) ||
          normAbbr.includes(query)
        ) {
          return true;
        }

        for (const [alias, targetName] of Object.entries(teamAliases)) {
          if (targetName === team.name && (alias.includes(query) || query.includes(alias))) {
            return true;
          }
        }

        return false;
      });

      setFilteredOptions(matches);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleInputKeyDown = (e) => {
    if (!showDropdown || filteredOptions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    let guessToSubmit = null;

    if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
      guessToSubmit = filteredOptions[focusedIndex];
    } else if (filteredOptions.length > 0) {
      guessToSubmit = filteredOptions[0];
    } else {
      const norm = normalizeText(inputValue);
      guessToSubmit = sortedTeams.find((t) => normalizeText(t.name) === norm || normalizeText(t.abbr) === norm);
    }

    if (guessToSubmit) {
      submitGuess(guessToSubmit);
    }
  };

  // Global keydown: Enter to advance when feedback is shown
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showInfo) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          setShowInfo(false);
        }
        return;
      }

      if (e.key === 'Enter' && feedback !== null) {
        e.preventDefault();
        executeNextTurn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, showInfo, round, results]);

  const handleShare = async () => {
    const emojis = results.map((r) => (r.isCorrect ? '🟩' : '🟥')).join(' ');
    const score = results.filter((r) => r.isCorrect).length;
    const text = `who he play for?\nwhpf.pranayvarada.com\ndaily 5: ${todayStr}\n${score}/5\n\n${emojis}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'who he play for?',
          text,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setShareText('COPIED!');
      setTimeout(() => setShareText('SHARE RESULTS'), 2000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const isGameOver = round >= 5;
  const currentPlayer = dailyPlayers[round];
  const score = results.filter((r) => r.isCorrect).length;
  const currentCorrectTeam = currentPlayer
    ? sortedTeams.find((t) => t.id === currentPlayer.team_id)
    : null;

  if (!currentPlayer && !isGameOver) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#F8F9FA] text-[#0A192F] overflow-x-hidden flex flex-col items-center select-none">
      {/* How to Play Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 bg-[#F8F9FA]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[#0A192F] p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative max-h-[95vh] overflow-y-auto">
            <div className="text-center shrink-0 mb-4 border-b-2 border-gray-100 pb-4">
              <h1 className="text-3xl font-black italic leading-none flex items-center justify-center">
                <span className="lowercase text-[#0A192F]">
                  who he play for<span className="text-[#C9082A] font-sans">?</span>
                </span>
              </h1>
              <p className="text-[#C9082A] font-black tracking-widest text-xs lowercase mt-1.5">
                your daily test of ball knowledge
              </p>
            </div>

            <p className="text-sm font-bold text-[#0A192F]/80 mb-6 leading-relaxed px-2">
              How well do you know this season's NBA rosters? Test your knowledge in this daily game inspired by the segment on <i className="font-black">Inside the NBA</i>.
            </p>

            <h2 className="text-xl font-black italic mb-4 text-[#0A192F]">HOW TO PLAY</h2>
            <div className="text-sm sm:text-base font-bold space-y-3 mb-6 text-left px-2 text-[#0A192F]">
              <p>1. Look at the player's headshot.</p>
              <p>2. Type the name or city of the team they currently play for.</p>
              <p>3. Select from the logo dropdown list or hit Enter.</p>
            </div>

            <button
              onClick={() => {
                setShowInfo(false);
                if (inputRef.current && !feedback && !isGameOver) {
                  inputRef.current.focus();
                }
              }}
              className="w-full bg-[#0A192F] text-white font-black uppercase tracking-widest px-6 py-4 hover:bg-[#C9082A] transition-colors border-2 border-[#0A192F] focus:outline-none"
            >
              Let's Go
            </button>

            <div className="mt-8 pt-4 border-t-2 border-gray-100 text-[10px] sm:text-xs text-[#0A192F]/70 font-bold space-y-1">
              <p>A game by <a href="https://www.pranayvarada.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#C9082A]">Pranay Varada</a></p>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-md px-4 h-full flex flex-col pt-6 pb-6 md:pt-16 md:pb-16 relative z-10 flex-1">
        {/* Header */}
        <div className="text-center shrink-0 mb-6">
          <div className="flex justify-center items-center gap-2">
            <h1 className="text-4xl md:text-5xl font-black italic leading-none flex items-baseline lowercase text-[#0A192F]">
              who he play for<span className="text-[#C9082A] font-sans">?</span>
            </h1>
            <button
              onClick={() => setShowInfo(true)}
              className="w-5 h-5 bg-white border-2 border-[#0A192F] text-[#0A192F] font-black not-italic text-xs flex items-center justify-center rounded-full hover:bg-[#E2E8F0] transition-colors leading-none pb-[1px] focus:outline-none shrink-0"
              aria-label="How to play"
            >
              i
            </button>
          </div>
          <p className="text-[#C9082A] font-black tracking-widest text-xs sm:text-sm lowercase mt-1.5">
            your daily test of ball knowledge
          </p>

          {/* Daily 5 Round Progress Tracker */}
          <div className="flex justify-center items-center gap-2 mt-4">
            {[0, 1, 2, 3, 4].map((i) => {
              const res = results[i];
              let bg = 'bg-white';
              if (res) {
                bg = res.isCorrect ? 'bg-[#2A9D8F]' : 'bg-[#C9082A]';
              } else if (i === round && !isGameOver) {
                bg = 'bg-[#1D428A] animate-pulse';
              }
              return (
                <div
                  key={i}
                  className={`w-7 h-7 border-2 border-[#0A192F] transition-all ${bg}`}
                />
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        {!isGameOver ? (
          <>
            {/* Player Card */}
            <div className="flex flex-col items-center shrink-0 mb-6">
              <div
                className="w-[22vh] h-[28vh] max-w-[200px] max-h-[260px] min-w-[130px] min-h-[170px] bg-white border-4 border-[#0A192F] overflow-hidden flex items-center justify-center shadow-xl relative select-none"
                onContextMenu={(e) => e.preventDefault()}
              >
                {currentPlayer?.image ? (
                  <img
                    src={currentPlayer.image}
                    alt={currentPlayer.name}
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    className={`w-full h-full object-cover object-top pointer-events-none select-none ${
                      feedback !== null
                        ? 'scale-100 transition-transform duration-500 ease-out'
                        : 'scale-[1.55]'
                    }`}
                    style={{
                      transformOrigin: '50% 8%',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="font-black text-2xl text-[#0A192F]">?</div>
                )}
                {/* Transparent overlay protecting against mobile long-press image detection */}
                <div
                  className="absolute inset-0 z-10 select-none"
                  style={{ WebkitTouchCallout: 'none' }}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>

              <h2 className="text-3xl md:text-4xl font-black mt-4 text-[#0A192F] tracking-wide text-center leading-tight px-2 uppercase">
                {currentPlayer?.name}
              </h2>
            </div>

            {/* Input + Logo Dropdown OR Feedback Banner */}
            <div className="relative shrink-0 w-full z-30">
              {feedback === null ? (
                <div className="relative w-full h-[72px]">
                  <form onSubmit={handleFormSubmit} className="h-full w-full absolute top-0 left-0">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (inputValue.trim().length > 0) {
                          setShowDropdown(true);
                        }
                      }}
                      onKeyDown={handleInputKeyDown}
                      placeholder="TYPE TEAM..."
                      className="bg-white border-4 border-[#0A192F] p-4 h-full w-full block text-[#0A192F] font-bold text-lg uppercase placeholder-gray-400 focus:outline-none focus:border-[#1D428A] transition-colors"
                      disabled={showInfo}
                      autoComplete="off"
                    />
                  </form>

                  {/* Autocomplete Dropdown with Team Logos & Names */}
                  {showDropdown && !showInfo && (
                    <ul
                      ref={ulRef}
                      className="absolute left-0 right-0 top-full w-full bg-white border-4 border-[#0A192F] border-t-0 shadow-2xl max-h-[35vh] sm:max-h-60 overflow-y-auto scrollbar-thin z-50"
                    >
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((team, index) => (
                          <li
                            key={team.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              submitGuess(team);
                            }}
                            onClick={() => submitGuess(team)}
                            className={`px-4 py-3 sm:py-3.5 cursor-pointer font-bold border-b border-gray-200 last:border-b-0 transition-colors flex items-center gap-3.5 ${
                              index === focusedIndex
                                ? 'bg-[#0A192F] text-white'
                                : 'hover:bg-[#0A192F] hover:text-white text-[#0A192F]'
                            }`}
                          >
                            <img
                              src={team.logo}
                              alt={team.name}
                              className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0"
                            />
                            <div className="flex items-center justify-between flex-1 min-w-0">
                              <span className="font-black text-base sm:text-lg uppercase tracking-wide truncate">
                                {team.name}
                              </span>
                              <span
                                className={`text-xs sm:text-sm font-black uppercase shrink-0 ml-2 ${
                                  index === focusedIndex ? 'text-gray-300' : 'text-gray-400'
                                }`}
                              >
                                {team.abbr}
                              </span>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-3 text-gray-400 font-bold italic uppercase">
                          NO TEAMS FOUND...
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ) : (
                /* Feedback Banner with Team Logo and Next Button */
                <div
                  className={`min-h-[72px] py-2 w-full border-4 flex items-center justify-between px-4 shadow-xl ${
                    feedback === 'correct'
                      ? 'bg-[#2A9D8F] border-[#0A192F] text-white'
                      : 'bg-[#C9082A] border-[#0A192F] text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    {currentCorrectTeam?.logo && (
                      <div className="w-11 h-11 bg-white p-1 rounded-sm border-2 border-[#0A192F] flex items-center justify-center shrink-0 shadow-sm">
                        <img
                          src={currentCorrectTeam.logo}
                          alt={currentCorrectTeam.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-black text-xs uppercase tracking-widest opacity-90 leading-tight">
                        {feedback === 'correct' ? 'CORRECT' : 'HE PLAYS FOR'}
                      </p>
                      <p className="font-black text-lg sm:text-xl uppercase tracking-wider leading-tight truncate">
                        {currentPlayer?.team_name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={executeNextTurn}
                    className="shrink-0 font-black uppercase tracking-widest px-4 py-2 transition-colors flex items-center gap-2 text-sm sm:text-base border-2 bg-[#0A192F] text-white hover:bg-white hover:text-[#0A192F] border-[#0A192F] focus:outline-none"
                  >
                    NEXT <span className="opacity-75">⏎</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Game Over / Results Screen */
          <div className="flex-1 flex flex-col items-center justify-center w-full bg-white border-4 border-[#0A192F] p-4 sm:p-6 mt-4 shadow-2xl mb-6">
            <h2 className="text-3xl md:text-4xl font-black italic mb-1 text-[#0A192F] tracking-tight">
              RESULTS
            </h2>
            <p className="text-sm font-bold text-[#64748B] mb-4 uppercase tracking-widest">
              {todayStr}
            </p>

            <div className="text-6xl font-black text-[#0A192F] mb-6 leading-none">
              {score} <span className="text-3xl text-[#64748B]">/ 5</span>
            </div>

            <div className="w-full max-h-[35vh] overflow-y-auto border-2 border-[#E2E8F0] p-2 mb-6 divide-y divide-gray-100">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 px-2 gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {sortedTeams.find((t) => t.id === r.player.team_id)?.logo && (
                      <img
                        src={sortedTeams.find((t) => t.id === r.player.team_id).logo}
                        alt=""
                        className="w-6 h-6 object-contain shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-black text-[#0A192F] text-sm truncate">
                        {i + 1}. {r.player.name.toUpperCase()}
                      </p>
                      <p className="font-bold text-[#64748B] text-xs uppercase">
                        {r.player.team_name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 font-black shrink-0 border-2 ${
                      r.isCorrect
                        ? 'bg-[#2A9D8F] text-white border-[#0A192F]'
                        : 'bg-[#C9082A] text-white border-[#0A192F]'
                    }`}
                  >
                    {r.isCorrect ? 'CORRECT' : r.selected?.abbr || 'WRONG'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleShare}
              className="w-full bg-[#0A192F] text-white font-black uppercase tracking-widest px-6 py-4 hover:bg-[#1D428A] transition-colors border-2 border-[#0A192F] focus:outline-none"
            >
              {shareText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}