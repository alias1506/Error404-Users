import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import { Play, CheckSquare, AlertTriangle, ArrowLeft, Terminal as TerminalIcon, FileCode2, Cpu, Zap, Activity, Loader2, ChevronDown, Save, RotateCcw, Send, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { useAntiCheat } from '../context/AntiCheatContext';

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
  const { user } = useAuthStore();
  const { isDisqualified } = useAntiCheat();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedLang, setSelectedLang] = useState('c');
  const [lastSavedCode, setLastSavedCode] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [hasSubmittedMode, setHasSubmittedMode] = useState(false);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const timeUpNotified = useRef(false);
  const codeRef = useRef(code);
  const langRef = useRef(selectedLang);
  const questionRef = useRef(question);

  const [copyMenu, setCopyMenu] = useState(null);
  const [pasteMenu, setPasteMenu] = useState(null);
  const internalClipboard = useRef('');
  const editorRef = useRef(null);

  const handleCopy = () => {
    if (copyMenu?.text) {
      internalClipboard.current = copyMenu.text;
      setCopyMenu(null);
      Toast.fire({ icon: 'success', title: 'Copied!' });
    }
  };

  const handlePaste = () => {
    const editor = editorRef.current;
    if (editor && internalClipboard.current) {
      const selection = editor.getSelection();
      editor.executeEdits("custom-paste", [{
        range: selection,
        text: internalClipboard.current,
        forceMoveMarkers: true
      }]);
      setPasteMenu(null);
    }
  };

  useEffect(() => {
    codeRef.current = code;
    langRef.current = selectedLang;
    questionRef.current = question;
  }, [code, selectedLang, question]);

  useEffect(() => {
    if (isDisqualified) {
      navigate('/dashboard');
    }
  }, [isDisqualified, navigate]);

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
        
        let alreadySubmittedCode = null;
        let submittedLanguage = 'c';
        
        try {
          const subRes = await api.get('/submissions/my');
          if (isMounted) {
            setUserSubmissions(subRes.data);
            const alreadySubmitted = subRes.data.find(s => 
              (s.question?._id === questionData._id || s.question?.slug === slug) && 
              s.type === 'Submit'
            );
            if (alreadySubmitted) {
              setIsReadOnly(true);
              setHasSubmittedMode(true);
              alreadySubmittedCode = alreadySubmitted.codeSubmitted;
              if (alreadySubmitted.language) submittedLanguage = alreadySubmitted.language;
            }
          }
        } catch (e) {
          console.error("Failed to fetch user submissions", e);
        }

        if (alreadySubmittedCode) {
          setSelectedLang(submittedLanguage);
          setCode(alreadySubmittedCode);
          setLastSavedCode(alreadySubmittedCode);
        } else {
          const langObj = questionData.codes?.find(c => c.language === 'c');
          const initialCode = langObj ? langObj.buggyCode : LANGUAGE_TEMPLATES['c'];
          setCode(initialCode);
          setLastSavedCode(initialCode);
        }
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
    let intervalId = null;

    const checkTime = async () => {
      try {
        const res = await api.get('/rounds');
        const activeRound = res.data.find(r => r.status === 'Active');
        
        if (!activeRound) {
          if (isMounted && !timeUpNotified.current) {
            setIsReadOnly(true);
            timeUpNotified.current = true;
            Toast.fire({ icon: 'info', title: 'Round is not active. Editor is locked.' });
          }
          return;
        }

        const startTime = new Date(activeRound.updatedAt).getTime();
        const durationMs = activeRound.duration * 60 * 1000;

        const evaluateTime = () => {
          if (Date.now() >= startTime + durationMs) {
            if (isMounted && !timeUpNotified.current) {
              setIsReadOnly(true);
              timeUpNotified.current = true;
              
              const currentCode = codeRef.current;
              const currentLang = langRef.current;
              const currentQuestion = questionRef.current;
              
              if (currentQuestion && currentCode && currentCode.trim()) {
                api.post(`/submissions/${currentQuestion._id}`, { sourceCode: currentCode, language: currentLang, isSaveOnly: true })
                  .then(() => {
                    Toast.fire({ icon: 'info', title: 'Time is up! Your code has been auto-saved. Editor is locked.' });
                  })
                  .catch((err) => {
                    console.error("Auto-save failed", err);
                    Toast.fire({ icon: 'warning', title: 'Time is up! Editor locked, but auto-save failed.' });
                  });
              } else {
                Toast.fire({ icon: 'info', title: 'Time is up! Editor is now locked.' });
              }
            }
            if (intervalId) clearInterval(intervalId);
          } else if (isMounted && timeUpNotified.current) {
            // In case round was restarted
            setIsReadOnly(false);
            timeUpNotified.current = false;
          }
        };

        evaluateTime(); // Check immediately
        
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(evaluateTime, 1000); // Check every second

      } catch (e) {
        console.error('Failed to process round status', e);
      }
    };

    checkTime();
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
    const socketUrl = apiUrl.replace('/api', '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('round-updated', () => {
      checkTime();
    });
    
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      socket.disconnect();
    };
  }, [slug, navigate]);

  const handleSave = async () => {
    if (!code.trim()) return Toast.fire({ icon: 'error', title: 'Code cannot be empty' });
    if (code === lastSavedCode) return;

    setIsSaving(true);
    try {
      await api.post(`/submissions/${question._id}`, { sourceCode: code, language: selectedLang, isSaveOnly: true });
      localStorage.setItem(`error404_code_${slug}_${selectedLang}`, code);
      
      // Update the userSubmissions state to reflect this save
      setUserSubmissions(prev => {
        const newSave = { question: { _id: question._id }, language: selectedLang, codeSubmitted: code, type: 'Save', createdAt: new Date().toISOString() };
        return [newSave, ...prev];
      });

      setLastSavedCode(code);
      Toast.fire({ icon: 'success', title: 'Code saved to submissions!' });
    } catch (error) {
      Toast.fire({ icon: 'error', title: error.response?.data?.message || 'Failed to save code' });
    } finally {
      setIsSaving(false);
    }
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
      color: '#fff',
      customClass: {
        popup: 'rounded-xl border border-zinc-800',
        confirmButton: 'rounded-lg',
        cancelButton: 'rounded-lg'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const langObj = question?.codes?.find(c => c.language === selectedLang);
        const dbBuggyCode = langObj ? langObj.buggyCode : LANGUAGE_TEMPLATES[selectedLang];
        setCode(dbBuggyCode);
        Toast.fire({ icon: 'success', title: 'Code reset to default' });
      }
    });
  };

  const handleRunCode = async () => {
    if (!code.trim()) return Toast.fire({ icon: 'error', title: 'Code cannot be empty' });
    
    setIsRunning(true);
    setResult({ status: 'executing' });
    
    try {
      const res = await api.post(`/submissions/${question._id}`, { sourceCode: code, language: selectedLang, isRunOnly: true });
      setResult(res.data);
    } catch (error) {
      setResult({ verdict: 'Error', errorMessage: error.response?.data?.message || 'Execution failed' });
    } finally {
      setIsRunning(false);
    }
  };

  const performSubmit = () => {
    Toast.fire({ icon: 'info', title: 'Code submitted! Evaluating in background...' });
    
    // Fire and forget submission
    api.post(`/submissions/${question._id}`, { sourceCode: code, language: selectedLang })
      .catch(error => console.error("Submission failed", error));
      
    navigate('/dashboard');
  };

  const handleSubmit = () => {
    if (!code.trim()) return Toast.fire({ icon: 'error', title: 'Code cannot be empty' });
    
    if (result && result.verdict === 'Accepted') {
      performSubmit();
    } else {
      Swal.fire({
        title: 'Submit without passing tests?',
        text: "You haven't run the code successfully yet. Are you sure you want to submit?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981', // emerald-500
        cancelButtonColor: '#3f3f46',
        confirmButtonText: 'Directly Submit',
        cancelButtonText: 'Go back and Run',
        background: '#18181b',
        color: '#fff',
        customClass: {
          popup: 'rounded-xl border border-zinc-800',
          confirmButton: 'rounded-lg',
          cancelButton: 'rounded-lg'
        }
      }).then((swalResult) => {
        if (swalResult.isConfirmed) {
          performSubmit();
        }
      });
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
                    onClick={() => !hasSubmittedMode && setIsLangDropdownOpen(!isLangDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsLangDropdownOpen(false), 200)}
                    disabled={hasSubmittedMode}
                    className={`flex items-center gap-2 bg-[#050505] border border-zinc-700 text-white font-mono text-xs px-3 py-2 rounded-md outline-none transition-colors w-[90px] justify-between shadow-sm ${hasSubmittedMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-500'}`}
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
                            setSelectedLang(lang); 
                            
                            const langObj = question?.codes?.find(c => c.language === lang);
                            const dbBuggyCode = langObj ? langObj.buggyCode : LANGUAGE_TEMPLATES[lang];
                            
                            setCode(dbBuggyCode);
                            setLastSavedCode(dbBuggyCode);
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

                {/* Desktop Action Buttons - visible on very large screens to prevent squishing */}
                <div className="hidden 2xl:flex items-center gap-2">
                  <button 
                    onClick={handleReset}
                    disabled={isReadOnly || hasSubmittedMode}
                    className="flex items-center gap-2 bg-zinc-800/50 text-zinc-400 px-4 py-2 rounded-lg font-bold hover:bg-zinc-700 hover:text-white transition-all text-sm shadow-sm border border-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title="Reset to default template"
                  >
                    <RotateCcw size={16} />
                    RESET
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isReadOnly || hasSubmittedMode || code === lastSavedCode || isSaving || isRunning || submitting}
                    className="flex items-center gap-2 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-bold hover:bg-zinc-700 hover:text-white transition-all text-sm shadow-sm border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                    SAVE
                  </button>
                  <button 
                    onClick={handleRunCode}
                    disabled={isRunning || isSaving || submitting || isReadOnly || hasSubmittedMode}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-lg font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm whitespace-nowrap"
                  >
                    {isRunning ? <Loader2 size={16} className="animate-spin text-black" /> : <Zap size={16} />} 
                    RUN CODE
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={submitting || isRunning || isSaving || isReadOnly || hasSubmittedMode}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm whitespace-nowrap"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                    SUBMIT
                  </button>
                </div>

                {/* Mobile / Tablet Action Hamburger Menu */}
                <div className="2xl:hidden relative">
                  <button
                    onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                    onBlur={() => setTimeout(() => setIsActionMenuOpen(false), 200)}
                    className="flex items-center justify-center p-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                  >
                    <Menu size={16} />
                  </button>

                  {isActionMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-[#1e1e1e] border border-zinc-600 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden flex flex-col p-1.5 gap-1.5">
                      <button 
                        onClick={() => { handleReset(); setIsActionMenuOpen(false); }}
                        disabled={isReadOnly || hasSubmittedMode}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left w-full"
                      >
                        <RotateCcw size={14} /> RESET
                      </button>
                      <button 
                        onClick={() => { handleSave(); setIsActionMenuOpen(false); }}
                        disabled={isReadOnly || hasSubmittedMode || code === lastSavedCode || isSaving || isRunning || submitting}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left w-full"
                      >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} SAVE
                      </button>
                      <button 
                        onClick={() => { handleRunCode(); setIsActionMenuOpen(false); }}
                        disabled={isRunning || isSaving || submitting || isReadOnly || hasSubmittedMode}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-black bg-white hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left w-full"
                      >
                        {isRunning ? <Loader2 size={14} className="animate-spin text-black" /> : <Zap size={14} />} RUN CODE
                      </button>
                      <button 
                        onClick={() => { handleSubmit(); setIsActionMenuOpen(false); }}
                        disabled={submitting || isRunning || isSaving || isReadOnly || hasSubmittedMode}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left w-full"
                      >
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} SUBMIT
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          
          <div className="flex-1 relative bg-[#1e1e1e] pt-2 flex flex-col">
            <div className="relative flex-1 w-full">
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
                editorRef.current = editor;
                monaco.editor.setModelMarkers(editor.getModel(), 'owner', []);

                editor.onDidChangeCursorSelection((e) => {
                  const selection = editor.getSelection();
                  const model = editor.getModel();
                  
                  if (!selection.isEmpty()) {
                    setPasteMenu(null);
                    const text = model.getValueInRange(selection);
                    const pos = editor.getScrolledVisiblePosition(selection.getEndPosition());
                    if (pos) {
                      setCopyMenu({ top: pos.top, left: pos.left, text });
                    }
                  } else {
                    setCopyMenu(null);
                    if (internalClipboard.current && e.source === 'mouse') {
                      const pos = editor.getScrolledVisiblePosition(editor.getPosition());
                      if (pos) {
                        setPasteMenu({ top: pos.top, left: pos.left });
                      }
                    } else {
                      setPasteMenu(null);
                    }
                  }
                });

                editor.onDidScrollChange(() => {
                  setCopyMenu(null);
                  setPasteMenu(null);
                });

                editor.onDidChangeModelContent(() => {
                  setPasteMenu(null);
                  setCopyMenu(null);
                });
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 1.6,
                padding: { top: 24, bottom: 24 },
                scrollBeyondLastLine: false,
                readOnly: isReadOnly || hasSubmittedMode,
                wordWrap: 'on',
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnPaste: true,
                renderLineHighlight: "all",
                // Disable all error/warning indicators
                renderValidationDecorations: "off",
                glyphMargin: false,
                lightbulb: { enabled: "off" },
                quickSuggestions: false,
                suggestOnTriggerCharacters: false,
                hover: { enabled: false },
              }}
            />
            {copyMenu && (
              <button 
                onClick={handleCopy}
                className="absolute z-50 bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-[0_4px_15px_rgba(0,0,0,0.5)] text-xs font-bold hover:bg-blue-500 cursor-pointer flex items-center gap-1.5 transition-colors border border-blue-400/30"
                style={{ top: copyMenu.top + 20, left: Math.max(0, copyMenu.left - 40) }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Copy
              </button>
            )}
            {pasteMenu && (
              <button 
                onClick={handlePaste}
                className="absolute z-50 bg-emerald-600 text-white px-3 py-1.5 rounded-md shadow-[0_4px_15px_rgba(0,0,0,0.5)] text-xs font-bold hover:bg-emerald-500 cursor-pointer flex items-center gap-1.5 transition-colors border border-emerald-400/30"
                style={{ top: pasteMenu.top + 20, left: Math.max(0, pasteMenu.left - 40) }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Paste
              </button>
            )}
            </div>
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
                  {question?.expectedOutput || <span className="opacity-50 italic">Empty output expected</span>}
                </div>
              </div>

              <div className={`rounded-xl border flex flex-col shadow-lg overflow-hidden ${hasSubmittedMode || !result || result.status === 'executing' ? 'border-zinc-800/50 bg-[#0a0a0a]' : result.verdict === 'Accepted' ? 'border-emerald-900/30 bg-[#061e12]' : 'border-red-900/30 bg-[#1e0a0a]'}`}>
                <div className={`border-b px-4 py-2 flex items-center gap-2 ${hasSubmittedMode || !result || result.status === 'executing' ? 'bg-zinc-900/50 border-zinc-800/50' : result.verdict === 'Accepted' ? 'bg-emerald-950/40 border-emerald-900/30' : 'bg-red-950/40 border-red-900/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${hasSubmittedMode || !result || result.status === 'executing' ? 'bg-zinc-600' : result.verdict === 'Accepted' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <span className={`text-xs font-bold tracking-widest uppercase ${hasSubmittedMode || !result || result.status === 'executing' ? 'text-zinc-500' : result.verdict === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>Your Output</span>
                </div>
                <div className={`p-4 font-mono text-sm whitespace-pre-wrap ${hasSubmittedMode || !result || result.status === 'executing' ? 'text-zinc-600' : result.verdict === 'Accepted' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {hasSubmittedMode ? (
                    <span className="opacity-50 italic">Code submitted. Output unavailable.</span>
                  ) : !result ? (
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
              {hasSubmittedMode ? (
                <div className="text-zinc-600 flex flex-col items-center h-full justify-center opacity-50 select-none">
                  <TerminalIcon size={48} className="mb-4 text-zinc-800" />
                  <div>&gt; _ CHALLENGE SUBMITTED</div>
                </div>
              ) : !result ? (
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
