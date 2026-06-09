import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Shield, Users, Code, AlertTriangle, Check } from 'lucide-react';
import useAuthStore from '../store/authStore';

const steps = [
  {
    icon: Shield,
    title: 'SYSTEM PROTOCOL',
    subtitle: 'Security & Authentication',
    rules: [
      'All login credentials, tokens, and access keys are strictly confidential. Sharing them compromises the network.',
      'Any attempt to probe, exploit, or perform unauthorized access on the platform infrastructure will result in immediate termination.',
      'Maintain strong operational security. Report any suspected vulnerabilities or anomalous behaviors to the system administrators immediately.',
      'Your connection parameters and session activities are continuously monitored to ensure fairness and integrity.',
    ],
  },
  {
    icon: Code,
    title: 'ENGAGEMENT DIRECTIVES',
    subtitle: 'Challenge Rules & Submissions',
    rules: [
      'All submitted code must be your original creation. Advanced heuristic algorithms are actively scanning all inputs for plagiarism.',
      'The use of automated tools, bots, or unauthorized external APIs to solve challenges is strictly prohibited.',
      'You may reference official standard library documentation, but copy-pasting code blocks from third-party sources is not allowed.',
      'Time constraints are absolute. Ensure your algorithms are optimized for both correctness and computational efficiency.',
      'Partial execution successes will be logged and may yield partial XP based on the proportion of test cases passed.',
    ],
  },
  {
    icon: Users,
    title: 'NETWORK CONDUCT',
    subtitle: 'Community Guidelines',
    rules: [
      'Maintain a professional and respectful demeanor in all interactions. The system thrives on collaborative excellence.',
      'Do not broadcast solutions, hints, or exploit techniques. Allow other agents to decrypt challenges independently.',
      'Zero tolerance for harassment, discrimination, or disruptive behavior. Adversarial actions against other users will lead to connection severance.',
      'Help foster a positive environment. Report toxic behavior to the moderation team.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'CONSEQUENCE MATRIX',
    subtitle: 'Violations & Penalties',
    rules: [
      'Level 1 Infraction: System warning broadcast and deduction of accrued XP.',
      'Level 2 Infraction: Temporary suspension of challenge access and leaderboard visibility.',
      'Level 3 Infraction: Permanent IP address ban and account erasure. The system does not forget.',
      'All arbitration and enforcement decisions made by the Error404 Admin team are final and binding.',
      'By proceeding, you acknowledge these protocols and accept full responsibility for your actions on this platform.',
    ],
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const setHasSeenOnboarding = useAuthStore((state) => state.setHasSeenOnboarding);

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (isLastStep) return;
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep === 0) return;
    setCurrentStep((prev) => prev - 1);
  };

  const handleGetStarted = () => {
    setHasSeenOnboarding(true);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background subtle glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div key={index} className="flex-1 h-1 rounded-full overflow-hidden bg-zinc-800">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: index <= currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>
          ))}
        </div>

        {/* Step counter */}
        <div className="text-gray-500 font-mono text-xs mb-6 tracking-wider">
          STEP {currentStep + 1} OF {steps.length}
        </div>

        {/* Content card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="glass-panel rounded-xl border border-zinc-800 p-8 min-h-[460px] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                <StepIcon className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{step.title}</h1>
                <p className="text-gray-500 font-mono text-sm">{step.subtitle}</p>
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-4">
              {step.rules.map((rule, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="flex gap-3 items-start group"
                >
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded border border-zinc-700 bg-zinc-900 flex items-center justify-center text-xs font-mono text-gray-400 group-hover:border-white group-hover:text-white transition-colors">
                    {index + 1}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{rule}</p>
                </motion.div>
              ))}
            </div>

            {/* Agreement checkbox — only on last step */}
            {isLastStep && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-auto pt-6"
              >
                <label className="flex items-center gap-3 cursor-pointer select-none group w-fit">
                  <div
                    className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all cursor-pointer ${
                      agreed
                        ? 'bg-white border-white'
                        : 'border-zinc-500 bg-transparent group-hover:border-gray-400'
                    }`}
                  >
                    {agreed && <Check size={14} strokeWidth={3} className="text-black" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <span className="text-gray-300 text-sm font-mono group-hover:text-white transition-colors">
                    I HAVE READ AND AGREE TO ALL RULES AND REGULATIONS
                  </span>
                </label>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm transition-all ${
              currentStep === 0
                ? 'text-zinc-600 cursor-not-allowed'
                : 'text-gray-300 hover:text-white border border-zinc-800 hover:border-zinc-600'
            }`}
          >
            <ChevronLeft size={16} />
            BACK
          </button>

          {isLastStep ? (
            <button
              onClick={handleGetStarted}
              disabled={!agreed}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                agreed
                  ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              GET STARTED
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black font-bold text-sm hover:bg-gray-200 transition-all"
            >
              NEXT
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
