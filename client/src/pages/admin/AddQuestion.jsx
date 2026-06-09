import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, ArrowLeft, Code } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
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

export default function AddQuestion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    language: 'python',
    difficulty: 'Easy',
    xpReward: 10,
    buggyCode: '',
    correctSolution: '',
    hiddenTestCases: [{ input: '', expectedOutput: '' }]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'title') {
      setFormData({
        ...formData,
        title: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...formData.hiddenTestCases];
    newTestCases[index][field] = value;
    setFormData({ ...formData, hiddenTestCases: newTestCases });
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      hiddenTestCases: [...formData.hiddenTestCases, { input: '', expectedOutput: '' }]
    });
  };

  const removeTestCase = (index) => {
    const newTestCases = formData.hiddenTestCases.filter((_, i) => i !== index);
    setFormData({ ...formData, hiddenTestCases: newTestCases });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Frontend only for now, simulate API call
      setTimeout(() => {
        Toast.fire({ icon: 'success', title: 'Question added successfully!' });
        console.log("Submitting:", formData);
        setLoading(false);
        // navigate('/dashboard');
      }, 1000);
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Failed to add question' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
            <Code className="text-emerald-500" />
            CREATE NEW CHALLENGE
          </h1>
        </motion.div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-[#0a0a0a] border border-zinc-800/80 p-5 rounded-xl shadow-lg">
              <h2 className="text-zinc-400 font-mono text-xs uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">Basic Info</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1.5">Title</label>
                  <input 
                    type="text" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    required 
                    className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                    placeholder="e.g. Reverse a String"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1.5">Slug (Auto-generated)</label>
                  <input 
                    type="text" 
                    name="slug" 
                    value={formData.slug} 
                    onChange={handleChange} 
                    required 
                    className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-zinc-500 text-sm focus:outline-none focus:border-zinc-600 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 text-xs font-bold mb-1.5">Difficulty</label>
                    <select 
                      name="difficulty" 
                      value={formData.difficulty} 
                      onChange={handleChange}
                      className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-600 appearance-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs font-bold mb-1.5">XP Reward</label>
                    <input 
                      type="number" 
                      name="xpReward" 
                      value={formData.xpReward} 
                      onChange={handleChange} 
                      required 
                      className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1.5">Language</label>
                  <select 
                    name="language" 
                    value={formData.language} 
                    onChange={handleChange}
                    className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-600 appearance-none"
                  >
                    <option value="python">Python</option>
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: Code */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-[#0a0a0a] border border-zinc-800/80 p-5 rounded-xl shadow-lg flex flex-col gap-5">
              <h2 className="text-zinc-400 font-mono text-xs uppercase tracking-wider border-b border-zinc-800 pb-2">Code Definitions</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1.5">Buggy Code</label>
                  <textarea 
                    name="buggyCode" 
                    value={formData.buggyCode} 
                    onChange={handleChange} 
                    required 
                    rows={8}
                    className="w-full bg-[#111] border border-zinc-800 rounded p-3 text-red-400 font-mono text-xs focus:outline-none focus:border-zinc-600 resize-y"
                    placeholder="// The broken starter code provided to the user"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1.5">Correct Solution</label>
                  <textarea 
                    name="correctSolution" 
                    value={formData.correctSolution} 
                    onChange={handleChange} 
                    required 
                    rows={8}
                    className="w-full bg-[#111] border border-zinc-800 rounded p-3 text-emerald-400 font-mono text-xs focus:outline-none focus:border-zinc-600 resize-y"
                    placeholder="// The expected working solution"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-zinc-800/80 p-5 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                <h2 className="text-zinc-400 font-mono text-xs uppercase tracking-wider">Test Cases</h2>
                <button 
                  type="button" 
                  onClick={addTestCase}
                  className="flex items-center gap-1 text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition-colors"
                >
                  <Plus size={14} /> ADD CASE
                </button>
              </div>

              <div className="space-y-3">
                {formData.hiddenTestCases.map((tc, index) => (
                  <div key={index} className="flex items-start gap-3 bg-[#111] border border-zinc-800/50 p-3 rounded">
                    <div className="flex-1">
                      <label className="block text-zinc-500 text-[10px] font-bold uppercase mb-1">Input</label>
                      <input 
                        type="text" 
                        value={tc.input} 
                        onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 text-xs font-mono focus:outline-none focus:border-zinc-600"
                        placeholder="e.g. 5"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-zinc-500 text-[10px] font-bold uppercase mb-1">Expected Output</label>
                      <input 
                        type="text" 
                        value={tc.expectedOutput} 
                        onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                        required
                        className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 text-xs font-mono focus:outline-none focus:border-zinc-600"
                        placeholder="e.g. 120"
                      />
                    </div>
                    {formData.hiddenTestCases.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeTestCase(index)}
                        className="mt-5 p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition-all shadow-md text-sm disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? 'SAVING...' : 'SAVE CHALLENGE'}
              </button>
            </div>
          </div>

        </form>
      </main>
    </div>
  );
}
