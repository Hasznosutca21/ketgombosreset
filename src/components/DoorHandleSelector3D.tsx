import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html, Environment } from "@react-three/drei";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import * as THREE from "three";

interface DoorHandleSelectorProps {
  value: string[];
  onChange: (handles: string[]) => void;
}

// Handle positions in 3D space relative to a simplified car model
const HANDLE_POSITIONS_3D = [
  { id: "front-left", label: "Bal első", labelEn: "Front Left", position: [-0.9, 0.3, 0.6] as [number, number, number] },
  { id: "rear-left", label: "Bal hátsó", labelEn: "Rear Left", position: [-0.9, 0.3, -0.4] as [number, number, number] },
  { id: "front-right", label: "Jobb első", labelEn: "Front Right", position: [0.9, 0.3, 0.6] as [number, number, number] },
  { id: "rear-right", label: "Jobb hátsó", labelEn: "Rear Right", position: [0.9, 0.3, -0.4] as [number, number, number] },
];

const PRICE_PER_HANDLE = 25000;

// Simple Tesla Model 3 shape using basic geometries
function TeslaModel3() {
  const groupRef = useRef<THREE.Group>(null);

  // Slow auto-rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Car body - main shape */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.4, 3.2]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Cabin/roof */}
      <mesh position={[0, 0.55, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.35, 1.8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.2} />
      </mesh>

      {/* Front hood slope */}
      <mesh position={[0, 0.35, 1.2]} rotation={[-0.3, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.1, 1]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Rear trunk slope */}
      <mesh position={[0, 0.4, -1.3]} rotation={[0.2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.1, 0.8]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Wheels */}
      {[
        [-0.7, 0, 1],
        [0.7, 0, 1],
        [-0.7, 0, -1],
        [0.7, 0, -1],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.15, 32]} />
          <meshStandardMaterial color="#222222" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}

      {/* Wheel rims */}
      {[
        [-0.7, 0, 1],
        [0.7, 0, 1],
        [-0.7, 0, -1],
        [0.7, 0, -1],
      ].map((pos, i) => (
        <mesh key={`rim-${i}`} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.16, 32]} />
          <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Headlights */}
      <mesh position={[-0.55, 0.3, 1.6]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.55, 0.3, 1.6]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* Taillights */}
      <mesh position={[-0.6, 0.35, -1.6]}>
        <boxGeometry args={[0.3, 0.05, 0.02]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.6, 0.35, -1.6]}>
        <boxGeometry args={[0.3, 0.05, 0.02]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// Interactive door handle marker in 3D
function HandleMarker({
  position,
  isSelected,
  onClick,
  label,
}: {
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
  label: string;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && isSelected) {
      meshRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshStandardMaterial
          color={isSelected ? "#ef4444" : hovered ? "#666666" : "#888888"}
          emissive={isSelected ? "#ef4444" : "#000000"}
          emissiveIntensity={isSelected ? 0.5 : 0}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
      {isSelected && (
        <mesh scale={[1.5, 1.5, 1.5]}>
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.3} />
        </mesh>
      )}
      <Html
        position={[0, 0.15, 0]}
        center
        style={{
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <div
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
            isSelected
              ? "bg-destructive text-white"
              : "bg-background/80 text-foreground border border-border"
          )}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function Scene({
  selectedHandles,
  onToggleHandle,
  language,
}: {
  selectedHandles: string[];
  onToggleHandle: (id: string) => void;
  language: string;
}) {
  const isHu = language === "hu";

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 4]} fov={45} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.5}
        minAzimuthAngle={-Math.PI / 4}
        maxAzimuthAngle={Math.PI / 4}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
      <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.3} penumbra={1} />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
      </mesh>

      {/* Car model */}
      <TeslaModel3 />

      {/* Door handle markers */}
      {HANDLE_POSITIONS_3D.map((handle) => (
        <HandleMarker
          key={handle.id}
          position={handle.position}
          isSelected={selectedHandles.includes(handle.id)}
          onClick={() => onToggleHandle(handle.id)}
          label={isHu ? handle.label : handle.labelEn}
        />
      ))}
    </>
  );
}

const DoorHandleSelector3D = ({ value, onChange }: DoorHandleSelectorProps) => {
  const { language } = useLanguage();
  const isHu = language === "hu";

  const toggleHandle = (handleId: string) => {
    if (value.includes(handleId)) {
      onChange(value.filter((h) => h !== handleId));
    } else {
      onChange([...value, handleId]);
    }
  };

  const totalPrice = value.length * PRICE_PER_HANDLE;
  const formattedPrice = new Intl.NumberFormat("hu-HU").format(totalPrice);

  return (
    <div className="space-y-6">
      {/* 3D Canvas */}
      <div className="relative rounded-xl bg-muted/30 overflow-hidden" style={{ height: "280px" }}>
        <Canvas shadows>
          <Suspense fallback={null}>
            <Scene
              selectedHandles={value}
              onToggleHandle={toggleHandle}
              language={language}
            />
          </Suspense>
        </Canvas>

        {/* Instructions overlay */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded-full">
          {isHu ? "Kattints a kilincsekre • Húzd a forgatáshoz" : "Click handles • Drag to rotate"}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/50 bg-background" />
          <span className="text-muted-foreground">{isHu ? "Ép" : "OK"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="text-muted-foreground">{isHu ? "Sérült" : "Damaged"}</span>
        </div>
      </div>

      {/* Handle selection buttons */}
      <div className="grid grid-cols-2 gap-3">
        {HANDLE_POSITIONS_3D.map((handle) => {
          const isSelected = value.includes(handle.id);
          return (
            <button
              key={handle.id}
              type="button"
              onClick={() => toggleHandle(handle.id)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all text-left",
                isSelected
                  ? "border-destructive bg-destructive/10"
                  : "border-border bg-card hover:border-foreground/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">
                    {isHu ? handle.label : handle.labelEn}
                  </div>
                  <div className="text-xs text-muted-foreground">25 000 Ft</div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Price summary */}
      {value.length > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground">
                {isHu ? "Kiválasztva:" : "Selected:"}
              </span>
              <span className="ml-2 font-medium">
                {value.length} {isHu ? "db kilincs" : "handle(s)"}
              </span>
            </div>
            <div className="text-lg font-semibold">{formattedPrice} Ft</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoorHandleSelector3D;
