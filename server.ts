import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Parse incoming JSON and urlencoded form payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Supabase Server Client Initialization with Sanitization
function getValidSupabaseUrl(): string {
  const envUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
    return envUrl.replace(/\/rest\/v1\/?$/, '').trim();
  }
  return 'https://merpldiljqqirpognrlp.supabase.co';
}

function getValidSupabaseKey(): string {
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (envKey) {
    return envKey.replace(/^\[|\]$/g, '').trim();
  }
  return 'sb_publishable_ZJZ3JbP2ZJIrTh1VDm416A_aD2Q78cn';
}

const supabaseUrl = getValidSupabaseUrl();
const supabaseKey = getValidSupabaseKey();

let supabase: any = null;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[Backend] Supabase client initialized successfully with URL:', supabaseUrl);
} catch (err) {
  console.warn('[Backend] Failed to initialize Supabase client:', err);
}

// ==============================================================================
// BACKEND API ENDPOINTS
// ==============================================================================

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    supabaseConnected: Boolean(supabase),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Quotes & Appointments Submission Endpoint
app.post('/api/inquiries', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      source,
      full_name,
      email,
      phone,
      service_type,
      product_title,
      width_x,
      height_y,
      thickness_z,
      appointment_date,
      message,
      reference_file_url,
      reference_file_name,
      uploaded_file_url
    } = req.body;

    const clientName = full_name || phone || email || 'Client';
    const clientEmail = email || 'inquiry@tridimensional.in';

    const submissionData = {
      source: source || (product_title ? 'Product Quote' : 'Studio Appointment'),
      full_name: String(clientName).trim(),
      email: String(clientEmail).trim(),
      phone: phone ? String(phone).trim() : null,
      service_type: service_type ? String(service_type).trim() : 'General Inquiry',
      product_title: product_title ? String(product_title).trim() : null,
      width_x: width_x ? String(width_x).trim() : null,
      height_y: height_y ? String(height_y).trim() : null,
      thickness_z: thickness_z ? String(thickness_z).trim() : null,
      appointment_date: appointment_date ? String(appointment_date).trim() : null,
      message: message ? String(message).trim() : '',
      status: 'New',
      reference_file_url: reference_file_url || uploaded_file_url || null,
      reference_file_name: reference_file_name || null,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      // Try customer_inquiries table first
      let { data, error } = await supabase
        .from('customer_inquiries')
        .insert([submissionData])
        .select()
        .single();

      // If customer_inquiries table is pending creation, try quotes_and_appointments
      if (error) {
        console.warn('[Backend] customer_inquiries notice:', error.message, 'Trying quotes_and_appointments fallback...');
        const legacyData = {
          full_name: submissionData.full_name,
          email: submissionData.email,
          phone: submissionData.phone,
          service_type: submissionData.service_type || submissionData.product_title,
          appointment_date: submissionData.appointment_date,
          message: submissionData.message,
          uploaded_file_url: submissionData.reference_file_url,
          created_at: submissionData.created_at
        };
        const fallbackRes = await supabase.from('quotes_and_appointments').insert([legacyData]).select().single();
        data = fallbackRes.data || submissionData;
      }

      res.status(201).json({
        success: true,
        message: 'Your project inquiry has been successfully submitted.',
        data
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry received and logged to studio desk.',
      data: submissionData
    });
    return;
  } catch (error: any) {
    console.error('[Backend] Error in /api/inquiries:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing your submission.'
    });
  }
});

// Portfolio Galleries Listing
app.get('/api/portfolio', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (supabase) {
      let query = supabase.from('portfolio_galleries').select('*').limit(limit);
      if (category && category !== 'all') {
        query = query.ilike('category', `%${category}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return res.json({ success: true, count: data.length, data });
      }
    }

    // Default static showcase items if remote table is empty
    const fallbackPortfolio = [
      {
        id: '1',
        title: 'Architectural Teak Fluted Wall Paneling',
        category: 'CNC',
        image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: '2',
        title: 'Precision Resin Sculpted Biomorphic Centerpiece',
        category: 'Resin',
        image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: '3',
        title: 'Solid Hardwood Parametric Screen',
        category: 'Furniture',
        image_url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: '4',
        title: 'Retail Display Luminaire Component',
        category: 'Retail',
        image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80'
      }
    ];

    res.json({ success: true, count: fallbackPortfolio.length, data: fallbackPortfolio });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Blog Articles Listing
app.get('/api/blogs', async (req: Request, res: Response) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('published_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return res.json({ success: true, count: data.length, data });
      }
    }

    res.json({
      success: true,
      count: 1,
      data: [
        {
          id: '1',
          title: 'From 2D Sketch to 5-Axis CNC Milling: The Production Journey',
          content: 'A comprehensive study into modern digital fabrication pipelines.',
          author: 'Tridimensional Atelier',
          cover_image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
          published_date: new Date().toISOString()
        }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// VITE MIDDLEWARE (DEV) OR STATIC FILE SERVING (PROD)
// ==============================================================================
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });

    app.use(vite.middlewares);
    console.log('[Backend] Vite dev middlewares mounted.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend] Full-stack studio server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
