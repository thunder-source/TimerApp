// utils/colorUtils.ts
export function isColorDark(hex: string) {
    // Remove hash if present
    hex = hex.replace('#', '');
    // Convert 3-digit hex to 6-digit
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // Perceived brightness formula
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }