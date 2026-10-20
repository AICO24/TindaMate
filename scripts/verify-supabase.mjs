import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Read .env.local securely without logging keys
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('[Supabase Check]: .env.local file not found.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val.trim();
  }
}

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('[Supabase Check]: Missing required environment variables in .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabasePublishableKey);

async function verifyConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log('Supabase connectivity check failed.');
      console.log('Error details:', error.message);
      return;
    }

    console.log('Supabase connectivity check successful.');
    console.log('Supabase Auth endpoint is reachable.');
    console.log('Current session state:', data.session ? 'Active session' : 'null (expected before authentication)');
  } catch (err) {
    console.log('Supabase connectivity check failed: unable to connect to endpoint.');
  }
}

verifyConnection();

