/**
 * Formate un nombre en ajoutant "M" pour les millions et "k" pour les milliers
 * @param value - Le nombre à formater
 * @returns Le nombre formaté avec "M" si >= 1M, "k" si >= 1k, sinon le nombre original
 */
export function formatNumberWithK(value: number): string {
  if (value >= 1000000) {
    const mValue = Math.round(value / 1000000);
    return `${mValue}M`;
  } else if (value >= 1000) {
    const kValue = Math.round(value / 1000);
    return `${kValue}k`;
  }
  return value.toString();
}

/**
 * Formate un nombre avec un préfixe "+" et "M" pour les millions ou "k" pour les milliers
 * @param value - Le nombre à formater
 * @returns Le nombre formaté avec "+" et "M"/"k" selon la valeur, sinon le nombre original avec "+"
 */
export function formatNumberWithPlusAndK(value: number): string {
  if (value >= 1000000) {
    const mValue = Math.round(value / 1000000);
    return `+${mValue}M`;
  } else if (value >= 1000) {
    const kValue = Math.round(value / 1000);
    return `+${kValue}k`;
  }
  return `+${value}`;
}

/**
 * Formate un nombre en pourcentage avec arrondi à la première décimale
 * @param value - Le nombre à formater
 * @returns Le nombre formaté en pourcentage avec une décimale
 */
export function formatPercentage(value: number): string {
  const roundedValue = Math.ceil(value * 10) / 10;
  return `${roundedValue}%`;
}
