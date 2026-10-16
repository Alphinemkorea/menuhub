import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// LifeHub Context Store (represents LifeHub GET /api/integrations/bianca/fitness-context)
let lifeHubContext = {
  user_id: '',
  user_name: '',
  source: 'LifeHub Connection Ready',
  last_synced: new Date().toISOString(),
  fitness: {
    goal: 'maintenance',
    goal_label: 'Target Wellness & Fitness',
    current_weight: 0,
    target_weight: 0,
    unit: 'kg',
    weekly_change_target: '0 kg/week',
  },
  activity: {
    level: 'moderate',
    workouts_per_week: 3,
    primary_discipline: 'General Fitness',
    today_active_energy: '0 kcal burned',
  },
  nutrition: {
    calorie_target: 2000,
    protein_target: 120, // g
    carbs_target: 250,   // g
    fats_target: 65,     // g
    meal_split: {
      breakfast: { calories: 500, protein: 30, note: 'Morning fuel' },
      lunch: { calories: 650, protein: 40, note: 'Midday meal' },
      dinner: { calories: 650, protein: 40, note: 'Evening recovery' },
      snack: { calories: 200, protein: 10, note: 'Light snack' },
    },
  },
  biometrics: {
    hydration_target_liters: 2.5,
    allergies_synced: [] as string[],
    dietary_flags: [] as string[],
  },
};

// API: Get LifeHub context
app.get('/api/lifehub/context', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: lifeHubContext,
  });
});

// API: Update or custom-sync LifeHub context
app.post('/api/lifehub/context', (req: Request, res: Response) => {
  const updates = req.body;
  lifeHubContext = {
    ...lifeHubContext,
    ...updates,
    last_synced: new Date().toISOString(),
  };
  res.json({
    success: true,
    message: 'LifeHub fitness context synced successfully',
    data: lifeHubContext,
  });
});

