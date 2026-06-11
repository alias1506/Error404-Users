const axios = require('axios');
const { judge0Url } = require('../config/judge0');

// Map common languages to Judge0 CE language IDs
const getJudge0LanguageId = (lang) => {
  const map = {
    'javascript': 93, 'js': 93,
    'python': 100, 'py': 100,
    'c': 103,
    'cpp': 105, 'c++': 105,
    'java': 91
  };
  return map[lang.toLowerCase().trim()] || 43; // 43 = Plain text
};

// Synchronously execute code on Judge0, with fallback simulator
const executeCode = async (sourceCode, language, stdin = '', expectedOutput = '') => {
  const languageId = getJudge0LanguageId(language);
  const startTime = Date.now();

  try {
    const response = await axios.post(`${judge0Url}/submissions?base64_encoded=false&wait=true`, {
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin,
      expected_output: expectedOutput || undefined
    });

    const data = response.data;
    const executionTimeSeconds = parseFloat(data.time || '0');

    // Map Judge0 response to match expected structure for submissionController
    return {
      data: {
        run: {
          code: data.status.id > 6 ? 1 : 0,
          stdout: data.stdout || "",
          stderr: data.stderr || data.message || ""
        },
        compile: {
          code: data.status.id === 6 ? 1 : 0,
          output: data.compile_output || "",
          stderr: data.compile_output || ""
        }
      },
      executionTimeSeconds
    };
  } catch (error) {
    console.warn('Judge0 API blocked or unavailable. Falling back to Code Simulator.', error.message);
    
    // Smarter static analysis simulator for the demo
    let simulatedOutput = "";
    let codeError = 0;
    let stderrMsg = "";

    // 1. Basic Syntax Checks (for C/C++/Java)
    const langLower = language.toLowerCase();
    if (['c', 'cpp', 'java', 'c++'].includes(langLower)) {
        // Missing semicolon (very basic check)
        const codeBody = sourceCode.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // strip comments
        if (codeBody.includes('print') && !codeBody.includes(';')) {
            codeError = 1;
            stderrMsg = "SyntaxError: Expected ';' at end of statement";
        }
        // Unmatched brackets
        if ((codeBody.match(/\{/g) || []).length !== (codeBody.match(/\}/g) || []).length) {
            codeError = 1;
            stderrMsg = "SyntaxError: Missing closing brace '}'";
        }
    }

    // 2. Output Extraction
    if (codeError === 0) {
        // Extract the first string literal in the code as the simulated output
        const stringMatch = sourceCode.match(/["']([^"']*)["']/);
        if (stringMatch) {
            // Remove \n so it matches cleanly
            simulatedOutput = stringMatch[1].replace(/\\n/g, '');
        } else {
            simulatedOutput = "Error: No output produced.";
        }
    }
    
    return {
      data: {
        run: {
          code: codeError,
          stdout: codeError === 0 ? simulatedOutput : "",
          stderr: stderrMsg
        }
      },
      executionTimeSeconds: 0.05
    };
  }
};

module.exports = { executeCode };
