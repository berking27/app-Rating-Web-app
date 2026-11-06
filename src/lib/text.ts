export function casefold(value: string): string {
  return value.toLocaleLowerCase('tr-TR')
}

export function foldTr(value: string): string {
  return casefold(value)
    .replaceAll('ı', 'i')
    .replaceAll('ş', 's')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
}