// API: Bianca Chat & Reasoning Engine
app.post('/api/bianca/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      inventory = [],
      equipment = [],
      preferences = {},
      lifeHub = lifeHubContext,
      currentCookingSession = null,
      recipes = [],
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API is not initialized. Please ensure GEMINI_API_KEY is configured.',
      });
    }

    // Prepare rich system context
    const expiringSoon = inventory
      .filter((item: any) => {
        if (!item.expiryDate) return false;
        const diff = (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
        return diff <= 3 && diff >= -1;
      })
      .map((i: any) => `${i.name} (${i.quantity} ${i.unit}, expires in ${i.expiryDate})`);

    const inventorySummary = inventory
      .map((i: any) => `${i.name}: ${i.quantity} ${i.unit} [${i.location || 'pantry'}]`)
      .join(', ');

    const equipmentOwned = equipment
      .filter((e: any) => e.owned)
      .map((e: any) => e.name)
      .join(', ');

    const equipmentNotOwned = equipment
      .filter((e: any) => !e.owned)
      .map((e: any) => e.name)
      .join(', ');

    const systemPrompt = `You are Bianca, the personal AI Culinary and Nutrition Intelligence coordinator for MenuHub, seamlessly bridged with LifeHub.

CORE OPERATIONAL ARCHITECTURE:
- MenuHub owns: Recipes, Ingredient Inventory, Cooking Equipment, Culinary Preferences, Meal Plans, and Real-time Cooking Sessions.
- LifeHub owns: Health metrics, Fitness goals (${lifeHub?.fitness?.goal_label || 'Weight Gain'}, current: ${lifeHub?.fitness?.current_weight}kg, target: ${lifeHub?.fitness?.target_weight}kg), Daily Nutrition Targets (${lifeHub?.nutrition?.calorie_target} kcal, ${lifeHub?.nutrition?.protein_target}g protein).
- Bianca is the intelligent brain bridging them. You NEVER hallucinate equipment the user lacks. If a recipe needs an oven and user doesn't have an oven, you immediately adapt the recipe for stovetop, air fryer, or pan cooking.
- Always be knowledgeable, supportive, concise, and culinary-sharp.

CURRENT USER CONTEXT:
- Available Inventory: ${inventorySummary || 'No ingredients currently recorded'}
- Expiring Soon Ingredients: ${expiringSoon.length > 0 ? expiringSoon.join('; ') : 'None'}
- Equipment Owned: ${equipmentOwned || 'Stovetop, Frying Pan'}
- Equipment User LACKS: ${equipmentNotOwned || 'None listed'}
- Food Preferences:
  * Dislikes: ${preferences?.dislikes?.join(', ') || 'None'}
  * Allergies: ${preferences?.allergies?.join(', ') || 'None'}
  * Dietary Rules: ${preferences?.dietaryRestrictions?.join(', ') || 'None'}
  * Favorite Cuisines: ${preferences?.favoriteCuisines?.join(', ') || 'Kenyan, Mediterranean, Pan-Asian'}
  * Favorite Ingredients: ${preferences?.favoriteIngredients?.join(', ') || 'Chicken, Eggs, Rice, Chapati'}
  * Spice Level: ${preferences?.spiceLevel || 'Medium'}
- LifeHub Fitness Targets:
  * Goal: ${lifeHub?.fitness?.goal_label || 'Weight & Muscle Gain'}
  * Calories: ${lifeHub?.nutrition?.calorie_target || 2800} kcal/day
  * Protein: ${lifeHub?.nutrition?.protein_target || 140}g/day
${currentCookingSession ? `- Active Cooking Session in progress: Recipe "${currentCookingSession.recipeTitle}", currently at Step ${currentCookingSession.currentStepIndex + 1}/${currentCookingSession.totalSteps}: "${currentCookingSession.currentStepText}"` : ''}

INSTRUCTIONS:
1. Answer naturally and with culinary authority.
2. If the user asks for what to cook, prioritize items that are EXPIRING SOON and ingredients ALREADY IN INVENTORY.
3. If recommending or creating a recipe, break down how it contributes to their LifeHub protein/calorie target (e.g. "This meal delivers ~52g protein, knocking out 37% of your 140g daily LifeHub goal").
4. If you suggest a full recipe, include a structured JSON block at the very end of your response inside a \`\`\`json\`\`\` code block with schema:
{
  "type": "recipe_suggestion",
  "recipe": {
    "title": "string",
    "description": "string",
    "category": "Breakfast" | "Lunch" | "Dinner" | "Snack",
    "cuisine": "string",
    "prepTimeMinutes": number,
    "cookTimeMinutes": number,
    "servings": number,
    "difficulty": "Easy" | "Medium" | "Advanced",
    "equipmentNeeded": ["string"],
    "caloriesPerServing": number,
    "proteinGrams": number,
    "carbsGrams": number,
    "fatGrams": number,
    "fitnessGoalAlignment": "string",
    "ingredients": [
      { "name": "string", "quantity": number, "unit": "string", "inInventory": boolean, "optional": boolean }
    ],
    "instructions": ["Step 1...", "Step 2..."]
  }
}
5. If the user asks to add or adjust ingredients, you can return a JSON block with:
{ "type": "inventory_action", "action": "add" | "remove", "items": [{ "name": "string", "quantity": number, "unit": "string" }] }
6. Keep conversational tone warm, respectful, practical, and clean without markdown fluff.`;

    // Build contents array for Gemini
    const contents: any[] = [];

    // Append history
    for (const msg of history.slice(-6)) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const replyText = response.text || '';

    // Check if reply contains a structured action JSON
    let parsedAction: any = null;
    const jsonMatch = replyText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        parsedAction = JSON.parse(jsonMatch[1]);
      } catch (e) {
        // Ignore json parse error
      }
    }

    res.json({
      success: true,
      text: replyText,
      action: parsedAction,
    });
  } catch (error: any) {
    console.error('Error in /api/bianca/chat:', error);
    res.status(500).json({
      error: error.message || 'Failed to process chat message with Bianca',
    });
  }
});

