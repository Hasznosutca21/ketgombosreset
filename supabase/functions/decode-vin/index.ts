import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VehicleInfo {
  model: string | null;
  variant: string | null;
  type: string | null;
  year: number | null;
  make: string;
  drive: string | null;
  batteryType: string | null;
  factory: string | null;
}

// Tesla VIN decoding based on official Tesla VIN structure
// Source: https://tesla-info.com/vin-decoder.php

// Digit 4: Model
const modelMap: Record<string, string> = {
  'S': 'Model S',
  'X': 'Model X',
  '3': 'Model 3',
  'Y': 'Model Y',
  'C': 'Cybertruck',
  'R': 'Roadster',
};

// Digit 5: Body type / LHD/RHD
const bodyTypeMap: Record<string, string> = {
  'A': 'Sedan LHD',
  'B': 'Sedan RHD',
  'C': 'SUV LHD',
  'D': 'SUV RHD',
  'E': 'Sedan LHD',
  'F': 'Sedan RHD',
  'G': 'Crossover LHD',
  'H': 'Crossover RHD',
};

// Digit 7: Battery type
const batteryMap: Record<string, string> = {
  'A': 'TBA',
  'B': 'TBA',
  'C': 'TBA',
  'D': 'Dual Motor Standard',
  'E': 'NMC/NCA (Lithium Ion)',
  'F': 'LFP (Lithium Iron Phosphate)',
  'H': 'High Capacity NMC/NCA',
  'S': 'Standard Capacity NMC/NCA',
  'V': 'Ultra High Capacity NMC/NCA',
};

// Digit 8: Motor/Drive - THIS IS THE KEY FOR VARIANT!
const motorMap: Record<string, { drive: string; variant: string | null }> = {
  '1': { drive: 'Single Motor RWD', variant: null },
  '2': { drive: 'Dual Motor AWD', variant: null },
  '3': { drive: 'Single Motor Performance', variant: 'Performance' },
  '4': { drive: 'Dual Motor Performance', variant: 'Performance' },
  '5': { drive: 'P2 Dual Motor', variant: 'Long Range' },
  '6': { drive: 'P2 Tri-Motor', variant: 'Plaid' },
  'A': { drive: 'Single Motor Standard', variant: 'Standard Range' },
  'B': { drive: 'Dual Motor Standard', variant: 'Long Range' },
  'C': { drive: 'Dual Motor Performance', variant: 'Performance' },
  'D': { drive: 'Single Motor Standard', variant: 'Standard Range' },
  'E': { drive: 'Dual Motor AWD', variant: 'Long Range' },
  'F': { drive: 'Performance AWD', variant: 'Performance' },
  'G': { drive: 'Base Motor Tier 4', variant: null },
  'J': { drive: 'Single Motor Hairpin', variant: 'Standard Range Plus' },
  'K': { drive: 'Dual Motor Hairpin', variant: 'Long Range' },
  'L': { drive: 'Performance Hairpin', variant: 'Performance' },
  'N': { drive: 'Base Motor Tier 7', variant: null },
  'P': { drive: 'Performance Motor Tier 7', variant: 'Performance' },
  'R': { drive: 'RWD V1', variant: 'Standard Range' },
  'S': { drive: '3D7 Motor', variant: null },
  'T': { drive: 'Highland Performance', variant: 'Performance' },
};

// Digit 10: Year
const yearMap: Record<string, number> = {
  'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015, 'G': 2016,
  'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021,
  'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025, 'T': 2026,
  'V': 2027, 'W': 2028, 'X': 2029, 'Y': 2030,
};

// Digit 11: Factory
const factoryMap: Record<string, string> = {
  '1': 'Menlo Park, CA',
  '3': 'Hethel, UK',
  'A': 'Austin, TX',
  'B': 'Berlin, Germany',
  'C': 'Shanghai, China',
  'F': 'Fremont, CA',
  'N': 'Reno, NV',
  'P': 'Palo Alto, CA',
};

