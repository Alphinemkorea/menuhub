import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Flame, 
  Dumbbell, 
  Calendar, 
  Package, 
  Volume2, 
  VolumeX, 
  Plus, 
  Check, 
  Loader2,
  X
} from 'lucide-react';
import { ChatMessage, Recipe, InventoryItem, EquipmentItem, FoodPreferences, LifeHubContext } from '../types';
import { sendBiancaMessage } from '../services/geminiService';

interface BiancaAssistantViewProps {
  chatHistory: ChatMessage[];
  onAddChatMessage: (msg: ChatMessage) => void;
  inventory: InventoryItem[];
  equipment: EquipmentItem[];
  preferences: FoodPreferences;
  lifeHub: LifeHubContext;
  recipes: Recipe[];
  onSaveRecipe: (recipe: Recipe) => void;
  onApplyInventoryAction: (items: Array<{ name: string; quantity: number; unit: string }>, action: 'add' | 'remove') => void;
  onStartCooking: (recipe: Recipe) => void;
  currentCookingSession?: any;
  isDrawer?: boolean;
  onCloseDrawer?: () => void;
}

export const BiancaAssistantView: React.FC<BiancaAssistantViewProps> = ({
  chatHistory,
  onAddChatMessage,
  inventory,
  equipment,
  preferences,
  lifeHub,
  recipes,
  onSaveRecipe,
  onApplyInventoryAction,
  onStartCooking,
  currentCookingSession,
  isDrawer = false,
  onCloseDrawer,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: '🍳 What can I cook now?', prompt: 'What can I cook with what I currently have in my inventory?' },
    { label: '⚠️ Use expiring food first', prompt: 'Which recipes can I make right now that use the ingredients expiring earliest?' },
    { label: '💪 High protein for LifeHub', prompt: 'Recommend a high-protein dinner that delivers at least 50g protein toward my 140g LifeHub goal.' },
    { label: '🥘 Adapt without an oven', prompt: 'I don\'t have an oven. Suggest a delicious dinner tailored for a stovetop and frying pan.' },
    { label: '🌎 Create an exotic recipe', prompt: 'Create me an exotic, exciting recipe for Saturday that I\'ve never made before.' },
    { label: '📅 Plan next week', prompt: 'Help me plan next week\'s dinners balancing my inventory and my 2,800 kcal / 140g protein LifeHub targets.' },
    { label: '🔄 Healthy substitutions', prompt: 'What healthy substitutions can I use in cooking if I don\'t have butter or heavy cream?' },
    { label: '🛒 Added groceries', prompt: 'I just bought 1kg chicken, 12 eggs, and 2kg rice. Update my inventory.' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const speakText = (text: string) => {
    if (!isTtsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    // Strip markdown formatting before speaking
    const cleanText = text.replace(/```[\s\S]*?```/g, '').replace(/[*_#]/g, '');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputText).trim();
    if (!message || isLoading) return;

    setInputText('');

    // Add user message to history
    const userMsg: ChatMessage = {
      id: `msg-${Date.now().toString(36)}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    onAddChatMessage(userMsg);
    setIsLoading(true);

    try {
      // Build history payload for Gemini
      const historyPayload = chatHistory.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
      }));

      const res = await sendBiancaMessage(message, historyPayload, {
        inventory,
        equipment,
        preferences,
        lifeHub,
        currentCookingSession,
        recipes,
      });

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now().toString(36)}-resp`,
        role: 'assistant',
        content: res.text,
        timestamp: new Date().toISOString(),
        actionData: res.action,
      };

      onAddChatMessage(assistantMsg);
      speakText(res.text);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now().toString(36)}-err`,
        role: 'assistant',
        content: `I ran into an issue connecting to my reasoning engine: ${err.message}. Please verify the Gemini API configuration.`,
        timestamp: new Date().toISOString(),
      };
      onAddChatMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDrawer ? 'p-4' : 'space-y-4'}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-stone-100">Bianca</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                AI Culinary Orchestrator
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Coordinating MenuHub inventory & LifeHub fitness targets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* TTS Audio toggle */}
          <button
            onClick={() => {
              if (isTtsEnabled) window.speechSynthesis?.cancel();
              setIsTtsEnabled(!isTtsEnabled);
            }}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isTtsEnabled
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
            }`}
            title={isTtsEnabled ? 'Voice readouts enabled' : 'Enable voice readouts'}
          >
            {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {isDrawer && onCloseDrawer && (
            <button
              onClick={onCloseDrawer}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="py-2 overflow-x-auto no-scrollbar flex items-center gap-2">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSendMessage(qp.prompt)}
            className="px-2.5 py-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 border border-stone-800 text-[11px] text-stone-300 hover:text-white whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[350px]">
        {chatHistory.length === 0 && (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-emerald-400 mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-200">
              Good day, Chef. I am Bianca.
            </h3>
            <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
              I can inspect your real pantry inventory ({inventory.length} items), your equipment constraints, and your LifeHub daily goal of {lifeHub.nutrition.protein_target}g protein to help you cook, plan, or adapt recipes.
            </p>
          </div>
        )}

        {chatHistory.map((msg) => {
          const isUser = msg.role === 'user';
          const recipeAction = msg.actionData?.type === 'recipe_suggestion' ? msg.actionData.recipe : null;
          const invAction = msg.actionData?.type === 'inventory_action' ? msg.actionData : null;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-stone-850 border border-stone-800 text-stone-200 rounded-bl-none shadow-sm'
                }`}
              >
                {/* Clean message text without raw JSON if action block exists */}
                {msg.content.replace(/```json\s*[\s\S]*?\s*```/g, '').trim()}
              </div>

              {/* Render Recipe Card Action if Bianca generated a structured recipe */}
              {recipeAction && recipeAction.title && (
                <div className="w-full max-w-[90%] bg-stone-900 border border-emerald-800/80 rounded-xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                      ✨ New Recipe Created by Bianca
                    </span>
                    <span className="text-stone-400">{recipeAction.category}</span>
                  </div>

                  <div>
                    <h4 className="font-serif text-base font-bold text-stone-100">
                      {recipeAction.title}
                    </h4>
                    <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">
                      {recipeAction.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-300 font-mono">
                    <span>{recipeAction.prepTimeMinutes! + recipeAction.cookTimeMinutes!} mins</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-medium">{recipeAction.proteinGrams}g Protein</span>
                    <span>·</span>
                    <span>{recipeAction.caloriesPerServing} kcal</span>
                  </div>

                  {recipeAction.fitnessGoalAlignment && (
                    <div className="p-2 rounded bg-stone-850 text-[11px] text-stone-400">
                      {recipeAction.fitnessGoalAlignment}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        const fullRecipe: Recipe = {
                          id: `rec-bianca-${Date.now().toString(36)}`,
                          title: recipeAction.title || 'Bianca Recipe',
                          description: recipeAction.description || '',
                          category: (recipeAction.category as any) || 'Dinner',
                          cuisine: recipeAction.cuisine || 'International',
                          prepTimeMinutes: recipeAction.prepTimeMinutes || 15,
                          cookTimeMinutes: recipeAction.cookTimeMinutes || 20,
                          servings: recipeAction.servings || 2,
                          difficulty: (recipeAction.difficulty as any) || 'Medium',
                          equipmentNeeded: recipeAction.equipmentNeeded || ['Gas cooker', 'Frying pan'],
                          caloriesPerServing: recipeAction.caloriesPerServing || 650,
                          proteinGrams: recipeAction.proteinGrams || 45,
                          carbsGrams: recipeAction.carbsGrams || 70,
                          fatGrams: recipeAction.fatGrams || 18,
                          fitnessGoalAlignment: recipeAction.fitnessGoalAlignment || '',
                          ingredients: recipeAction.ingredients || [],
                          instructions: recipeAction.instructions || [],
                          isFavorite: false,
                          isAiGenerated: true,
                          createdAt: new Date().toISOString(),
                        };
                        onSaveRecipe(fullRecipe);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save to Recipe Library</span>
                    </button>

                    <button
                      onClick={() => {
                        const fullRecipe: Recipe = {
                          id: `rec-bianca-${Date.now().toString(36)}`,
                          title: recipeAction.title || 'Bianca Recipe',
                          description: recipeAction.description || '',
                          category: (recipeAction.category as any) || 'Dinner',
                          cuisine: recipeAction.cuisine || 'International',
                          prepTimeMinutes: recipeAction.prepTimeMinutes || 15,
                          cookTimeMinutes: recipeAction.cookTimeMinutes || 20,
                          servings: recipeAction.servings || 2,
                          difficulty: (recipeAction.difficulty as any) || 'Medium',
                          equipmentNeeded: recipeAction.equipmentNeeded || ['Gas cooker', 'Frying pan'],
                          caloriesPerServing: recipeAction.caloriesPerServing || 650,
                          proteinGrams: recipeAction.proteinGrams || 45,
                          carbsGrams: recipeAction.carbsGrams || 70,
                          fatGrams: recipeAction.fatGrams || 18,
                          fitnessGoalAlignment: recipeAction.fitnessGoalAlignment || '',
                          ingredients: recipeAction.ingredients || [],
                          instructions: recipeAction.instructions || [],
                          isFavorite: false,
                          isAiGenerated: true,
                          createdAt: new Date().toISOString(),
                        };
                        onStartCooking(fullRecipe);
                      }}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
                    >
                      <Flame className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cook Now</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Render Inventory Action Card if Bianca updated inventory */}
              {invAction && invAction.items && (
                <div className="w-full max-w-[90%] bg-stone-900 border border-stone-800 rounded-xl p-3 space-y-2">
                  <div className="text-xs font-mono text-stone-300">
                    📦 Inventory Action Proposed ({invAction.action === 'add' ? 'Add' : 'Deduct'}):
                  </div>
                  <div className="text-xs text-stone-400">
                    {invAction.items.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                  </div>
                  <button
                    onClick={() => onApplyInventoryAction(invAction.items || [], (invAction as any).action || 'add')}
                    className="px-3 py-1 bg-stone-800 hover:bg-stone-750 border border-stone-700 rounded text-xs text-emerald-400 font-medium"
                  >
                    Apply to Kitchen Inventory
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-850 border border-stone-800 text-xs text-stone-400 max-w-xs">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>Bianca is analyzing pantry and fitness goals...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="pt-2 border-t border-stone-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Bianca anything (e.g. 'What can I cook with tomatoes?')"
          disabled={isLoading}
          className="flex-1 px-3.5 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-colors shrink-0 shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