// API: Direct Recipe Generation from Bianca
app.post('/api/bianca/generate-recipe', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      inventory = [],
      equipment = [],
      preferences = {},
      lifeHub = lifeHubContext,
      targetCategory = 'Dinner',
      maxCookTimeMinutes,
    } = req.body;

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured' });
    }

    const availableIngredients = inventory.map((i: any) => `${i.name} (${i.quantity} ${i.unit})`).join(', ');
    const ownedEquipment = equipment.filter((e: any) => e.owned).map((e: any) => e.name).join(', ');

    const promptText = `Generate a delicious, realistic, personalized recipe for MenuHub.
User Request: ${prompt || 'Create an optimal recipe for today'}
Category: ${targetCategory}
Max cook time: ${maxCookTimeMinutes ? maxCookTimeMinutes + ' minutes' : 'Flexible'}

Context:
- In-stock Ingredients: ${availableIngredients || 'Standard kitchen pantry'}
- Equipment Owned: ${ownedEquipment || 'Gas cooker, frying pan, pot'}
- Preferences: Dislikes: ${preferences?.dislikes?.join(', ') || 'None'}; Allergies: ${preferences?.allergies?.join(', ') || 'None'}; Preferred Cuisines: ${preferences?.favoriteCuisines?.join(', ') || 'Kenyan, Mediterranean, International'}
- LifeHub Target: Goal is ${lifeHub?.fitness?.goal_label || 'Weight & Muscle Gain'}, Target Calories per meal: ~${lifeHub?.nutrition?.meal_split?.[targetCategory.toLowerCase()]?.calories || 800} kcal, Target Protein: ~${lifeHub?.nutrition?.meal_split?.[targetCategory.toLowerCase()]?.protein || 45}g.

CRITICAL: Return ONLY valid JSON with this exact schema:
{
  "title": "string",
  "description": "string",
  "category": "${targetCategory}",
  "cuisine": "string",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "difficulty": "Easy" | "Medium" | "Advanced",
  "equipmentNeeded": ["string"],
  "caloriesPerServing": number,
  "proteinGrams": number,
  "carbsGrams": number,
  "fatGrams": number,
  "fitnessGoalAlignment": "string explaining how this hits the LifeHub target",
  "ingredients": [
    { "name": "string", "quantity": number, "unit": "string", "inInventory": boolean, "optional": boolean }
  ],
  "instructions": [
    "Step 1...",
    "Step 2..."
  ],
  "chefTips": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      recipe: parsed,
    });
  } catch (error: any) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recipe' });
  }
});

// API: Scan & Extract Recipe from File (PDF or Picture), Pasted Text, or Web URL
app.post('/api/bianca/scan-recipe', async (req: Request, res: Response) => {
  try {
    const {
      mode, // 'file' | 'text' | 'url'
      fileBase64,
      mimeType = 'image/jpeg',
      text,
      url,
    } = req.body;

    if (mode === 'url' && (!url || !url.trim())) {
      return res.status(400).json({ error: 'Please provide a valid recipe web link / URL.' });
    }

    if (mode === 'text' && (!text || !text.trim())) {
      return res.status(400).json({ error: 'Please provide recipe text to scan and process.' });
    }

    if (mode === 'file' && (!fileBase64 || !fileBase64.trim())) {
      return res.status(400).json({ error: 'Please provide a file (PDF or picture) to scan.' });
    }

    // Heuristic fallback text parser in case Gemini API is offline or returns error
    const parseTextFallback = (rawText: string) => {
      const lines = rawText.split('\n').map((l: string) => l.trim()).filter(Boolean);
      const title = lines[0]?.replace(/^[#*-\s]+/, '') || 'Scanned Recipe';

      const ingredients: Array<{ name: string; quantity: number; unit: string; optional: boolean }> = [];
      const instructions: string[] = [];
      let inIngredients = false;
      let inInstructions = false;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();

        if (lower.includes('ingredient')) {
          inIngredients = true;
          inInstructions = false;
          continue;
        } else if (
          lower.includes('instruction') ||
          lower.includes('direction') ||
          lower.includes('method') ||
          lower.includes('preparation') ||
          lower.includes('steps')
        ) {
          inIngredients = false;
          inInstructions = true;
          continue;
        }

        if (inIngredients) {
          const match = line.match(/^[-*•]?\s*([\d\/\.\s]+)?\s*(tbsp|tablespoon|tsp|teaspoon|cup|cups|g|gram|grams|kg|ml|oz|ounce|ounces|lb|lbs|pound|pounds|clove|cloves|can|cans|pinch|slice|slices|piece|pieces)?\s+(.+)$/i);
          if (match) {
            let qty = 1;
            if (match[1]) {
              const val = match[1].trim();
              if (val.includes('/')) {
                const [n, d] = val.split('/').map(Number);
                qty = d ? n / d : 1;
              } else {
                qty = parseFloat(val) || 1;
              }
            }
            ingredients.push({
              name: match[3]?.replace(/[,\.;]+$/, '').trim() || line,
              quantity: qty,
              unit: match[2]?.toLowerCase() || 'pcs',
              optional: false,
            });
          } else {
            ingredients.push({
              name: line.replace(/^[-*•]\s*/, '').trim(),
              quantity: 1,
              unit: 'pcs',
              optional: false,
            });
          }
        } else if (inInstructions) {
          const step = line.replace(/^(\d+[\.\)]\s*|[-*•]\s*)/, '').trim();
          if (step.length > 5) {
            instructions.push(step);
          }
        } else {
          if (/^\d+[\.\)]\s+/.test(line)) {
            instructions.push(line.replace(/^\d+[\.\)]\s+/, '').trim());
          } else if (/^[-*•]\s+/.test(line) || /^\d+\s*(?:g|tbsp|tsp|cup|ml|oz|clove)/i.test(line)) {
            ingredients.push({
              name: line.replace(/^[-*•]\s*/, '').trim(),
              quantity: 1,
              unit: 'pcs',
              optional: false,
            });
          }
        }
      }

      if (instructions.length === 0 && lines.length > 2) {
        instructions.push(...lines.slice(Math.floor(lines.length / 2)));
      }

      return {
        title,
        description: 'Digitally extracted and processed recipe.',
        category: 'Dinner',
        cuisine: 'International',
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 2,
        difficulty: 'Medium',
        equipmentNeeded: ['Cooking pot', 'Chef knife'],
        caloriesPerServing: 520,
        proteinGrams: 32,
        carbsGrams: 45,
        fatGrams: 16,
        fitnessGoalAlignment: 'Balanced home-cooked meal profile',
        ingredients: ingredients.length > 0 ? ingredients : [{ name: 'Assorted ingredients', quantity: 1, unit: 'servings', optional: false }],
        instructions: instructions.length > 0 ? instructions : ['Prepare ingredients as directed.', 'Cook and serve warm.'],
        chefTips: 'Adjust seasonings to taste.',
      };
    };

    if (!ai) {
      if (mode === 'text') {
        const fallback = parseTextFallback(text);
        return res.json({ success: true, recipe: fallback, source: 'heuristic_fallback' });
      }
      return res.status(500).json({
        error: 'Gemini AI API key is not configured. Please ensure GEMINI_API_KEY is configured in settings.',
      });
    }

    if (mode === 'file') {
      let cleanBase64 = fileBase64;
      let finalMime = mimeType;
      if (fileBase64.includes(';base64,')) {
        const parts = fileBase64.split(';base64,');
        finalMime = parts[0].replace(/^data:/, '') || finalMime;
        cleanBase64 = parts[1];
      }

      const prompt = `You are Bianca, the premier culinary and document vision intelligence engine for MenuHub.
