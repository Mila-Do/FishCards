import { useState, useEffect, useRef } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  const displayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.style.transform = "scale(1.1)";
      const timer = setTimeout(() => {
        if (displayRef.current) {
          displayRef.current.style.transform = "scale(1)";
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [count]);

  const handleIncrease = () => {
    setCount((prev) => prev + 1);
  };

  const handleDecrease = () => {
    setCount((prev) => prev - 1);
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-2xl shadow-xl border border-teal-200/50 dark:border-teal-800/50 p-12 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
        <h2 className="text-2xl font-semibold text-teal-800 dark:text-teal-200 text-center mb-8">Counter</h2>
        <div
          ref={displayRef}
          className="text-7xl font-bold text-teal-600 dark:text-teal-400 text-center mb-10 transition-all duration-200 select-none"
        >
          {count}
        </div>
        <div className="flex items-center justify-center gap-6">
          <button
            className="w-16 h-16 rounded-full flex items-center justify-center bg-teal-500 hover:bg-teal-600 active:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 dark:active:bg-teal-400 text-white shadow-lg hover:shadow-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:focus-visible:ring-teal-700 active:scale-95 cursor-pointer"
            onClick={handleDecrease}
            aria-label="Decrease counter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button
            className="w-16 h-16 rounded-full flex items-center justify-center bg-teal-500 hover:bg-teal-600 active:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 dark:active:bg-teal-400 text-white shadow-lg hover:shadow-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:focus-visible:ring-teal-700 active:scale-95 cursor-pointer"
            onClick={handleIncrease}
            aria-label="Increase counter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
