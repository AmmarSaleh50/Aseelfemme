import { supabase, signIn, signOut, getSession } from './supabase';

// Helper to transform snake_case to camelCase
const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

// Helper to transform camelCase to snake_case
const toSnakeCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

// API wrapper that mimics axios interface
const createResponse = (data) => ({ data: toCamelCase(data) });

// Parse URL params
const parseParams = (url) => {
  const [path, queryString] = url.split('?');
  const params = new URLSearchParams(queryString || '');
  return { path, params };
};

// Public API methods (no auth required)
const publicApi = {
  // GET /products - list published products with optional filters
  async getProducts(params) {
    let query = supabase
      .from('products')
      .select(`
        *,
        ingredients:product_ingredients(
          ingredient:ingredients(*)
        ),
        categories:product_categories(
          category:categories(*)
        )
      `);

    const status = params.get('status');
    if (status && status.toLowerCase() !== 'all') {
      query = query.eq('status', status.toUpperCase());
    }

    // For category filter, we need to do a subquery or filter in JS after fetching
    const categoryFilter = params.get('category');

    const skinType = params.get('skinType');
    if (skinType) {
      query = query.eq('skin_type', skinType);
    }

    // Support both old 'shape' and new 'shapeEn' params
    const shape = params.get('shape') || params.get('shapeEn');
    if (shape) {
      query = query.or(`shape_en.eq.${shape},shape.eq.${shape}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Flatten ingredients and categories from junction tables
    let products = (data || []).map(p => ({
      ...p,
      ingredients: (p.ingredients || []).map(pi => pi.ingredient),
      // Build categories array from junction table
      productCategories: (p.categories || []).map(pc => pc.category).filter(Boolean),
    }));

    // Filter by category if specified (match by nameEn or nameAr)
    if (categoryFilter) {
      products = products.filter(p =>
        p.productCategories?.some(c =>
          c?.nameEn === categoryFilter || c?.nameAr === categoryFilter || c?.name === categoryFilter
        ) ||
        // Fallback to old category fields for backwards compatibility
        p.categoryEn === categoryFilter || p.categoryAr === categoryFilter
      );
    }

    return createResponse(products);
  },

  // GET /products/:slug - get single product by slug
  async getProductBySlug(slug) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        ingredients:product_ingredients(
          ingredient:ingredients(*)
        ),
        categories:product_categories(
          category:categories(*)
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;

    // Flatten ingredients and categories
    const product = {
      ...data,
      ingredients: (data.ingredients || []).map(pi => pi.ingredient),
      productCategories: (data.categories || []).map(pc => pc.category).filter(Boolean),
    };

    return createResponse(product);
  },

  // GET /ingredients - list all ingredients
  async getIngredients() {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return createResponse(data);
  },

  // GET /ingredients/:slug
  async getIngredientBySlug(slug) {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return createResponse(data);
  },

  // GET /categories
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('order');
    if (error) throw error;
    return createResponse(data);
  },

  // GET /highlights
  async getHighlights() {
    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .order('order');
    if (error) throw error;
    return createResponse(data);
  },

  // GET /testimonials
  async getTestimonials() {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('id', { ascending: false });
    if (error) throw error;
    return createResponse(data);
  },

  // POST /subscribe
  async subscribe(email) {
    const { data, error } = await supabase
      .from('subscribers')
      .upsert({ email }, { onConflict: 'email' })
      .select()
      .single();
    if (error) throw error;
    return createResponse(data);
  },

  // POST /contact
  async submitContact(contactData) {
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert(toSnakeCase(contactData))
      .select()
      .single();
    if (error) throw error;
    return createResponse(data);
  },
  // GET /accessories
  async getAccessories() {
    const { data, error } = await supabase
      .from('accessories')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return createResponse(data);
  },

  // GET /accessories/:slug
  async getAccessoryBySlug(slug) {
    const { data, error } = await supabase
      .from('accessories')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return createResponse(data);
  }
};

// Admin API methods (auth required)
const adminApi = {
  // POST /admin/upload - upload file to Supabase Storage
  async uploadFile(formData) {
    const file = formData.get('file');
    if (!file) throw new Error('No file provided');

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;
    const path = `uploads/${uniqueName}`;

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(path, file, { upsert: true });

    if (error) throw error;

    // Get full public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(data.path);

    return { data: { url: publicUrl } };
  },

  // POST /admin/login - use Supabase Auth
  async login(email, password) {
    const { session, user } = await signIn(email, password);
    return { data: { token: session.access_token, user } };
  },

  // GET /admin/me
  async me() {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    return { data: { email: session.user.email, id: session.user.id } };
  },

  // GET /admin/products?status=all
  async getProducts(params) {
    let query = supabase
      .from('products')
      .select(`
        *,
        ingredients:product_ingredients(
          ingredient:ingredients(*)
        )
      `);

    const status = params.get('status');
    if (status && status.toLowerCase() !== 'all') {
      query = query.eq('status', status.toUpperCase());
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const products = (data || []).map(p => ({
      ...p,
      ingredients: (p.ingredients || []).map(pi => pi.ingredient)
    }));

    return createResponse(products);
  },

  // GET /admin/products/:id
  async getProductById(id) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        ingredients:product_ingredients(
          ingredient:ingredients(*)
        ),
        categories:product_categories(
          category:categories(*)
        )
      `)
      .eq('id', parseInt(id))
      .single();

    if (error) throw error;

    // Flatten ingredients and categories
    const product = {
      ...data,
      ingredients: (data.ingredients || []).map(pi => pi.ingredient),
      productCategories: (data.categories || []).map(pc => pc.category).filter(Boolean),
    };

    return createResponse(product);
  },

  // POST /admin/products
  async createProduct(productData) {
    const { ingredients, categories, ...rest } = productData;
    const snakeData = toSnakeCase(rest);

    const { data, error } = await supabase
      .from('products')
      .insert(snakeData)
      .select()
      .single();

    if (error) throw error;

    // Add ingredient relations
    if (ingredients?.length) {
      const relations = ingredients.map(ing => ({
        product_id: data.id,
        ingredient_id: ing.id || ing
      }));
      await supabase.from('product_ingredients').insert(relations);
    }

    // Add category relations
    if (categories?.length) {
      const relations = categories.map(cat => ({
        product_id: data.id,
        category_id: cat.id || cat
      }));
      await supabase.from('product_categories').insert(relations);
    }

    return createResponse(data);
  },

  // PUT /admin/products/:id
  async updateProduct(id, productData) {
    const { ingredients, categories, ...rest } = productData;
    const snakeData = toSnakeCase(rest);
    delete snakeData.id;
    delete snakeData.created_at;

    const { data, error } = await supabase
      .from('products')
      .update(snakeData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;

    // Update ingredient relations
    if (ingredients !== undefined) {
      await supabase
        .from('product_ingredients')
        .delete()
        .eq('product_id', parseInt(id));

      if (ingredients?.length) {
        const relations = ingredients.map(ing => ({
          product_id: data.id,
          ingredient_id: ing.id || ing
        }));
        await supabase.from('product_ingredients').insert(relations);
      }
    }

    // Update category relations
    if (categories !== undefined) {
      await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', parseInt(id));

      if (categories?.length) {
        const relations = categories.map(cat => ({
          product_id: data.id,
          category_id: cat.id || cat
        }));
        await supabase.from('product_categories').insert(relations);
      }
    }

    return createResponse(data);
  },

  // DELETE /admin/products/:id
  async deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;
    return { data: { success: true } };
  },

  // GET /admin/products/export
  async exportProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        ingredients:product_ingredients(
          ingredient:ingredients(*)
        )
      `)
      .order('id');

    if (error) throw error;
    return createResponse(data);
  },

  // POST /admin/products/import
  async importProducts(products) {
    let count = 0;
    for (const p of products) {
      try {
        const { ingredients, ...rest } = p;
        const snakeData = toSnakeCase(rest);
        delete snakeData.id;

        const { data: product } = await supabase
          .from('products')
          .upsert(snakeData, { onConflict: 'slug' })
          .select()
          .single();

        if (product && ingredients?.length) {
          await supabase
            .from('product_ingredients')
            .delete()
            .eq('product_id', product.id);

          const relations = ingredients.map(ing => ({
            product_id: product.id,
            ingredient_id: ing.id || ing.ingredient?.id
          })).filter(r => r.ingredient_id);

          if (relations.length) {
            await supabase.from('product_ingredients').insert(relations);
          }
        }
        count++;
      } catch (e) {
        console.error('Import error for product:', p.slug, e);
      }
    }
    return { data: { count } };
  },

  // Ingredients CRUD
  async getIngredients() {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return createResponse(data);
  },

  async getIngredientById(id) {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    if (error) throw error;
    return createResponse(data);
  },

  async createIngredient(ingredientData) {
    const snakeData = toSnakeCase(ingredientData);
    const { data, error } = await supabase
      .from('ingredients')
      .insert(snakeData)
      .select()
      .single();
    if (error) throw error;
    return createResponse(data);
  },

  async updateIngredient(id, ingredientData) {
    const snakeData = toSnakeCase(ingredientData);
    delete snakeData.id;
    delete snakeData.created_at;

    const { data, error } = await supabase
      .from('ingredients')
      .update(snakeData)
      .eq('id', parseInt(id))
      .select()
      .single();
    if (error) throw error;
    return createResponse(data);
  },

  async deleteIngredient(id) {
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
    return { data: { success: true } };
  },

  async exportIngredients() {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('id');
    if (error) throw error;
    return createResponse(data);
  },

  async importIngredients(ingredients) {
    let count = 0;
    for (const ing of ingredients) {
      try {
        const snakeData = toSnakeCase(ing);
        delete snakeData.id;
        await supabase
          .from('ingredients')
          .upsert(snakeData, { onConflict: 'slug' });
        count++;
      } catch (e) {
        console.error('Import error for ingredient:', ing.slug, e);
      }
    }
    return { data: { count } };
  },

  // Categories CRUD
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order');
    if (error) throw error;
    return createResponse(data);
  },

  async createCategory(categoryData) {
    const snakeData = toSnakeCase(categoryData);
    const { data, error } = await supabase
      .from('categories')
      .insert(snakeData)
      .select()
      .single();
    if (error) throw error;
    return createResponse(data);
  },

  async updateCategory(id, categoryData) {
    const snakeData = toSnakeCase(categoryData);
    delete snakeData.id;

    const { data, error } = await supabase
      .from('categories')
      .update(snakeData)
      .eq('id', parseInt(id))
      .select()
      .single();
    if (error) throw error;
    return createResponse(data);
  },

  async deleteCategory(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
    return { data: { success: true } };
  },

  // Highlights CRUD
  async getHighlights() {
    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .order('order');
    if (error) throw error;
    return createResponse(data);
  },

  async createHighlight(highlightData) {
    const snakeData = toSnakeCase(highlightData);
    const { data, error } = await supabase
      .from('highlights')
      .insert(snakeData)
      .select()
      .single();
    if (error) throw error;
    return createResponse(data);
  },

  async updateHighlight(id, highlightData) {
    const snakeData = toSnakeCase(highlightData);
    delete snakeData.id;

    const { data, error } = await supabase
      .from('highlights')
      .update(snakeData)
      .eq('id', parseInt(id))
      .select()
      .single();
    if (error) throw error;
    return createResponse(data);
  },

  async deleteHighlight(id) {
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
    return { data: { success: true } };
  },

  // Testimonials CRUD
  async getTestimonials() {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('id', { ascending: false });
    if (error) throw error;
    return createResponse(data);
  },

  async createTestimonial(testimonialData) {
    const snakeData = toSnakeCase(testimonialData);
    const { data, error } = await supabase
      .from('testimonials')
      .insert(snakeData)
      .select()
      .single();
    if (error) throw error;
    return createResponse(data);
  },

  async updateTestimonial(id, testimonialData) {
    const snakeData = toSnakeCase(testimonialData);
    delete snakeData.id;

    const { data, error } = await supabase
      .from('testimonials')
      .update(snakeData)
      .eq('id', parseInt(id))
      .select()
      .single();
    if (error) throw error;
    return createResponse(data);
  },

  async deleteTestimonial(id) {
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
    return { data: { success: true } };
  },

  // Subscribers
  async getSubscribers() {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return createResponse(data);
  },

  async deleteSubscriber(id) {
    const { error } = await supabase
      .from('subscribers')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
    return { data: { success: true } };
  },

  // Stats
  async getStats() {
    const [products, ingredients, categories, subscribers, accessories] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact' }),
      supabase.from('ingredients').select('id', { count: 'exact' }),
      supabase.from('categories').select('id', { count: 'exact' }),
      supabase.from('subscribers').select('id', { count: 'exact' }),
      supabase.from('accessories').select('id', { count: 'exact' })
    ]);

    return {
      data: {
        products: products.count || 0,
        ingredients: ingredients.count || 0,
        categories: categories.count || 0,
        subscribers: subscribers.count || 0,
        accessories: accessories.count || 0
      }
    };
  },

  // Accessories
  async getAccessories() {
    const { data, error } = await supabase
      .from('accessories')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return createResponse(data);
  },

  async getAccessoryById(id) {
    const { data, error } = await supabase
      .from('accessories')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    if (error) throw error;
    return createResponse(data);
  },

  async createAccessory(data) {
    const snakeData = toSnakeCase(data);
    const { data: res, error } = await supabase
      .from('accessories')
      .insert(snakeData)
      .select()
      .single();
    if (error) throw error;
    return createResponse(res);
  },

  async updateAccessory(id, data) {
    const snakeData = toSnakeCase(data);
    delete snakeData.id;
    delete snakeData.created_at;

    const { data: res, error } = await supabase
      .from('accessories')
      .update(snakeData)
      .eq('id', parseInt(id))
      .select()
      .single();
    if (error) throw error;
    return createResponse(res);
  },

  async deleteAccessory(id) {
    const { error } = await supabase
      .from('accessories')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;
    return { data: { success: true } };
  }
};

// Route matching for the axios-like interface
const routeRequest = async (method, url, data) => {
  const { path, params } = parseParams(url);
  const segments = path.split('/').filter(Boolean);

  // Admin routes
  if (segments[0] === 'admin') {
    const resource = segments[1];
    const id = segments[2];

    switch (resource) {
      case 'login':
        if (method === 'POST') return adminApi.login(data.email, data.password);
        break;
      case 'me':
        if (method === 'GET') return adminApi.me();
        break;
      case 'products':
        if (id === 'export' && method === 'GET') return adminApi.exportProducts();
        if (id === 'import' && method === 'POST') return adminApi.importProducts(data);
        if (method === 'GET' && id) return adminApi.getProductById(id);
        if (method === 'GET') return adminApi.getProducts(params);
        if (method === 'POST') return adminApi.createProduct(data);
        if (method === 'PUT' && id) return adminApi.updateProduct(id, data);
        if (method === 'DELETE' && id) return adminApi.deleteProduct(id);
        break;
      case 'ingredients':
        if (id === 'export' && method === 'GET') return adminApi.exportIngredients();
        if (id === 'import' && method === 'POST') return adminApi.importIngredients(data);
        if (method === 'GET' && id) return adminApi.getIngredientById(id);
        if (method === 'GET') return adminApi.getIngredients();
        if (method === 'POST') return adminApi.createIngredient(data);
        if (method === 'PUT' && id) return adminApi.updateIngredient(id, data);
        if (method === 'DELETE' && id) return adminApi.deleteIngredient(id);
        break;
      case 'categories':
        if (method === 'GET') return adminApi.getCategories();
        if (method === 'POST') return adminApi.createCategory(data);
        if (method === 'PUT' && id) return adminApi.updateCategory(id, data);
        if (method === 'DELETE' && id) return adminApi.deleteCategory(id);
        break;
      case 'highlights':
        if (method === 'GET') return adminApi.getHighlights();
        if (method === 'POST') return adminApi.createHighlight(data);
        if (method === 'PUT' && id) return adminApi.updateHighlight(id, data);
        if (method === 'DELETE' && id) return adminApi.deleteHighlight(id);
        break;
      case 'testimonials':
        if (method === 'GET') return adminApi.getTestimonials();
        if (method === 'POST') return adminApi.createTestimonial(data);
        if (method === 'PUT' && id) return adminApi.updateTestimonial(id, data);
        if (method === 'DELETE' && id) return adminApi.deleteTestimonial(id);
        break;
      case 'subscribers':
        if (method === 'GET') return adminApi.getSubscribers();
        if (method === 'DELETE' && id) return adminApi.deleteSubscriber(id);
        break;
      case 'stats':
        if (method === 'GET') return adminApi.getStats();
        break;
      case 'upload':
        if (method === 'POST') return adminApi.uploadFile(data);
        break;
      case 'accessories':
        if (method === 'GET' && id) return adminApi.getAccessoryById(id);
        if (method === 'GET') return adminApi.getAccessories();
        if (method === 'POST') return adminApi.createAccessory(data);
        if (method === 'PUT' && id) return adminApi.updateAccessory(id, data);
        if (method === 'DELETE' && id) return adminApi.deleteAccessory(id);
        break;
    }
  }

  // Public routes
  const resource = segments[0];
  const idOrSlug = segments[1];

  switch (resource) {
    case 'products':
      if (method === 'GET' && idOrSlug) return publicApi.getProductBySlug(idOrSlug);
      if (method === 'GET') return publicApi.getProducts(params);
      break;
    case 'ingredients':
      if (method === 'GET' && idOrSlug) return publicApi.getIngredientBySlug(idOrSlug);
      if (method === 'GET') return publicApi.getIngredients();
      break;
    case 'categories':
      if (method === 'GET') return publicApi.getCategories();
      break;
    case 'accessories':
      if (method === 'GET' && idOrSlug) return publicApi.getAccessoryBySlug(idOrSlug);
      if (method === 'GET') return publicApi.getAccessories();
      break;
    case 'highlights':
      if (method === 'GET') return publicApi.getHighlights();
      break;
    case 'testimonials':
      if (method === 'GET') return publicApi.getTestimonials();
      break;
    case 'subscribe':
      if (method === 'POST') return publicApi.subscribe(data.email);
      break;
    case 'contact':
      if (method === 'POST') return publicApi.submitContact(data);
      break;
  }

  throw new Error(`Unknown route: ${method} ${url}`);
};

// Axios-like API interface
export const api = {
  get: (url) => routeRequest('GET', url),
  post: (url, data) => routeRequest('POST', url, data),
  put: (url, data) => routeRequest('PUT', url, data),
  delete: (url) => routeRequest('DELETE', url),
  defaults: {
    headers: {
      common: {}
    }
  }
};

// Token management (now uses Supabase session)
export const setAuthToken = (token) => {
  // With Supabase, auth is handled automatically via the client
  // This function is kept for backward compatibility
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// Re-export for convenience
export { signOut, getSession, onAuthStateChange } from './supabase';
