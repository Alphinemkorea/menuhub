import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  ClipboardPaste,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  ChefHat,
  Clock,
  Dumbbell,
  Flame,
  Upload,
  RefreshCw,
  Utensils,
  Wrench,
  Check,
  Globe,
  Link,
  Camera,
  ShoppingCart,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { Recipe, InventoryItem, EquipmentItem, LifeHubContext, FoodPreferences } from '../types';
import { scanRecipeWithBianca } from '../services/geminiService';
import { calculateTotalRecipeNutrition } from '../utils/nutritionUtils';
import { normalizeName, checkDietaryConflicts } from '../utils/recipeUtils';

interface ImportRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecipe: (recipe: Recipe) => void;
  onStartCooking?: (recipe: Recipe) => void;
  onAddMissingToShoppingList?: (items: Array<{ name: string; quantity: number; unit: string }>, recipeTitle?: string) => void;
  onAddToMealPlan?: (recipe: Recipe) => void;
  inventory: InventoryItem[];
  equipment: EquipmentItem[];
  preferences?: FoodPreferences;
  lifeHub?: LifeHubContext;
}

type ImportTab = 'file' | 'paste' | 'url';

// Sample demo image data URI for the "Try Photo Demo" button
const SAMPLE_RECIPE_IMAGE_BASE64 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231c1917"/><rect x="20" y="20" width="560" height="360" rx="16" fill="%23292524" stroke="%2344403c" stroke-width="2"/><text x="40" y="60" fill="%2334d399" font-size="20" font-family="serif" font-weight="bold">Mediterranean Lemon Herb Salmon</text><text x="40" y="90" fill="%23a8a29e" font-size="12" font-family="sans-serif">Prep: 10 mins | Cook: 15 mins | Servings: 2 | 480 kcal</text><line x1="40" y1="105" x2="560" y2="105" stroke="%2344403c" stroke-width="1"/><text x="40" y="130" fill="%23e7e5e4" font-size="14" font-family="sans-serif" font-weight="bold">Ingredients:</text><text x="40" y="155" fill="%23d6d3d1" font-size="12" font-family="sans-serif">• 2 fresh salmon fillets (approx 300g)</text><text x="40" y="175" fill="%23d6d3d1" font-size="12" font-family="sans-serif">• 2 tbsp extra virgin olive oil</text><text x="40" y="195" fill="%23d6d3d1" font-size="12" font-family="sans-serif">• 3 cloves garlic, finely minced</text><text x="40" y="215" fill="%23d6d3d1" font-size="12" font-family="sans-serif">• 1 whole lemon (sliced and juiced)</text><text x="40" y="235" fill="%23d6d3d1" font-size="12" font-family="sans-serif">• 1 tbsp fresh dill and oregano chopped</text><text x="40" y="255" fill="%23d6d3d1" font-size="12" font-family="sans-serif">• 1 cup asparagus spears, trimmed</text><text x="40" y="275" fill="%23d6d3d1" font-size="12" font-family="sans-serif">• Sea salt and cracked black pepper</text><text x="40" y="305" fill="%23e7e5e4" font-size="14" font-family="sans-serif" font-weight="bold">Instructions:</text><text x="40" y="330" fill="%23d6d3d1" font-size="12" font-family="sans-serif">1. Season salmon fillets with garlic, lemon juice, salt, and herbs.</text><text x="40" y="350" fill="%23d6d3d1" font-size="12" font-family="sans-serif">2. Pan-sear in skillet for 4 mins per side until flakey and golden.</text></svg>`;