// Valid Tesla VIN prefixes
const validPrefixes = ['5YJ', '7SA', '7G2', 'LRW', 'XP7', 'SFZ'];

function decodeTeslaVin(vin: string): VehicleInfo | null {
  if (vin.length !== 17) return null;

  const prefix = vin.substring(0, 3);
  if (!validPrefixes.includes(prefix)) {
    return null; // Not a Tesla VIN
  }

  const modelChar = vin[3];
  const bodyChar = vin[4];
  const batteryChar = vin[6];
  const motorChar = vin[7];
  const yearChar = vin[9];
  const factoryChar = vin[10];

  const model = modelMap[modelChar] || null;
  const bodyType = bodyTypeMap[bodyChar] || null;
  const battery = batteryMap[batteryChar] || null;
  const motorInfo = motorMap[motorChar] || { drive: null, variant: null };
  const year = yearMap[yearChar] || null;
  const factory = factoryMap[factoryChar] || null;

  // Build full model name with variant
  let fullModel = model;
  if (model && motorInfo.variant) {
    fullModel = `${model} ${motorInfo.variant}`;
  }

  return {
    model: fullModel,
    variant: motorInfo.variant,
    type: bodyType,
    year,
    make: 'Tesla',
    drive: motorInfo.drive,
    batteryType: battery,
    factory,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { vin } = await req.json();

    if (!vin || typeof vin !== 'string') {
      console.error("Missing or invalid VIN");
      return new Response(
        JSON.stringify({ error: "VIN is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length !== 17) {
      console.error("Invalid VIN length:", cleanVin.length);
      return new Response(
        JSON.stringify({ error: "VIN must be exactly 17 characters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Decoding VIN:", cleanVin);

    // Try our built-in Tesla VIN decoder first
    const teslaResult = decodeTeslaVin(cleanVin);
    
    if (teslaResult && teslaResult.model) {
      console.log("Decoded with built-in Tesla decoder:", teslaResult);
      return new Response(
        JSON.stringify(teslaResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if it's a non-Tesla VIN
    const prefix = cleanVin.substring(0, 3);
    if (!validPrefixes.includes(prefix)) {
      console.log("Non-Tesla VIN detected, prefix:", prefix);
      
      // Fallback to NHTSA for make detection
      const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${cleanVin}?format=json`;
      const response = await fetch(nhtsaUrl);
      
      if (response.ok) {
        const data = await response.json();
        const results = data.Results || [];
        const makeItem = results.find((r: any) => r.Variable === "Make");
        const make = makeItem?.Value && makeItem.Value !== "Not Applicable" ? makeItem.Value : "Unknown";
        
        return new Response(
          JSON.stringify({ 
            error: "Only Tesla vehicles are supported",
            make: make 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Only Tesla vehicles are supported" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If built-in decoder failed but it's a Tesla VIN, use NHTSA as fallback
    console.log("Falling back to NHTSA API");
    const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${cleanVin}?format=json`;
    const response = await fetch(nhtsaUrl);
    
    if (!response.ok) {
      console.error("NHTSA API error:", response.status);
      return new Response(
        JSON.stringify({ error: "Failed to decode VIN" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const results = data.Results || [];
    
    const getValueByVariable = (variableName: string): string | null => {
      const item = results.find((r: any) => r.Variable === variableName);
      return item?.Value && item.Value !== "Not Applicable" ? item.Value : null;
    };

    const model = getValueByVariable("Model");
    const modelYear = getValueByVariable("Model Year");
    const driveType = getValueByVariable("Drive Type");

    const vehicleInfo: VehicleInfo = {
      model: model ? `Model ${model.replace("Model ", "")}` : null,
      variant: null,
      type: null,
      year: modelYear ? parseInt(modelYear) : null,
      make: 'Tesla',
      drive: driveType,
      batteryType: null,
      factory: null,
    };

    console.log("Decoded with NHTSA fallback:", vehicleInfo);

    return new Response(
      JSON.stringify(vehicleInfo),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error decoding VIN:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
