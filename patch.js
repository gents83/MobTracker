const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Add locateElapsedMs state
code = code.replace(
  "const [statusText, setStatusText] = useState('');",
  "const [statusText, setStatusText] = useState('');\n  const [locateElapsedMs, setLocateElapsedMs] = useState(0);"
);

// Add useEffect for timer
const useEffectHook = `
  useEffect(() => {
    let intervalId: number;
    if (isLocating) {
      setLocateElapsedMs(0);
      const startTime = Date.now();
      intervalId = window.setInterval(() => {
        setLocateElapsedMs(Date.now() - startTime);
      }, 50);
    }
    return () => clearInterval(intervalId);
  }, [isLocating]);
`;

code = code.replace(
  "const isDark = theme === 'terminal';",
  useEffectHook + "\n  const isDark = theme === 'terminal';"
);

// Update rendering
const oldRadarStatus = `                  <p className={\`mt-6 text-sm font-bold tracking-widest animate-pulse h-6 transition-colors \${isDark ? 'text-emerald-400' : 'text-blue-600'}\`}>
                    {statusText}
                  </p>`;

const newRadarStatus = `                  <div className={\`mt-6 h-6 flex items-center justify-center gap-3 transition-colors \${isDark ? 'text-emerald-400' : 'text-blue-600'}\`}>
                    <p className="text-sm font-bold tracking-widest animate-pulse">
                      {statusText}
                    </p>
                    <span className="font-mono text-xs opacity-70">
                      {(locateElapsedMs / 1000).toFixed(2)}s
                    </span>
                  </div>`;

code = code.replace(oldRadarStatus, newRadarStatus);

fs.writeFileSync('src/App.tsx', code);
