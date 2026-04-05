import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';

// Get API key from user settings in DB
export async function getGeminiApiKey() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from('user_settings')
        .select('gemini_api_key')
        .eq('user_id', user.id)
        .single();

    return data?.gemini_api_key || null;
}

// Save API key to user settings
export async function saveGeminiApiKey(apiKey) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            gemini_api_key: apiKey
        }, { onConflict: 'user_id' });

    if (error) throw error;
}

// Create Gemini client
async function createGeminiClient() {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) throw new Error('Gemini API key not configured. Go to Account settings to add it.');
    return new GoogleGenerativeAI(apiKey);
}

// Complete a single product - fills in empty fields based on what's provided
export async function completeProduct(partialProduct) {
    const genAI = await createGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Fetch existing categories and ingredients from DB so AI only uses valid options
    const [categoriesRes, ingredientsRes] = await Promise.all([
        supabase.from('categories').select('name, slug').eq('is_active', true),
        supabase.from('ingredients').select('name_en, name_ar, slug')
    ]);

    const existingCategories = (categoriesRes.data || []).map(c => c.name);
    const existingIngredients = (ingredientsRes.data || []).map(i => i.name_en).filter(Boolean);

    const prompt = `You are a content writer for AseelFemme, a luxury organic handcrafted soap brand from Jordan.

Given the following partial product data, COMPLETE ONLY THE EMPTY/MISSING fields.
Keep any existing values exactly as they are - only fill in what's empty or missing.
Generate elegant, luxurious descriptions that appeal to premium skincare customers.
Arabic translations should be natural and eloquent, not literal translations.

IMPORTANT CONSTRAINTS:
- For categoryEn/categoryAr: You MUST use ONLY one of these existing categories: ${existingCategories.length > 0 ? existingCategories.join(', ') : 'Rose, Mint, Lavender, Citrus'}
- Do NOT invent new categories that don't exist in the system
${existingIngredients.length > 0 ? `- Available ingredients for reference: ${existingIngredients.join(', ')}` : ''}

CURRENT PRODUCT DATA:
${JSON.stringify(partialProduct, null, 2)}

FIELDS TO COMPLETE (only if empty):
- nameEn, nameAr: Product name in English and Arabic
- slug: URL-friendly slug from English name (lowercase, hyphens)
- shortDescriptionEn, shortDescriptionAr: Short tagline (1-2 sentences)
- longDescriptionEn, longDescriptionAr: Detailed description (2-3 paragraphs)
- categoryEn, categoryAr: MUST be from: ${existingCategories.length > 0 ? existingCategories.join(', ') : 'Rose, Mint, Lavender, Citrus'}
- shape: Physical shape (Bar, Ring, Heart, etc.)
- color: Color description
- scentProfileEn, scentProfileAr: Scent description
- skinType: ALL, DRY, OILY, COMBINATION, or SENSITIVE
- weightGrams: Typical soap weight (80-150g)
- benefitsEn, benefitsAr: Array of 3-5 benefits

IMPORTANT:
- Only fill EMPTY fields, preserve all existing values
- Make descriptions feel luxurious and natural
- Arabic should sound natural, not Google Translated
- ONLY use categories from the list above

Return ONLY valid JSON object. No markdown, no explanation, no code blocks.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean up response - remove markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    return JSON.parse(cleanText);
}

// Complete a single ingredient
export async function completeIngredient(partialIngredient) {
    const genAI = await createGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a content writer for AseelFemme, a luxury organic soap brand.

Given the following partial ingredient data, COMPLETE ONLY THE EMPTY/MISSING fields.
Keep any existing values exactly as they are.
Focus on skincare benefits and natural properties.

CURRENT INGREDIENT DATA:
${JSON.stringify(partialIngredient, null, 2)}

FIELDS TO COMPLETE (only if empty):
- nameEn, nameAr: Ingredient name in English and Arabic
- slug: URL-friendly slug from English name
- descriptionEn, descriptionAr: Description of the ingredient and its properties
- benefitsEn, benefitsAr: Array of 3-5 specific skincare benefits

IMPORTANT:
- Only fill EMPTY fields, preserve all existing values
- Make descriptions informative but elegant
- Arabic should sound natural

Return ONLY valid JSON object. No markdown, no explanation, no code blocks.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    return JSON.parse(cleanText);
}
