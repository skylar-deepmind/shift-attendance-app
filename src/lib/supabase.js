import { getConfig } from "@/utils/getConfig.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = getConfig("SUPABASE_URL");
const supabaseKey = getConfig("SUPABASE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
