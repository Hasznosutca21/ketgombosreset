import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VehicleInfo {
  model: string | null;
  type: string | null;
  year: number | null;
  make: string | null;
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

    // Use NHTSA free VIN decoder API
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
    const fuelType = getValueByVariable("Fuel Type - Primary");
    const electrificationLevel = getValueByVariable("Electrification Level");

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

    // Build vehicle type description
    let vehicleType = "";
    if (driveType) vehicleType += driveType;
    if (electrificationLevel && electrificationLevel !== "Not Applicable") {
      vehicleType += vehicleType ? `, ${electrificationLevel}` : electrificationLevel;
    }
    if (bodyClass) {
      vehicleType += vehicleType ? ` (${bodyClass})` : bodyClass;
    }

    const vehicleInfo: VehicleInfo = {
      model: model ? `Model ${model.replace("Model ", "")}` : null,
      type: vehicleType || null,
      year: modelYear ? parseInt(modelYear) : null,
      make: make,
    };

    console.log("Decoded vehicle info:", vehicleInfo);

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
