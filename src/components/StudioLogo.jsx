import { TMDB_CONFIG } from '../services/tmdb';

// Studios whose TMDB logos are on WHITE backgrounds — need invert to show on black
// All others are assumed to have transparent or dark-friendly logos
const WHITE_BG_STUDIO_IDS = new Set([
  174,   // Warner Bros.
  4,     // Paramount
  33,    // Universal Pictures
  25,    // 20th Century Studios
  5,     // Columbia Pictures
  521,   // DreamWorks
  6704,  // Illumination
  9993,  // Nickelodeon
  3,     // Pixar
  6125,  // Walt Disney Pictures
  1,     // Lucasfilm
  2,     // Walt Disney Animation
  7505,  // A24
  3172,  // Legendary
  508,   // Regency Enterprises
  9996,  // Amblin
  12,    // New Line Cinema
  1632,  // Lionsgate
  1569,  // Yash Raj Films
  19146, // Dharma Productions
  2343,  // Red Chillies Entertainment
  3522,  // T-Series
  86699, // Maddock Films
  6808,  // Viacom18 Studios
]);

// Studios with already-white/transparent logos — render as-is
const DARK_FRIENDLY_STUDIO_IDS = new Set([
  420,   // Marvel Studios (red logo, works on dark)
  429,   // DC Studios (white logo on transparent)
  7521,  // Netflix
  11461, // Amazon Studios
]);

const StudioLogo = ({ id, logoPath, name, className = 'h-12 md:h-16 w-auto object-contain' }) => {
  if (!logoPath) return null;

  const needsInvert = WHITE_BG_STUDIO_IDS.has(Number(id));
  const isDarkFriendly = DARK_FRIENDLY_STUDIO_IDS.has(Number(id));

  // For white-bg logos: invert + slight opacity
  // For dark-friendly: render as-is
  // For unknown: use brightness filter to make them visible on dark bg
  const style = needsInvert
    ? { filter: 'invert(1) brightness(1.1)' }
    : isDarkFriendly
      ? {}
      : { filter: 'brightness(0) invert(1)' }; // force white for unknown logos

  return (
    <img
      src={`${TMDB_CONFIG.original}${logoPath}`}
      alt={name}
      className={`${className} opacity-70 hover:opacity-100 transition-opacity duration-300`}
      style={style}
      loading="lazy"
    />
  );
};

export default StudioLogo;
