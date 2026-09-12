import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

process.env.DOTENV_CONFIG_QUIET = "true";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });
dotenv.config({ quiet: true });

const SUPABASE_URL = process.env.SUPABASE_URL || "https://nuhsooerkqwuwcucwxcf.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

/**
 * Cliente de Supabase inicializado (para backend con service_role o anon)
 */
export const supabase = SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export default supabase;