export const ImportRecipeModal: React.FC<ImportRecipeModalProps> = ({
  isOpen,
  onClose,
  onSaveRecipe,
  onStartCooking,
  onAddMissingToShoppingList,
  onAddToMealPlan,
  inventory,
  equipment,
  preferences,
  lifeHub,
}) => {
  const [tab, setTab] = useState<ImportTab>('file');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Pasted text state
  const [pastedText, setPastedText] = useState('');

  // Web URL state
  const [recipeUrl, setRecipeUrl] = useState('');

  // Scanning & status states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addedToListMessage, setAddedToListMessage] = useState<string | null>(null);

  // Scanned recipe result for review
  const [scannedRecipe, setScannedRecipe] = useState<Recipe | null>(null);
  const [originalServings, setOriginalServings] = useState<number>(2);

  // Check dietary conflicts
  const dietaryConflicts = useMemo(() => {
    if (!scannedRecipe || !preferences) return null;
    return checkDietaryConflicts(scannedRecipe, preferences);
  }, [scannedRecipe, preferences]);

  // Check missing ingredients against inventory
  const inventoryAnalysis = useMemo(() => {
    if (!scannedRecipe) return { inStock: [], missing: [], percentage: 100 };
    const inStock: typeof scannedRecipe.ingredients = [];
    const missing: typeof scannedRecipe.ingredients = [];

    scannedRecipe.ingredients.forEach((ing) => {
      const normIng = normalizeName(ing.name);
      const found = inventory.some((inv) => {
        const normInv = normalizeName(inv.name);
        return (normInv.includes(normIng) || normIng.includes(normInv)) && inv.quantity > 0;
      });
      if (found) {
        inStock.push(ing);
      } else {
        missing.push(ing);
      }
    });

    const total = scannedRecipe.ingredients.length;
    const percentage = total > 0 ? Math.round((inStock.length / total) * 100) : 100;
    return { inStock, missing, percentage };
  }, [scannedRecipe, inventory]);

  if (!isOpen) return null;

  // Handle file drop / select
  const handleProcessFile = (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileBase64(result);
      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(result);
      } else {
        setFilePreviewUrl(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Paste from clipboard helper
  const handlePasteClipboard = async () => {
    try {
      setErrorMessage(null);
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setPastedText(text.trim());
      } else {
        setErrorMessage('Clipboard was empty. Please copy a recipe text first.');
      }
    } catch {
      setErrorMessage('Unable to access clipboard directly. Please press Ctrl+V / Cmd+V in the box below.');
    }
  };

  // Sample recipe load helpers
  const handleLoadSamplePhotoDemo = () => {
    setErrorMessage(null);
    setFileBase64(SAMPLE_RECIPE_IMAGE_BASE64);
    setFilePreviewUrl(SAMPLE_RECIPE_IMAGE_BASE64);
    // Create simulated file
    const demoBlob = new Blob([SAMPLE_RECIPE_IMAGE_BASE64], { type: 'image/svg+xml' });
    const demoFile = new File([demoBlob], 'mediterranean-salmon-card.jpg', { type: 'image/jpeg' });
    setSelectedFile(demoFile);
  };

  const handleLoadSamplePasted = () => {
    setPastedText(`Creamy Tuscan Garlic Butter Chicken
Prep time: 10 mins | Cook time: 20 mins | Servings: 2 | Category: Dinner
Cuisine: Italian | Difficulty: Easy

Ingredients:
- 2 chicken breasts (boneless, skinless, ~350g)
- 2 tbsp olive oil
- 1 tbsp butter
- 4 cloves garlic, minced
- 1 cup heavy cream
- 2 cups fresh baby spinach
- 1/2 cup sun-dried tomatoes, sliced
- 1/4 cup grated parmesan cheese
- 1 tsp Italian seasoning (oregano & basil)
- Salt and black pepper to taste

Instructions:
1. Season chicken breasts with salt, pepper, and half of the Italian seasoning.
2. Heat olive oil in a large skillet over medium-high heat. Sear chicken for 5-6 minutes per side until golden brown and cooked through. Remove to a plate.
3. In the same pan, melt butter and sauté minced garlic for 1 minute until fragrant.
4. Stir in sun-dried tomatoes, heavy cream, and remaining seasoning. Bring to a gentle simmer for 3 minutes.
5. Add fresh spinach and parmesan cheese; stir until spinach is wilted and sauce is creamy.
6. Return chicken breasts to the skillet, spooning rich garlic sauce over the chicken. Simmer 2 more minutes and serve warm.`);
  };

  // Trigger Scan
  const handleScanRecipe = async () => {
    setErrorMessage(null);
    setAddedToListMessage(null);

    if (tab === 'file') {
      if (!fileBase64 || !selectedFile) {
        setErrorMessage('Please select, drop, or take a picture of a recipe first.');
        return;
      }
    } else if (tab === 'paste') {
      if (!pastedText.trim()) {
        setErrorMessage('Please paste recipe text into the field first.');
        return;
      }
    } else if (tab === 'url') {
      if (!recipeUrl.trim()) {
        setErrorMessage('Please enter a valid recipe webpage URL (e.g., https://...).');
        return;
      }
    }

    setIsScanning(true);
    setScanStep(tab === 'url' ? 'Fetching webpage and removing ads & comments...' : 'Analyzing document structure and text vision...');

    try {
      // Progress simulation steps while Gemini processes
      const stepTimer1 = setTimeout(() => {
        setScanStep('Extracting ingredients, numeric quantities, and culinary measurements...');
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setScanStep('Formatting cooking instructions, detecting kitchen equipment...');
      }, 2400);

      const stepTimer3 = setTimeout(() => {
        setScanStep('Calculating macro nutrition (calories, protein, carbs, fats)...');
      }, 3600);

      const recipeResult = await scanRecipeWithBianca({
        mode: tab === 'paste' ? 'text' : tab,
        fileBase64: fileBase64 || undefined,
        mimeType: selectedFile?.type || (selectedFile?.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        text: tab === 'paste' ? pastedText : undefined,
        url: tab === 'url' ? recipeUrl : undefined,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      // Verify and refine nutrition if needed
      if (recipeResult.ingredients && recipeResult.ingredients.length > 0) {
        const computed = calculateTotalRecipeNutrition(recipeResult.ingredients, recipeResult.servings || 2);
        if (!recipeResult.caloriesPerServing || recipeResult.caloriesPerServing === 0) {
          recipeResult.caloriesPerServing = computed.perServingCalories;
          recipeResult.proteinGrams = computed.perServingProtein;
          recipeResult.carbsGrams = computed.perServingCarbs;
          recipeResult.fatGrams = computed.perServingFat;
        }
      }

      setOriginalServings(recipeResult.servings || 2);
      setScannedRecipe(recipeResult);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'Failed to scan and process recipe. Please try again or check the format.');
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  // Modify scanned recipe before saving
  const handleUpdateScannedField = <K extends keyof Recipe>(field: K, value: Recipe[K]) => {
    if (!scannedRecipe) return;
    setScannedRecipe({
      ...scannedRecipe,
      [field]: value,
    });
  };

  // Serving Scaler: Proportionally scale ingredient quantities
  const handleScaleServings = (newServings: number) => {
    if (!scannedRecipe || newServings < 1 || newServings > 24) return;
    const oldServings = scannedRecipe.servings || 2;
    const factor = newServings / oldServings;

    const scaledIngredients = scannedRecipe.ingredients.map((ing) => ({
      ...ing,
      quantity: Math.round(ing.quantity * factor * 10) / 10 || ing.quantity,
    }));

    // Recalculate nutrition with new quantities and new servings
    const computed = calculateTotalRecipeNutrition(scaledIngredients, newServings);

    setScannedRecipe({
      ...scannedRecipe,
      servings: newServings,
      ingredients: scaledIngredients,
      caloriesPerServing: computed.perServingCalories,
      proteinGrams: computed.perServingProtein,
      carbsGrams: computed.perServingCarbs,
      fatGrams: computed.perServingFat,
    });
  };

  const handleUpdateIngredient = (index: number, field: string, val: any) => {
    if (!scannedRecipe) return;
    const updated = [...scannedRecipe.ingredients];
    updated[index] = { ...updated[index], [field]: val };

    // Auto-recalculate nutrition when ingredients change
    const computed = calculateTotalRecipeNutrition(updated, scannedRecipe.servings || 2);

    setScannedRecipe({
      ...scannedRecipe,
      ingredients: updated,
      caloriesPerServing: computed.perServingCalories,
      proteinGrams: computed.perServingProtein,
      carbsGrams: computed.perServingCarbs,
      fatGrams: computed.perServingFat,
    });
  };

  const handleAddIngredient = () => {
    if (!scannedRecipe) return;
    setScannedRecipe({
      ...scannedRecipe,
      ingredients: [
        ...scannedRecipe.ingredients,
        { name: 'New Ingredient', quantity: 1, unit: 'pcs', optional: false },
      ],
    });
  };

  const handleRemoveIngredient = (index: number) => {
    if (!scannedRecipe) return;
    const updated = scannedRecipe.ingredients.filter((_, i) => i !== index);
    const computed = calculateTotalRecipeNutrition(updated, scannedRecipe.servings || 2);
    setScannedRecipe({
      ...scannedRecipe,
      ingredients: updated,
      caloriesPerServing: computed.perServingCalories,
      proteinGrams: computed.perServingProtein,
      carbsGrams: computed.perServingCarbs,
      fatGrams: computed.perServingFat,
    });
  };

  const handleUpdateInstruction = (index: number, val: string) => {
    if (!scannedRecipe) return;
    const updated = [...scannedRecipe.instructions];
    updated[index] = val;
    setScannedRecipe({
      ...scannedRecipe,
      instructions: updated,
    });
  };

  const handleAddInstruction = () => {
    if (!scannedRecipe) return;
    setScannedRecipe({
      ...scannedRecipe,
      instructions: [...scannedRecipe.instructions, 'Next step: '],
    });
  };

  const handleRemoveInstruction = (index: number) => {
    if (!scannedRecipe) return;
    setScannedRecipe({
      ...scannedRecipe,
      instructions: scannedRecipe.instructions.filter((_, i) => i !== index),
    });
  };

  // Recalculate nutrition button
  const handleRecalculateNutrition = () => {
    if (!scannedRecipe) return;
    const computed = calculateTotalRecipeNutrition(scannedRecipe.ingredients, scannedRecipe.servings || 2);
    setScannedRecipe({
      ...scannedRecipe,
      caloriesPerServing: computed.perServingCalories,
      proteinGrams: computed.perServingProtein,
      carbsGrams: computed.perServingCarbs,
      fatGrams: computed.perServingFat,
    });
  };

  // Add missing ingredients directly to shopping list
  const handleAddMissingToShopping = () => {
    if (!scannedRecipe || !onAddMissingToShoppingList) return;
    if (inventoryAnalysis.missing.length === 0) return;

    onAddMissingToShoppingList(
      inventoryAnalysis.missing.map((m) => ({
        name: m.name,
        quantity: m.quantity,
        unit: m.unit,
      })),
      scannedRecipe.title
    );
    setAddedToListMessage(`Added ${inventoryAnalysis.missing.length} missing items to your Shopping List!`);
    setTimeout(() => setAddedToListMessage(null), 4000);
  };

  // Save recipe
  const handleConfirmSave = (andCook: boolean = false) => {
    if (!scannedRecipe) return;
    onSaveRecipe(scannedRecipe);
    if (andCook && onStartCooking) {
      onStartCooking(scannedRecipe);
    }
    handleResetModal();
    onClose();
  };

  // Add to meal plan
  const handleConfirmAddToMealPlan = () => {
    if (!scannedRecipe) return;
    if (onAddToMealPlan) {
      onAddToMealPlan(scannedRecipe);
    } else {
      onSaveRecipe(scannedRecipe);
    }
    handleResetModal();
    onClose();
  };

  const handleResetModal = () => {
    setSelectedFile(null);
    setFileBase64(null);
    setFilePreviewUrl(null);
    setPastedText('');
    setRecipeUrl('');
    setScannedRecipe(null);
    setErrorMessage(null);
    setAddedToListMessage(null);
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-100 flex items-center gap-2">
                <span>{scannedRecipe ? 'Review Scanned Recipe' : 'Import & Scan Recipe'}</span>
              </h2>
              <p className="text-xs text-stone-400">
                {scannedRecipe
                  ? 'Verify ingredients, instructions, and macro nutrition before uploading to your library.'
                  : 'Scan recipes from PDFs, photos, camera snapshots, pasted text, or web links. MenuHub extracts and adds the full recipe!'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {addedToListMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{addedToListMessage}</div>
            </div>
          )}

          {/* Mode 1: SCANNER FORM (When not yet reviewed) */}
          {!scannedRecipe && (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex rounded-xl bg-stone-950 p-1 border border-stone-800 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setTab('file');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    tab === 'file'
                      ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700/60'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PDF / Photo / Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('paste');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    tab === 'paste'
                      ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700/60'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-blue-400" />
                  <span>Paste Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('url');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    tab === 'url'
                      ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700/60'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>Web Link</span>
                </button>
              </div>

              {/* Tab 1: File Dropzone (PDF, Picture, or Camera) */}
              {tab === 'file' && (
                <div className="space-y-4">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : selectedFile
                        ? 'border-emerald-500/60 bg-stone-950/60'
                        : 'border-stone-800 hover:border-stone-700 bg-stone-950/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/png,image/jpeg,image/webp,image/gif,image/heic"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="space-y-3">
                        {filePreviewUrl ? (
                          <div className="relative inline-block mx-auto max-w-xs max-h-48 overflow-hidden rounded-xl border border-stone-700 shadow-lg">
                            <img
                              src={filePreviewUrl}
                              alt="Uploaded Recipe Preview"
                              className="w-full h-full object-cover max-h-44"
                            />
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/75 rounded text-[10px] text-stone-200 font-mono">
                              Photo / Screenshot
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                            <FileText className="w-8 h-8" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-stone-200">{selectedFile.name}</p>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.type || 'Document'}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ready for AI Scanning</span>
                        </div>
                        <p className="text-[11px] text-stone-400">
                          Click to select a different file, or click Scan & Extract below.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-800/80 border border-stone-700/60 flex items-center justify-center text-stone-400 group-hover:text-emerald-400 transition-colors">
                          <Upload className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-stone-200">
                            Drop your recipe PDF or photo here
                          </h4>
                          <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                            Supports PDF cookbooks, handwritten recipe cards, book photos, magazine clippings, or screenshots (.pdf, .jpg, .png, .webp).
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                          <span className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs font-medium border border-stone-700">
                            Browse Files
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cameraInputRef.current?.click();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Take Photo</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Preset Sample Card */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs text-stone-300">Don't have a file ready?</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadSamplePhotoDemo}
                      className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
                    >
                      Try Photo Demo
                    </button>
                  </div>

                  <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3.5 flex items-start gap-3">
                    <ChefHat className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-stone-400 leading-relaxed">
                      <strong className="text-stone-300">How it works:</strong> MenuHub scans the PDF or image using Gemini vision, transcribes ingredients & steps into a clean interactive recipe, and saves the recipe into your library. You can cook with it, scale it, track its nutrition, and cross-reference with your pantry!
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Paste Recipe Text */}
              {tab === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-300">
                      Recipe Text (Copied from Website, Blog, Email, or Notes)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLoadSamplePasted}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline"
                      >
                        Try Sample Text
                      </button>
                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs border border-stone-700 transition-colors"
                      >
                        <ClipboardPaste className="w-3.5 h-3.5 text-blue-400" />
                        <span>Paste Clipboard</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={9}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Paste any recipe text here... e.g.:

Tuscan Garlic Butter Chicken
Prep: 10 mins | Cook: 20 mins | Servings: 2
Ingredients:
2 chicken breasts
1 tbsp butter
4 cloves garlic
1 cup heavy cream
2 cups fresh spinach
1/2 cup sun dried tomatoes

Instructions:
1. Season chicken breasts and sear in olive oil until golden.
2. Sauté minced garlic in butter until fragrant.
3. Add heavy cream, sun-dried tomatoes, and simmer.
4. Fold in spinach until wilted, return chicken and serve.`}
                    className="w-full p-3.5 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed"
                  />

                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span>{pastedText.length} characters</span>
                    {pastedText.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPastedText('')}
                        className="text-stone-400 hover:text-stone-300"
                      >
                        Clear text
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Web Link / Recipe URL */}
              {tab === 'url' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-stone-300">
                        Recipe Web Page URL / Link
                      </label>
                      <button
                        type="button"
                        onClick={() => setRecipeUrl('https://www.allrecipes.com/recipe/228293/curry-stand-chicken-tikka-masala-sauce/')}
                        className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline"
                      >
                        Try Sample Link
                      </button>
                    </div>

                    <div className="relative">
                      <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="url"
                        value={recipeUrl}
                        onChange={(e) => setRecipeUrl(e.target.value)}
                        placeholder="https://www.foodnetwork.com/recipes/... or blog URL"
                        className="w-full pl-9 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3.5 flex items-start gap-3">
                    <Globe className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-stone-400 leading-relaxed">
                      <strong className="text-stone-300">Clean Recipe Scraping:</strong> Bianca scrapes the page, strips away all ads, newsletter popups, trackers, and long life stories, and extracts pure ingredients, measurements, and cooking instructions straight into your Recipe Library!
                    </div>
                  </div>
                </div>
              )}

              {/* Scanning status banner */}
              {isScanning && (
                <div className="p-4 rounded-xl bg-stone-950 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    <div>
                      <p className="text-xs font-semibold text-stone-200">
                        Scanning & Extracting Recipe...
                      </p>
                      <p className="text-[11px] text-emerald-400 animate-pulse font-mono mt-0.5">
                        {scanStep || 'Processing document...'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
                  </div>
                </div>
              )}

              {/* Bottom Trigger Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={
                    isScanning ||
                    (tab === 'file' && !selectedFile) ||
                    (tab === 'paste' && !pastedText.trim()) ||
                    (tab === 'url' && !recipeUrl.trim())
                  }
                  onClick={handleScanRecipe}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scanning with Bianca AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Scan & Extract Recipe</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: SCANNED RECIPE REVIEW & EDIT SCREEN */}
          {scannedRecipe && (
            <div className="space-y-6 animate-in fade-in">
              {/* Success Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Recipe parsed successfully! Review and customize details before uploading to your library.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setScannedRecipe(null)}
                  className="text-xs text-stone-400 hover:text-stone-200 underline shrink-0"
                >
                  Scan another
                </button>
              </div>

              {/* Dietary Conflict Alert Banner (if user has allergies or dislikes) */}
              {dietaryConflicts && (dietaryConflicts.hasAllergy || dietaryConflicts.hasDislike) && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold text-amber-300">Dietary Profile Alert:</span>
                    {dietaryConflicts.hasAllergy && (
                      <p className="text-rose-300">
                        Contains potential allergens: <strong className="underline">{dietaryConflicts.allergicItems.join(', ')}</strong>
                      </p>
                    )}
                    {dietaryConflicts.hasDislike && (
                      <p className="text-amber-200/90">
                        Contains ingredients you dislike: <strong>{dietaryConflicts.dislikedItems.join(', ')}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Title & Description */}
              <div className="space-y-3 bg-stone-950/60 p-4 rounded-xl border border-stone-800">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Recipe Title
                  </label>
                  <input
                    type="text"
                    value={scannedRecipe.title}
                    onChange={(e) => handleUpdateScannedField('title', e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm font-semibold text-stone-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={scannedRecipe.description}
                    onChange={(e) => handleUpdateScannedField('description', e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quick Attributes Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-semibold">Category</label>
                    <select
                      value={scannedRecipe.category}
                      onChange={(e) => handleUpdateScannedField('category', e.target.value as any)}
                      className="w-full mt-1 p-2 bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-200"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Snack</option>
                      <option value="Dessert">Dessert</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-semibold">Cuisine</label>
                    <input
                      type="text"
                      value={scannedRecipe.cuisine}
                      onChange={(e) => handleUpdateScannedField('cuisine', e.target.value)}
                      className="w-full mt-1 p-2 bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-200"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-stone-400 uppercase font-semibold">Servings</label>
                      <span className="text-[9px] text-emerald-400">Auto-Scaler</span>
                    </div>
                    {/* Serving Scaler */}
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => handleScaleServings(Math.max(1, (scannedRecipe.servings || 2) - 1))}
                        className="w-7 h-7 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center border border-stone-700"
                        title="Decrease servings & scale ingredients"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <div className="flex-1 py-1 px-2 bg-stone-900 border border-stone-700 rounded text-center text-xs font-bold text-stone-100">
                        {scannedRecipe.servings}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleScaleServings((scannedRecipe.servings || 2) + 1)}
                        className="w-7 h-7 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center border border-stone-700"
                        title="Increase servings & scale ingredients"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-semibold">Difficulty</label>
                    <select
                      value={scannedRecipe.difficulty}
                      onChange={(e) => handleUpdateScannedField('difficulty', e.target.value as any)}
                      className="w-full mt-1 p-2 bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-200"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-semibold">Prep Time (mins)</label>
                    <input
                      type="number"
                      value={scannedRecipe.prepTimeMinutes}
                      onChange={(e) => handleUpdateScannedField('prepTimeMinutes', parseInt(e.target.value, 10) || 0)}
                      className="w-full mt-1 p-2 bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-semibold">Cook Time (mins)</label>
                    <input
                      type="number"
                      value={scannedRecipe.cookTimeMinutes}
                      onChange={(e) => handleUpdateScannedField('cookTimeMinutes', parseInt(e.target.value, 10) || 0)}
                      className="w-full mt-1 p-2 bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-200"
                    />
                  </div>
                </div>
              </div>

              {/* Nutrition Breakdown Card */}
              <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                      Calculated Nutritional Breakdown (Per Serving)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRecalculateNutrition}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                    title="Recalculate nutrition from ingredients"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Recalculate</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-center">
                    <div className="text-[10px] text-stone-400 font-medium">Calories</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">{scannedRecipe.caloriesPerServing}</div>
                    <div className="text-[9px] text-stone-500">kcal</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-center">
                    <div className="text-[10px] text-stone-400 font-medium">Protein</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">{scannedRecipe.proteinGrams}g</div>
                    <div className="text-[9px] text-stone-500">muscle repair</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-center">
                    <div className="text-[10px] text-stone-400 font-medium">Carbs</div>
                    <div className="text-sm font-bold text-sky-400 mt-0.5">{scannedRecipe.carbsGrams}g</div>
                    <div className="text-[9px] text-stone-500">energy</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-center">
                    <div className="text-[10px] text-stone-400 font-medium">Fats</div>
                    <div className="text-sm font-bold text-rose-400 mt-0.5">{scannedRecipe.fatGrams}g</div>
                    <div className="text-[9px] text-stone-500">lipids</div>
                  </div>
                </div>

                {lifeHub && lifeHub.nutrition?.calorie_target && (
                  <div className="pt-1 flex items-center justify-between text-[11px] text-stone-400 bg-stone-900/60 p-2 rounded-lg border border-stone-800/80">
                    <div className="flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                      <span>LifeHub Daily Calorie Target:</span>
                    </div>
                    <span className="font-mono text-stone-200">
                      {scannedRecipe.caloriesPerServing} / {lifeHub.nutrition.calorie_target} kcal ({Math.round((scannedRecipe.caloriesPerServing / lifeHub.nutrition.calorie_target) * 100)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Pantry Cross-Reference Banner with 1-Click Shopping List */}
              <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                      Pantry Match: {inventoryAnalysis.inStock.length}/{scannedRecipe.ingredients.length} items in stock ({inventoryAnalysis.percentage}%)
                    </span>
                  </div>
                  {inventoryAnalysis.missing.length > 0 && onAddMissingToShoppingList && (
                    <button
                      type="button"
                      onClick={handleAddMissingToShopping}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Add {inventoryAnalysis.missing.length} Missing to Shopping List</span>
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      inventoryAnalysis.percentage === 100
                        ? 'bg-emerald-500'
                        : inventoryAnalysis.percentage >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${inventoryAnalysis.percentage}%` }}
                  />
                </div>
              </div>

              {/* Ingredients List */}
              <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                      Scanned Ingredients ({scannedRecipe.ingredients.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {scannedRecipe.ingredients.map((ing, idx) => {
                    // Check against inventory
                    const inStock = inventory.some((inv) => normalizeName(inv.name) === normalizeName(ing.name));

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-stone-900 border border-stone-800 rounded-lg text-xs"
                      >
                        <input
                          type="number"
                          step="any"
                          value={ing.quantity}
                          onChange={(e) => handleUpdateIngredient(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-100 font-mono text-center"
                        />
                        <input
                          type="text"
                          value={ing.unit}
                          onChange={(e) => handleUpdateIngredient(idx, 'unit', e.target.value)}
                          placeholder="unit"
                          className="w-16 px-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-200 text-center"
                        />
                        <input
                          type="text"
                          value={ing.name}
                          onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                          className="flex-1 px-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-100"
                        />
                        {inStock ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20 whitespace-nowrap hidden sm:inline-block">
                            In Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20 whitespace-nowrap hidden sm:inline-block">
                            To Buy
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="p-1 text-stone-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                      Step-by-Step Instructions ({scannedRecipe.instructions.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddInstruction}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {scannedRecipe.instructions.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-stone-800 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                        {idx + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={step}
                        onChange={(e) => handleUpdateInstruction(idx, e.target.value)}
                        className="flex-1 p-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(idx)}
                        className="p-1.5 text-stone-500 hover:text-rose-400 transition-colors mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detected Equipment */}
              {scannedRecipe.equipmentNeeded && scannedRecipe.equipmentNeeded.length > 0 && (
                <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                      Required Equipment
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {scannedRecipe.equipmentNeeded.map((eq, idx) => {
                      const owned = equipment.some(
                        (e) => e.owned && e.name.toLowerCase().includes(eq.toLowerCase())
                      );
                      return (
                        <span
                          key={idx}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                            owned
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-stone-800 text-stone-300 border-stone-700'
                          }`}
                        >
                          {owned ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                          <span>{eq}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-900/90 flex items-center justify-between gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            Cancel
          </button>

          {scannedRecipe ? (
            <div className="flex flex-wrap items-center gap-2">
              {onAddToMealPlan && (
                <button
                  type="button"
                  onClick={handleConfirmAddToMealPlan}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 flex items-center gap-1.5 transition-colors"
                  title="Schedule this recipe in your weekly meal plan"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Add to Meal Plan</span>
                </button>
              )}

              {onStartCooking && (
                <button
                  type="button"
                  onClick={() => handleConfirmSave(true)}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
                >
                  Save & Cook Now
                </button>
              )}

              <button
                type="button"
                onClick={() => handleConfirmSave(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Upload Recipe to Library</span>
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-stone-500 hidden sm:block">
              {tab === 'file' ? 'Upload a file or take a photo to scan' : 'Paste recipe text to scan'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
