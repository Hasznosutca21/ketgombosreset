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
  make: string | null;
  drive: string | null;
  trim: string | null;
  batteryType: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Clean and validate VIN
    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length !== 17) {
      console.error("Invalid VIN length:", cleanVin.length);
      return new Response(
        JSON.stringify({ error: "VIN must be exactly 17 characters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Decoding VIN:", cleanVin);

    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    
    if (!RAPIDAPI_KEY) {
      console.error("RAPIDAPI_KEY not configured");
      // Fallback to NHTSA API
      return await decodeWithNHTSA(cleanVin);
    }

    // Try Tesla-specific RapidAPI first
    try {
      const rapidApiUrl = `https://tesla-vin-decoder-api-by-apirobots.p.rapidapi.com/v1/vins/${cleanVin}`;
      
      console.log("Calling Tesla VIN Decoder API");
      const response = await fetch(rapidApiUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tesla-vin-decoder-api-by-apirobots.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        console.error("RapidAPI error:", response.status);
        // Fallback to NHTSA
        return await decodeWithNHTSA(cleanVin);
      }

      const data = await response.json();
      console.log("RapidAPI response:", JSON.stringify(data));

      // Check if it's a Tesla
      if (data.make && data.make.toUpperCase() !== "TESLA") {
        console.log("Non-Tesla vehicle detected:", data.make);
        return new Response(
          JSON.stringify({ 
            error: "Only Tesla vehicles are supported",
            make: data.make 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build full model name with variant
      let fullModel = data.model || null;
      if (fullModel && data.variant && data.variant !== fullModel) {
        // Append variant if it's different (e.g., "Plaid", "Performance")
        if (!fullModel.includes(data.variant)) {
          fullModel = `${fullModel} ${data.variant}`;
        }
      }

      const vehicleInfo: VehicleInfo = {
        model: fullModel,
        variant: data.variant || null,
        type: data.body_type || null,
        year: data.year || null,
        make: data.make || "Tesla",
        drive: data.drive || null,
        trim: data.trim || null,
        batteryType: data.battery_type || null,
      };

      console.log("Decoded vehicle info (RapidAPI):", vehicleInfo);

      return new Response(
        JSON.stringify(vehicleInfo),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (rapidApiError) {
      console.error("RapidAPI call failed:", rapidApiError);
      // Fallback to NHTSA
      return await decodeWithNHTSA(cleanVin);
    }

  } catch (error) {
    console.error("Error decoding VIN:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fallback NHTSA decoder
async function decodeWithNHTSA(cleanVin: string): Promise<Response> {
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
  console.log("NHTSA response received");

  // Extract relevant fields from NHTSA response
  const results = data.Results || [];
  
  const getValueByVariable = (variableName: string): string | null => {
    const item = results.find((r: any) => r.Variable === variableName);
    return item?.Value && item.Value !== "Not Applicable" ? item.Value : null;
  };

  const make = getValueByVariable("Make");
  const model = getValueByVariable("Model");
  const modelYear = getValueByVariable("Model Year");
  const bodyClass = getValueByVariable("Body Class");
  const driveType = getValueByVariable("Drive Type");

  // Check if it's a Tesla
  if (make && make.toUpperCase() !== "TESLA") {
    console.log("Non-Tesla vehicle detected:", make);
    return new Response(
      JSON.stringify({ 
        error: "Only Tesla vehicles are supported",
        make: make 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const vehicleInfo: VehicleInfo = {
    model: model ? `Model ${model.replace("Model ", "")}` : null,
    variant: null, // NHTSA doesn't provide variant info
    type: bodyClass || null,
    year: modelYear ? parseInt(modelYear) : null,
    make: make || "Tesla",
    drive: driveType || null,
    trim: null,
    batteryType: null,
  };

  console.log("Decoded vehicle info (NHTSA):", vehicleInfo);

  return new Response(
    JSON.stringify(vehicleInfo),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