Scan and thoroughly analyze this attached recipe document/image (which could be a PDF document, screenshot, cookbook page, handwritten recipe card, or food magazine clipping).
Your objective is to extract and reconstruct the entire recipe into a pristine, structured JSON object.
Do NOT return the file or raw text; convert all details into structured recipe data.

Rules:
1. Title: Clear, authentic, appetizing title.
2. Description: 1-2 sentence description highlighting flavor profile and preparation.
3. Category: Must be exactly one of: "Breakfast", "Lunch", "Dinner", "Snack", "Dessert".
4. Cuisine: Realistic cuisine (e.g., Italian, Mexican, Kenyan, Pan-Asian, Mediterranean, French, American).
5. Prep and Cook Time: Extract or estimate realistic minutes.
6. Servings: Number of servings (default to 2 or 4 if unspecified).
7. Difficulty: "Easy", "Medium", or "Advanced".
8. Equipment Needed: List of kitchen equipment required (e.g. ["Skillet", "Chef knife", "Blender"]).
9. Macronutrients & Calories: Calculate realistic nutritional figures per serving based on the ingredient quantities (caloriesPerServing, proteinGrams, carbsGrams, fatGrams).
10. Ingredients: Array of { "name": string, "quantity": number, "unit": string, "optional": boolean }. Normalize units (e.g., g, ml, tbsp, tsp, cup, cloves, pieces, cans, slices).
11. Instructions: Array of step-by-step instructions in clear chronological cooking order.
12. Chef Tips: 1-2 practical tips for best results.
13. Fitness Goal Alignment: 1 sentence on nutritional value (e.g. "High protein recovery meal").

