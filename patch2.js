const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Add pollingInterval state
code = code.replace(
  "const [isPairPolling, setIsPairPolling] = useState(false);",
  "const [isPairPolling, setIsPairPolling] = useState(false);\n  const [pollingInterval, setPollingInterval] = useState(5000);"
);

// Update poll timeout and dependencies
code = code.replace(
  "timeoutId = window.setTimeout(poll, 3000);",
  "timeoutId = window.setTimeout(poll, pollingInterval);"
);

code = code.replace(
  "  }, [pairId, isPairPolling, addToHistory]);",
  "  }, [pairId, isPairPolling, addToHistory, pollingInterval]);"
);

fs.writeFileSync('src/App.tsx', code);
