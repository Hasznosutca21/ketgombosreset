import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Tesla VIN decoder - works without external API
// VIN structure: https://en.wikibooks.org/wiki/Vehicle_Identification_Numbers_(VIN_codes)/Tesla

interface DecodedVehicle {
  model: string;
  year: number;
  drive?: string;
  battery?: string;
  motor?: string;
  manufacturer: string;
}

const yearCodes: Record<string, number> = {
  'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
  'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
  'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
  'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
  'Y': 2030, '1': 2031, '2': 2032, '3': 2033, '4': 2034,
  '5': 2035, '6': 2036, '7': 2037, '8': 2038, '9': 2039,
};

const modelCodes: Record<string, string> = {
  'S': 'Model S',
  '3': 'Model 3',
  'X': 'Model X',
  'Y': 'Model Y',
  'R': 'Roadster',
  'T': 'Cybertruck',
};

const bodyCodes: Record<string, string> = {
  'A': 'Hatchback (5 door)',
  'B': 'Hatchback (5 door)',
  'C': 'MPV (5 door)',
  'D': 'MPV (5 door)',
  'E': 'Sedan (4 door)',
  'F': 'Sedan (4 door)',
  'G': 'MPV (5 door)',
  'H': 'SUV (5 door)',
};

const restraintCodes: Record<string, string> = {
  'A': 'Manual belts, front airbags, side airbags',
  'B': 'Manual belts, front airbags, side airbags, knee airbags',
  'C': 'Manual belts, front airbags, side airbags',
  'D': 'Manual belts, front airbags, side airbags, knee airbags',
  'E': 'Manual belts, front airbags, side airbags (updated)',
  'F': 'Manual belts, front airbags, side airbags, knee airbags (updated)',
};

const motorCodes: Record<string, Record<string, string>> = {
  'Model S': {
    '1': 'Single Motor - Standard', '2': 'Dual Motor - Standard',
    '3': 'Dual Motor - Performance', '4': 'Dual Motor - Plaid',
    'A': 'Single Motor', 'B': 'Dual Motor', 'C': 'Dual Motor Performance',
    'D': 'Dual Motor Plaid', 'E': 'Dual Motor', 'F': 'Dual Motor Performance',
  },
  'Model 3': {
    '1': 'Single Motor - Standard Range', '2': 'Single Motor - Standard Range Plus',
    '3': 'Dual Motor - Long Range', '4': 'Dual Motor - Performance',
    'A': 'Single Motor - Standard Range', 'B': 'Single Motor - Standard Range Plus',
    'C': 'Dual Motor - Long Range', 'D': 'Dual Motor - Performance',
    'E': 'Dual Motor - Long Range', 'F': 'Dual Motor - Performance',
  },
  'Model X': {
    '1': 'Dual Motor - Standard', '2': 'Dual Motor - Standard',
    '3': 'Dual Motor - Performance', '4': 'Tri Motor - Plaid',
    'A': 'Dual Motor', 'B': 'Dual Motor Long Range',
    'C': 'Dual Motor Performance', 'D': 'Tri Motor Plaid',
  },
  'Model Y': {
    '1': 'Single Motor - Standard Range', '2': 'Dual Motor - Long Range',
    '3': 'Dual Motor - Performance', '4': 'Dual Motor - Long Range',
    'A': 'Single Motor - Standard Range', 'B': 'Dual Motor - Long Range',
    'C': 'Dual Motor - Performance', 'D': 'Dual Motor - Long Range',
    'E': 'Dual Motor - AWD', 'F': 'Dual Motor - Performance',
    'G': 'Dual Motor - Long Range', 'J': 'Dual Motor - AWD',
    'W': 'Dual Motor - Long Range AWD',
  },
  'Cybertruck': {
    '1': 'Single Motor - RWD', '2': 'Dual Motor - AWD',
    '3': 'Tri Motor - Cyberbeast', 'A': 'Single Motor - RWD',
    'B': 'Dual Motor - AWD', 'C': 'Tri Motor - Cyberbeast',
  },
};

const batteryCodes: Record<string, string> = {
  'E': 'Electric', 'H': 'High capacity', 'S': 'Standard range',
  'V': 'Ultra high capacity', 'L': 'Long range', 'F': 'Full capacity',
};

function decodeTeslaVin(vin: string): DecodedVehicle | null {
  const upperVin = vin.toUpperCase().trim();
  if (upperVin.length !== 17) return null;

  const teslaWmiPrefixes = ['5YJ', '7SA', 'LRW', 'XP7', '7G2', 'SFZ'];
  const wmi = upperVin.substring(0, 3);
  if (!teslaWmiPrefixes.includes(wmi)) return null;

  const modelCode = upperVin.charAt(3);
  const model = modelCodes[modelCode];
  if (!model) return null;

  const yearCode = upperVin.charAt(9);
  const year = yearCodes[yearCode];
  if (!year) return null;

  const batteryCode = upperVin.charAt(7);
  const battery = batteryCodes[batteryCode] || undefined;

  const motorCode = upperVin.charAt(6);
  const modelMotorCodes = motorCodes[model] || {};
  const driveFromMap = modelMotorCodes[motorCode];
  const drive = driveFromMap ?? `Unknown variant (code ${motorCode})`;

  return { model, year, drive, battery, manufacturer: 'Tesla' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { vin } = await req.json();

    if (!vin) {
      return new Response(
        JSON.stringify({ error: 'VIN is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const decoded = decodeTeslaVin(vin);

    if (!decoded) {
      return new Response(
        JSON.stringify({ error: 'Only Tesla vehicles are supported. Please enter a valid Tesla VIN.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Decoded VIN:', vin, '->', decoded);

    return new Response(
      JSON.stringify(decoded),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error decoding VIN:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to decode VIN' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
