/**
 * Une clases condicionales sin depender de una librería externa.
 *
 * Solo acepta cadenas: Tailwind necesita ver los literales completos en el
 * código fuente para detectarlos durante la compilación. Por eso aquí no se
 * construyen clases por concatenación de partes dinámicas.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  let result = '';
  for (const value of classes) {
    if (!value) continue;
    result = result ? `${result} ${value}` : value;
  }
  return result;
}