Return ONLY valid JSON with this exact schema:
{
  "title": "string",
  "description": "string",
  "category": "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Dessert",
  "cuisine": "string",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "difficulty": "Easy" | "Medium" | "Advanced",
  "equipmentNeeded": ["string"],
  "caloriesPerServing": number,
  "proteinGrams": number,
  "carbsGrams": number,
  "fatGrams": number,
  "fitnessGoalAlignment": "string",
  "ingredients": [
    { "name": "string", "quantity": number, "unit": "string", "optional": boolean }
  ],
  "instructions": [
    "Step 1...",
    "Step 2..."
  ],
  "chefTips": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: finalMime,
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        recipe: parsed,
      });
    }

    if (mode === 'text') {
      const prompt = `You are Bianca, the culinary AI parser for MenuHub.
The user has copied and pasted raw recipe text (from a website, blog, notes, email, or chat).
Scan, clean, and convert this text into a pristine, structured JSON recipe object.
Ensure all ingredient quantities, units, and instructions are extracted accurately.
If nutritional data is missing from the text, calculate accurate macros (calories, protein, carbs, fat) from the ingredient list.

Pasted Raw Recipe:
"""
${text}
"""

Return ONLY valid JSON matching this schema:
{
  "title": "string",
  "description": "string",
  "category": "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Dessert",
  "cuisine": "string",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "difficulty": "Easy" | "Medium" | "Advanced",
  "equipmentNeeded": ["string"],
  "caloriesPerServing": number,
  "proteinGrams": number,
  "carbsGrams": number,
  "fatGrams": number,
  "fitnessGoalAlignment": "string",
  "ingredients": [
    { "name": "string", "quantity": number, "unit": "string", "optional": boolean }
  ],
  "instructions": [
    "Step 1...",
    "Step 2..."
  ],
  "chefTips": "string"
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({
          success: true,
          recipe: parsed,
        });
      } catch (geminiError: any) {
        console.warn('Gemini text parse error, running heuristic fallback:', geminiError);
        const fallback = parseTextFallback(text);
        return res.json({
          success: true,
          recipe: fallback,
          note: 'Parsed via local culinary heuristic engine.',
        });
      }
    }

    if (mode === 'url') {
      let pageText = '';
      try {
        const response = await fetch(url.trim(), {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        const html = await response.text();
        pageText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 15000);
      } catch (fetchErr: any) {
        return res.status(400).json({ error: `Failed to fetch recipe webpage: ${fetchErr.message}` });
      }

      const prompt = `You are Bianca, the culinary AI parser for MenuHub.
A user provided the web URL: "${url}".
Here is the extracted textual content from the webpage:
"""
${pageText}
"""

Extract the primary recipe cleanly from this webpage text. Strip out all ads, promotional copy, blogger backstory, and comments.
Structure the entire recipe cleanly matching this schema:
{
  "title": "string",
  "description": "string",
  "category": "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Dessert",
  "cuisine": "string",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "difficulty": "Easy" | "Medium" | "Advanced",
  "equipmentNeeded": ["string"],
  "caloriesPerServing": number,
  "proteinGrams": number,
  "carbsGrams": number,
  "fatGrams": number,
  "fitnessGoalAlignment": "string",
  "ingredients": [
    { "name": "string", "quantity": number, "unit": "string", "optional": boolean }
  ],
  "instructions": [
    "Step 1...",
    "Step 2..."
  ],
  "chefTips": "string"
}`;

      try {
        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });

        const parsed = JSON.parse(aiResponse.text || '{}');
        return res.json({ success: true, recipe: parsed, source: 'url' });
      } catch (err: any) {
        const fallback = parseTextFallback(pageText);
        return res.json({ success: true, recipe: fallback, note: 'Extracted via fallback parser' });
      }
    }

    return res.status(400).json({ error: 'Invalid mode. Must be "file", "text", or "url".' });
  } catch (error: any) {
    console.error('Error in /api/bianca/scan-recipe:', error);
    res.status(500).json({
      error: error.message || 'Failed to scan and process recipe',
    });
  }
});

// API: Scan & Extract Grocery Receipt / Supermarket Invoice
app.post('/api/bianca/scan-receipt', async (req: Request, res: Response) => {
  try {
    const { mode = 'file', fileBase64, mimeType = 'image/jpeg', text } = req.body;

    const receiptPrompt = `You are Bianca, the kitchen inventory manager for MenuHub.
Analyze this supermarket/grocery receipt or delivery invoice (which could be a photo, PDF, or text).
Extract all purchased edible food items and kitchen groceries into structured pantry inventory items.

Rules:
1. Translate or normalize brand names/abbreviations into clean ingredient names (e.g., "ORG CARROTS 1LB" -> "Carrots", "BNLS SKNLS CHICK" -> "Chicken Breast", "GALA APPLS 3LB" -> "Gala Apples").
2. Assign category: exactly one of "Produce", "Protein & Dairy", "Pantry & Grains", "Spices & Sauces", "Bakery", "Other".
3. Assign location: "Fridge", "Pantry", or "Freezer".
4. Estimate realistic expiration window in days from purchase (e.g., fresh berries: 4-5 days, chicken: 3 days, milk: 7 days, pasta/rice: 180 days, canned goods: 365 days).
5. Extract realistic quantity (number) and unit (e.g. g, kg, lbs, pcs, bunch, pack, bottles, cans).

Return ONLY valid JSON matching this schema:
{
  "storeName": "string",
  "purchaseDate": "YYYY-MM-DD",
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
      "category": "Produce" | "Protein & Dairy" | "Pantry & Grains" | "Spices & Sauces" | "Bakery" | "Other",
      "location": "Fridge" | "Pantry" | "Freezer",
      "estimatedExpiryDays": number,
      "estimatedPrice": number
    }
  ]
}`;

    if (!ai) {
      const sampleItems = (text || 'Milk\nEggs\nBananas\nChicken Breast\nOlive Oil')
        .split('\n')
        .filter(Boolean)
        .slice(0, 10)
        .map((line: string, i: number) => ({
          name: line.replace(/^[-*•\d\.\$]+\s*/, '').trim(),
          quantity: 1,
          unit: 'pcs',
          category: 'Produce',
          location: 'Fridge',
          estimatedExpiryDays: 7,
          estimatedPrice: 3.5,
        }));
      return res.json({
        success: true,
        receipt: {
          storeName: 'Local Market',
          purchaseDate: new Date().toISOString().split('T')[0],
          items: sampleItems,
        },
      });
    }

    let parsedResult: any = null;

    if (mode === 'file' && fileBase64) {
      let cleanBase64 = fileBase64;
      let finalMime = mimeType;
      if (fileBase64.includes(';base64,')) {
        const parts = fileBase64.split(';base64,');
        finalMime = parts[0].replace(/^data:/, '') || finalMime;
        cleanBase64 = parts[1];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: finalMime, data: cleanBase64 } },
              { text: receiptPrompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      parsedResult = JSON.parse(response.text || '{}');
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${receiptPrompt}\n\nReceipt Text:\n"""\n${text || ''}\n"""`,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      parsedResult = JSON.parse(response.text || '{}');
    }

    return res.json({
      success: true,
      receipt: parsedResult,
    });
  } catch (err: any) {
    console.error('Error in /api/bianca/scan-receipt:', err);
    res.status(500).json({ error: err.message || 'Failed to scan receipt' });
  }
});

