import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Bot, 
  Volume2, 
  VolumeX,
  PackageCheck
} from 'lucide-react';
import { Recipe, CookingSession, InventoryItem } from '../types';
import { convertIngredientUnit, UnitSystem } from '../utils/unitConverter';

interface CookingModeModalProps {
  recipe: Recipe;
  session: CookingSession;
  onUpdateStep: (newStepIndex: number) => void;
  onCompleteCooking: (deductInventory: boolean) => void;
  onClose: () => void;
  onAskBiancaCookingQuestion: (question: string) => void;
  inventory: InventoryItem[];
}

export const CookingModeModal: React.FC<CookingModeModalProps> = ({
  recipe,
  session,
  onUpdateStep,
  onCompleteCooking,
  onClose,
  onAskBiancaCookingQuestion,
  inventory,
}) => {
  const currentStep = session.currentStepIndex;
  const totalSteps = recipe.instructions.length;
  const isLastStep = currentStep === totalSteps - 1;

  // Kitchen Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showDeductPrompt, setShowDeductPrompt] = useState(false);

  // Voice Narration State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoReadSteps, setAutoReadSteps] = useState(false);

  // Metric vs Imperial Unit Toggle State
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

  // Detect time mentioned in current step text (e.g., "simmer for 10 minutes", "bake 25 mins")
  const currentStepText = recipe.instructions[currentStep] || '';
  const detectedTimeMatch = currentStepText.match(/(\d+)\s*(?:-|to)?\s*(\d+)?\s*(?:mins|min|minutes|minute)/i);
  const detectedMinutes = detectedTimeMatch ? parseInt(detectedTimeMatch[1], 10) : null;

  // Web Speech Text-to-Speech function
  const speakStep = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Auto-read step when progressing
  useEffect(() => {
    if (autoReadSteps) {
      speakStep(`Step ${currentStep + 1}. ${recipe.instructions[currentStep]}`);
    } else {
      stopSpeaking();
    }
    return () => stopSpeaking();
  }, [currentStep, autoReadSteps]);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      // Play crisp Web Audio synth chime
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.15); // D6
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      } catch (e) {
        // ignore
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const setTimerMinutes = (mins: number) => {
    setTimerSeconds(mins * 60);
    setTimerActive(true);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const quickAssistantQuestions = [
    `How do I know this step is done properly?`,
    `What heat level is ideal for step ${currentStep + 1}?`,
    `I'm missing one ingredient. What can I swap in right now?`,
    `Can I make this lower in fat or higher in protein?`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-stone-800 flex items-center justify-between bg-stone-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                Interactive Cooking Mode · Step {currentStep + 1} of {totalSteps}
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-100 line-clamp-1">
                {recipe.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Line */}
        <div className="w-full bg-stone-800 h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Step Box */}
          <div className="p-6 rounded-2xl bg-stone-850 border border-stone-800 shadow-inner space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-stone-400">
              <span>STEP {currentStep + 1}</span>
              <div className="flex items-center gap-3">
                {/* Voice narration controls */}
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else {
                      speakStep(`Step ${currentStep + 1}. ${recipe.instructions[currentStep]}`);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-medium transition-colors ${
                    isSpeaking
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                  }`}
                  title="Read step out loud"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
                </button>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-400 select-none">
                  <input
                    type="checkbox"
                    checked={autoReadSteps}
                    onChange={(e) => setAutoReadSteps(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-stone-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Hands-free Auto-read</span>
                </label>

                <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% COMPLETE</span>
              </div>
            </div>

            <p className="font-serif text-xl sm:text-2xl text-stone-100 leading-relaxed font-medium">
              {recipe.instructions[currentStep]}
            </p>
          </div>

          {/* Cooking Kitchen Timer */}
          <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs text-stone-400 font-medium flex items-center gap-2">
                  <span>Step Timer</span>
                  {detectedMinutes && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                      ~{detectedMinutes}m detected
                    </span>
                  )}
                </div>
                <div className="font-mono text-2xl font-bold text-stone-100">
                  {formatTime(timerSeconds)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {detectedMinutes && (
                <button
                  type="button"
                  onClick={() => setTimerMinutes(detectedMinutes)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start {detectedMinutes}m Timer</span>
                </button>
              )}
              <button
                onClick={() => setTimerMinutes(2)}
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono"
              >
                +2m
              </button>
              <button
                onClick={() => setTimerMinutes(5)}
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono"
              >
                +5m
              </button>
              <button
                onClick={() => setTimerMinutes(10)}
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono"
              >
                +10m
              </button>

              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  timerActive
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setTimerActive(false);
                  setTimerSeconds(0);
                }}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Bianca Live Cooking Help */}
          <div className="p-4 rounded-xl bg-stone-850/60 border border-stone-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Ask Bianca Cooking Assistant</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickAssistantQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onAskBiancaCookingQuestion(q)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 border border-stone-700 text-xs text-stone-300 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients Quick Reference Checklist with Metric/Imperial Toggle */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-mono tracking-wider text-stone-400">
                Ingredients for this Recipe
              </h4>
              {/* Unit System Switcher */}
              <div className="flex items-center rounded-lg bg-stone-950 p-0.5 border border-stone-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setUnitSystem('metric')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    unitSystem === 'metric'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Metric (g, ml)
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem('imperial')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    unitSystem === 'imperial'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Imperial (oz, cups)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {recipe.ingredients.map((ing, idx) => {
                const converted = convertIngredientUnit(ing, unitSystem);
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-between"
                  >
                    <span className="text-stone-300 font-medium">{converted.name}</span>
                    <span className="font-mono text-emerald-400 font-medium">
                      {converted.quantity} {converted.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Navigation Controls */}
        <div className="p-4 sm:p-6 border-t border-stone-800 bg-stone-900 flex items-center justify-between gap-3 sticky bottom-0">
          <button
            onClick={() => onUpdateStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs sm:text-sm font-medium transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <div className="text-xs text-stone-400 font-mono hidden sm:block">
            Step {currentStep + 1} of {totalSteps}
          </div>

          {isLastStep ? (
            <button
              onClick={() => setShowDeductPrompt(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-950/40 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finish Cooking!</span>
            </button>
          ) : (
            <button
              onClick={() => onUpdateStep(currentStep + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Completion & Inventory Deduction Confirmation Modal */}
      {showDeductPrompt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif text-xl font-bold text-stone-100">
                Meal Cooked Successfully!
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Congratulations on completing <span className="text-stone-200 font-medium">{recipe.title}</span>. Would you like MenuHub to automatically deduct the used ingredients from your Inventory?
              </p>
            </div>

            <div className="p-3 rounded-lg bg-stone-850 border border-stone-800 text-xs text-stone-300 space-y-1 max-h-32 overflow-y-auto font-mono">
              {recipe.ingredients.map((ing, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{ing.name}</span>
                  <span className="text-stone-400">-{ing.quantity} {ing.unit}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => onCompleteCooking(false)}
                className="px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Keep Inventory Unchanged
              </button>
              <button
                onClick={() => onCompleteCooking(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Deduct & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
