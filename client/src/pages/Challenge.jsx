import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import { Play, CheckSquare, AlertTriangle, ArrowLeft, Terminal as TerminalIcon, FileCode2, Cpu, Zap, Activity, Loader2, ChevronDown, Save, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#18181b',
  color: '#fff',
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

const LANGUAGE_TEMPLATES = {
  c: '#include <stdio.h>\n\nint main() {\n    // Write your C code here\n    printf("Hello World\\n");\n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    cout << "Hello World" << endl;\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your Java code here\n        System.out.println("Hello World");\n    }\n}',
  python: '# Write your Python code here\nprint("Hello World")'
};

export default function Challenge() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedLang, setSelectedLang] = useState('c');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const timeUpNotified = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchQuestion = async () => {
      try {
        const [qRes, rRes] = await Promise.all([
          api.get(`/questions/${slug}`),
          api.get('/rounds')
        ]);
        
        if (!isMounted) return;
        
        const questionData = qRes.data;
        const rounds = rRes.data;
        const activeRound = rounds.find(r => r.status === 'Active');
        
        let timeOver = false;
        if (activeRound) {
          const startTime = new Date(activeRound.updatedAt).getTime();
          const durationMs = activeRound.duration * 60 * 1000;
          if (Date.now() >= startTime + durationMs) timeOver = true;
        }
        
        const questionRoundId = questionData.roundId?._id || questionData.roundId;
        
        if (!activeRound || questionRoundId !== activeRound._id) {
          Toast.fire({ icon: 'error', title: 'This challenge is not currently active.' });
          navigate('/dashboard');
          return;
        }

        if (timeOver) {
          setIsReadOnly(true);
          timeUpNotified.current = true;
        }

        setQuestion(questionData);
        const savedCode = localStorage.getItem(`error404_code_${slug}_c`);
        setCode(savedCode || LANGUAGE_TEMPLATES['c']);
      } catch (error) {
        if (isMounted) {
          Toast.fire({ icon: 'error', title: 'Failed to load challenge' });
          navigate('/dashboard');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchQuestion();
    
    // Also set up a polling interval to lock them out if the round ends while they are coding!
    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get('/rounds');
        const activeRound = res.data.find(r => r.status === 'Active');
        
        let timeOver = false;
        if (activeRound) {
          const startTime = new Date(activeRound.updatedAt).getTime();
          const durationMs = activeRound.duration * 60 * 1000;
          if (Date.now() >= startTime + durationMs) timeOver = true;
        }

        if (!activeRound || timeOver) {
          if (isMounted && !timeUpNotified.current) {
            setIsReadOnly(true);
            timeUpNotified.current = true;
            Toast.fire({ icon: 'info', title: 'Time is up! Editor is now locked.' });
          }
        }
      } catch (e) {
        // ignore errors on polling
      }
    }, 1000);
    
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [slug, navigate]);

  const handleSave = () => {
    localStorage.setItem(`error404_code_${slug}_${selectedLang}`, code);
    Toast.fire({ icon: 'success', title: 'Code saved successfully' });
  };

  const handleReset = () => {
    Swal.fire({
      title: 'Reset Code?',
      text: "Are you sure you want to reset to the default template? This will erase your current code.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Yes, reset it!',
      background: '#18181b',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        setCode(LANGUAGE_TEMPLATES[selectedLang]);
        localStorage.removeItem(`error404_code_${slug}_${selectedLang}`);
        Toast.fire({ icon: 'success', title: 'Code reset to default' });
      }
    });
  };

  const handleSubmit = async () => {
    if (!code.trim()) return Toast.fire({ icon: 'error', title: 'Code cannot be empty' });
    
    setSubmitting(true);
    setResult({ status: 'executing' });
    
    try {
      const res = await api.post(`/submissions/${question._id}`, { sourceCode: code, language: selectedLang });
      setResult(res.data);
    } catch (error) {
      setResult({ verdict: 'Error', errorMessage: error.response?.data?.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !question) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-mono">
        <Loader2 className="animate-spin text-white mb-4" size={48} />
        <div className="text-xl font-bold tracking-widest text-white drop-shadow-md">
          INITIALIZING SECURE ENVIRONMENT...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col h-screen overflow-hidden font-sans">
      <Navbar />
      
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
        
        {/* Left Side Container */}
        <div className="w-full lg:w-1/2 flex flex-col gap-3">
          
          {/* Back Button outside the code block */}
          <div className="flex items-center">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold font-mono">
              <ArrowLeft size={16} /> RETURN
            </button>
          </div>

          {/* Editor Workstation */}
          <div className="flex-1 flex flex-col relative rounded-xl border border-zinc-800 bg-[#0a0a0a] shadow-2xl overflow-hidden">
            
            {/* Editor Header */}
            <div className="bg-zinc-900 border-b border-zinc-800 flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Fake Window Controls */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="h-4 w-px bg-zinc-700 ml-2"></div>
                <div className="flex items-center gap-2 text-zinc-400 ml-1">
                  <FileCode2 size={14} />
                  <span className="text-xs font-mono font-bold tracking-wider">
                    main.{selectedLang === 'python' ? 'py' : selectedLang === 'java' ? 'java' : selectedLang === 'c' ? 'c' : 'cpp'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Custom Language Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsLangDropdownOpen(false), 200)}
                    className="flex items-center gap-2 bg-[#050505] border border-zinc-700 text-white font-mono text-xs px-3 py-2 rounded-md outline-none cursor-pointer hover:border-gray-500 transition-colors w-[90px] justify-between shadow-sm"
                  >
                    <span>{selectedLang === 'python' ? 'Python' : selectedLang === 'java' ? 'Java' : selectedLang === 'c' ? 'C' : 'C++'}</span>
                    <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isLangDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-[#1e1e1e] border border-zinc-600 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
                      {['c', 'cpp', 'java', 'python'].map(lang => (
                        <div 
                          key={lang}
                          onClick={() => { 
                            // Auto-save current before switching
                            localStorage.setItem(`error404_code_${slug}_${selectedLang}`, code);
                            setSelectedLang(lang); 
                            const savedCode = localStorage.getItem(`error404_code_${slug}_${lang}`);
                            setCode(savedCode || LANGUAGE_TEMPLATES[lang]);
                            setIsLangDropdownOpen(false); 
                          }}
                          className={`px-3 py-2.5 font-mono text-xs cursor-pointer transition-colors ${selectedLang === lang ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-white'}`}
                        >
                          {lang === 'python' ? 'Python' : lang === 'java' ? 'Java' : lang === 'c' ? 'C' : 'C++'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleReset}
                    disabled={isReadOnly}
                    className="flex items-center gap-2 bg-zinc-800/50 text-zinc-400 px-4 py-2 rounded-lg font-bold hover:bg-zinc-700 hover:text-white transition-all text-sm shadow-sm border border-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Reset to default template"
                  >
                    <RotateCcw size={16} />
                    RESET
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isReadOnly}
                    className="flex items-center gap-2 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-bold hover:bg-zinc-700 hover:text-white transition-all text-sm shadow-sm border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={16} /> 
                    SAVE
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={submitting || isReadOnly}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-lg font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                  >
                    {submitting ? <Play size={16} className="animate-spin" /> : <Zap size={16} />} 
                    {submitting ? 'EXECUTING...' : 'RUN CODE'}
                  </button>
                </div>
              </div>
            </div>
          
          <div className="flex-1 relative bg-[#1e1e1e] pt-2">
            <Editor
              key={selectedLang}
              height="100%"
              theme="custom-dark"
              language={`my-${selectedLang}`}
              value={code}
              onChange={(value) => setCode(value)}
              beforeMount={(monaco) => {
                // Create completely custom, error-proof languages
                ['my-c', 'my-cpp', 'my-java', 'my-python'].forEach(lang => {
                  monaco.languages.register({ id: lang });
                  monaco.languages.setMonarchTokensProvider(lang, {
                    tokenizer: {
                      root: [
                        // Comments — highest priority
                        [/\/\/.*$/, 'comment'],
                        [/#.*$/, 'comment'],

                        // Brackets — ALWAYS fixed color, never consumed by strings
                        [/[{}()\[\]]/, 'delimiter.bracket'],

                        // Semicolons & commas — ALWAYS fixed color
                        [/[;,]/, 'delimiter'],

                        // Keywords — before function so 'return(0)' is keyword not function
                        [/\b(int|float|double|char|void|return|if|else|for|while|do|switch|case|break|continue|include|public|private|protected|class|static|System|out|println|print|printf|scanf|def|using|namespace|std|cout|cin|endl|String|args|import|from|main|struct|const|unsigned|signed|long|short|enum|typedef|new|try|catch|throw|throws|final|abstract|boolean|true|false|null|None|self|elif|lambda|pass|raise|with|as|yield|string|auto|register|extern|volatile|sizeof|goto|default|union)\b/, 'keyword'],

                        // Function calls — identifier followed by (
                        [/\b[a-zA-Z_]\w*(?=\s*\()/, 'function'],

                        // Numbers
                        [/\b\d+\.?\d*\b/, 'number'],

                        // Strings — regex EXCLUDES brackets, semicolons, commas so those tokens
                        // are never swallowed into string coloring, even in broken/unclosed strings
                        [/"[^"'\\{}()\[\];,]*(?:\\.[^"'\\{}()\[\];,]*)*["']?/, 'string'],
                        [/'[^"'\\{}()\[\];,]*(?:\\.[^"'\\{}()\[\];,]*)*["']?/, 'string'],

                        // Operators
                        [/[<>]=?|[!=]=|&&|\|\||<<|>>|[+\-*/%=!&|^~?:.]/, 'operator'],

                        // Identifiers
                        [/\b[a-zA-Z_]\w*\b/, 'identifier'],
                      ]
                    }
                  });
                });

                monaco.editor.defineTheme('custom-dark', {
                  base: 'vs-dark',
                  inherit: true,
                  rules: [
                    { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
                    { token: 'function', foreground: 'dcdcaa' },
                    { token: 'string', foreground: 'ce9178' },
                    { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
                    { token: 'number', foreground: 'b5cea8' },
                    { token: 'delimiter.bracket', foreground: 'ffd700' },
                    { token: 'delimiter', foreground: 'd4d4d4' },
                    { token: 'operator', foreground: 'd4d4d4' },
                    { token: 'identifier', foreground: '9cdcfe' },
                    { token: '', foreground: 'd4d4d4' }
                  ],
                  colors: {
                    'editorError.foreground': '#00000000',
                    'editorWarning.foreground': '#00000000',
                    'editorInfo.foreground': '#00000000',
                    'editorError.border': '#00000000',
                    'editorWarning.border': '#00000000',
                  }
                });
              }}
              onMount={(editor, monaco) => {
                monaco.editor.setModelMarkers(editor.getModel(), 'owner', []);
              }}
              options={{
                readOnly: isReadOnly,
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                lineHeight: 24,
                padding: { top: 16, bottom: 24 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnPaste: true,
                renderLineHighlight: "all",
                // Disable all error/warning indicators
                renderValidationDecorations: "off",
                glyphMargin: false,
                lightbulb: { enabled: "off" },
                quickSuggestions: false,
                parameterHints: { enabled: false },
                suggestOnTriggerCharacters: false,
                hover: { enabled: false },
              }}
            />
          </div>
        </div>
        </div>

        {/* Right Side - Intelligence & Terminal */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          
          {/* Top - Challenge Info */}
          <div className="rounded-xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden flex flex-col shadow-2xl relative">
            {/* Ambient background glow */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-900/10 blur-[100px]"></div>
            </div>

            <div className="p-6 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-emerald-500 font-mono text-xs font-bold tracking-widest mb-1 flex items-center gap-2">
                    <Cpu size={14} /> CHALLENGE
                  </div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">{question.title.replace(/\s*\(.*?\)\s*$/, '')}</h1>
                </div>
                
                <div className="flex flex-col items-end gap-2 font-mono text-xs">
                  <span className="px-3 py-1 rounded-full bg-zinc-800/80 text-gray-300 border border-zinc-700 shadow-inner">
                    {question.difficulty.toUpperCase()}
                  </span>
                  <span className="text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    +{question.xpReward} XP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom - Output Cards and Terminal */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
            
            {/* Output Comparison Cards - Always Visible */}
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="rounded-xl border border-blue-900/30 bg-[#0a1120] flex flex-col shadow-lg overflow-hidden">
                <div className="bg-blue-950/40 border-b border-blue-900/30 px-4 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">Target Output</span>
                </div>
                <div className="p-4 font-mono text-sm text-blue-300 whitespace-pre-wrap">
                  {question?.hiddenTestCases?.[0]?.expectedOutput || <span className="opacity-50 italic">Empty output expected</span>}
                </div>
              </div>

              <div className={`rounded-xl border flex flex-col shadow-lg overflow-hidden ${!result || result.status === 'executing' ? 'border-zinc-800/50 bg-[#0a0a0a]' : result.verdict === 'Accepted' ? 'border-emerald-900/30 bg-[#061e12]' : 'border-red-900/30 bg-[#1e0a0a]'}`}>
                <div className={`border-b px-4 py-2 flex items-center gap-2 ${!result || result.status === 'executing' ? 'bg-zinc-900/50 border-zinc-800/50' : result.verdict === 'Accepted' ? 'bg-emerald-950/40 border-emerald-900/30' : 'bg-red-950/40 border-red-900/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${!result || result.status === 'executing' ? 'bg-zinc-600' : result.verdict === 'Accepted' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <span className={`text-xs font-bold tracking-widest uppercase ${!result || result.status === 'executing' ? 'text-zinc-500' : result.verdict === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>Your Output</span>
                </div>
                <div className={`p-4 font-mono text-sm whitespace-pre-wrap ${!result || result.status === 'executing' ? 'text-zinc-600' : result.verdict === 'Accepted' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {!result ? (
                    <span className="opacity-50 italic">Not executed yet. Run code to see output.</span>
                  ) : result.status === 'executing' ? (
                    <span className="text-emerald-500/80 animate-pulse italic">Executing...</span>
                  ) : (
                    result.actualOutput || result.errorMessage || <span className="opacity-50 italic">No output produced</span>
                  )}
                </div>
              </div>
            </div>

            {/* Terminal Window */}
            <div className="flex-1 min-h-[200px] rounded-xl border border-zinc-800 bg-[#050505] flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Terminal Header */}
            <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {/* Fake Window Controls */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="h-4 w-px bg-zinc-700 ml-2"></div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <TerminalIcon size={14} />
                  <span className="text-xs font-mono font-bold tracking-wider">SYSTEM.OUT</span>
                </div>
              </div>
            </div>
            
            {/* Terminal Body */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-sm custom-scrollbar bg-black/50">
              {!result ? (
                <div className="text-zinc-600 flex flex-col items-center h-full justify-center opacity-50 select-none">
                  <TerminalIcon size={48} className="mb-4 text-zinc-800" />
                  <div>&gt; _ WAITING FOR COMPILE COMMAND</div>
                </div>
              ) : result.status === 'executing' ? (
                <div className="text-emerald-500/80 animate-pulse font-bold tracking-wider">
                  &gt; Establishing secure connection...<br/>
                  &gt; Compiling payload...<br/>
                  &gt; Executing test cases...<br/>
                  <span className="inline-block mt-2 px-2 py-1 bg-emerald-950 text-emerald-400 rounded text-xs">PROCESSING...</span>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  <div className="font-mono text-sm leading-relaxed">
                    <div className="text-zinc-500 mb-4 select-none">
                      user@error404:~/workspace$ {selectedLang === 'python' ? 'python3 main.py' : selectedLang === 'c' ? 'gcc main.c -o main && ./main' : selectedLang === 'cpp' ? 'g++ main.cpp -o main && ./main' : 'javac Main.java && java Main'}
                    </div>
                    
                    {result.verdict === 'Compilation Error' ? (
                      <div className="text-red-400">
                        <div>&gt; Compiling code... <span className="text-red-500 font-bold">[FAILED]</span></div>
                        <div className="mt-4 text-red-500/80 text-xs pl-3 border-l-2 border-red-900/50">
                          {result.errorMessage && result.errorMessage.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                        </div>
                        <div className="mt-6 text-red-500 font-black tracking-widest text-lg drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                          [COMPILATION ERROR]
                        </div>
                      </div>
                    ) : (
                      <div>
                        {selectedLang !== 'python' && <div className="text-zinc-400">&gt; Compiling code... <span className="text-emerald-500 font-bold">[OK]</span></div>}
                        <div className="text-zinc-400">&gt; Executing program... <span className="text-emerald-500 font-bold">[OK]</span></div>
                        <div className="text-zinc-400">&gt; Checking test cases...</div>
                        
                        {result.verdict === 'Accepted' ? (
                          <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="text-emerald-400">&gt; Output matched expected target.</div>
                            <div className="mt-6 text-emerald-500 font-black tracking-widest text-lg drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                              [ACCEPTED] ALL TEST CASES PASSED
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="text-red-400">&gt; Output did not match expected result.</div>
                            {result.errorMessage && (
                              <div className="mt-4 text-red-500/80 text-xs pl-3 border-l-2 border-red-900/50">
                                {result.errorMessage.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                              </div>
                            )}
                            <div className="mt-6 text-red-500 font-black tracking-widest text-lg drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                              [{result.verdict.toUpperCase()}]
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