// API: Zero-Waste Fridge Cleanout Recipe Generator
app.post('/api/bianca/remix-leftovers', async (req: Request, res: Response) => {
  try {
    const { ingredients = [], mealType = 'Dinner', maxCookTimeMinutes = 20, lifeHub = lifeHubContext } = req.body;

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: 'Please provide at least 1-2 leftover ingredients.' });
    }

    const prompt = `You are Bianca, the zero-waste culinary intelligence coordinator for MenuHub.
The user has these leftover/expiring ingredients in their kitchen that they need to use up immediately:
${ingredients.join(', ')}

Create a fast (under ${maxCookTimeMinutes} minutes), ultra-satisfying, zero-waste meal that features these ingredients as the stars.
Align with their fitness target (~${lifeHub?.nutrition?.protein_target || 140}g daily protein target).

Return ONLY valid JSON matching this schema:
{
  "title": "string",
  "description": "string (mentioning how it brilliantly rescues the leftover ingredients)",
  "category": "${mealType}",
  "cuisine": "string",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": 2,
  "difficulty": "Easy",
  "equipmentNeeded": ["string"],
  "caloriesPerServing": number,
  "proteinGrams": number,
  "carbsGrams": number,
  "fatGrams": number,
  "fitnessGoalAlignment": "string",
  "ingredients": [
    { "name": "string", "quantity": number, "unit": "string", "inInventory": boolean, "optional": boolean }
  ],
  "instructions": ["Step 1...", "Step 2..."],
  "chefTips": "string"
}`;

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, recipe: parsed });
  } catch (err: any) {
    console.error('Error in /api/bianca/remix-leftovers:', err);
    res.status(500).json({ error: err.message || 'Failed to remix leftovers' });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MenuHub server with Bianca engine listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
