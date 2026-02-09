export default function LoadingBulldozer() {
  return (
    <div className="loading-bulldozer">
      <svg
        className="loading-bulldozer-svg"
        viewBox="0 0 140 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Dirt pile */}
        <g className="loading-bulldozer-dirt">
          <path
            d="M72 44 H92 Q100 44 104 38 Q108 32 108 26 Q108 20 102 18 H88 Q82 18 78 22 L72 28 Z"
            fill="#8B6914"
          />
          <path
            d="M76 42 H96 Q106 42 110 34 Q114 26 112 20 Q110 16 104 16 H86 Q80 16 76 20 Z"
            fill="#A07820"
          />
          <path
            d="M80 40 H98 Q108 40 112 32 Q114 26 112 22 H94 Q86 22 82 26 Z"
            fill="#B8862A"
          />
        </g>
        {/* Bulldozer - side view */}
        <g className="loading-bulldozer-machine">
          {/* Caterpillar tracks (both sides visible in side view: top and bottom run) */}
          <path
            d="M14 42 L14 46 Q14 48 16 48 L48 48 Q50 48 50 46 L50 42 Q50 40 48 40 L16 40 Q14 40 14 42 Z"
            fill="#374151"
            stroke="#1f2937"
            strokeWidth="0.8"
          />
          <path
            d="M18 41 L22 41 L22 45 L18 45 Z M26 41 L30 41 L30 45 L26 45 Z M34 41 L38 41 L38 45 L34 45 Z M42 41 L46 41 L46 45 L42 45 Z"
            fill="#4B5563"
          />
          {/* Chassis / undercarriage */}
          <rect x="18" y="36" width="30" height="4" fill="#52525b" stroke="#3f3f46" strokeWidth="0.6" />
          {/* Blade arms (C-frame) */}
          <path
            d="M22 34 L48 34 L52 38 L52 44 L50 46"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M22 38 L46 38 L50 42 L50 46"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Front blade */}
          <path
            d="M50 20 L50 48 L58 46 L60 42 L60 22 L58 20 Z"
            fill="#FACC15"
            stroke="#CA8A04"
            strokeWidth="0.8"
          />
          <path d="M50 20 L58 20 L60 22 L58 24 L50 22 Z" fill="#FDE047" />
          {/* Engine hood (slopes down to blade) */}
          <path
            d="M20 28 L48 28 L52 34 L52 36 L20 36 Z"
            fill="#EAB308"
            stroke="#CA8A04"
            strokeWidth="0.8"
          />
          <path d="M24 30 L44 30 L48 34 L24 34 Z" fill="#FACC15" opacity="0.6" />
          {/* Cab */}
          <path
            d="M12 22 L12 36 L20 36 L20 28 L18 26 L18 22 Z"
            fill="#EAB308"
            stroke="#CA8A04"
            strokeWidth="0.8"
          />
          <rect x="14" y="24" width="5" height="6" rx="0.8" fill="#1e293b" />
          <rect x="14" y="30" width="5" height="4" rx="0.5" fill="#334155" />
          {/* Exhaust stack */}
          <rect x="10" y="18" width="2.5" height="6" rx="0.5" fill="#4b5563" stroke="#374151" strokeWidth="0.4" />
          <ellipse cx="11.25" cy="18" rx="1.2" ry="0.6" fill="#6b7280" />
        </g>
      </svg>
    </div>
  );
}
