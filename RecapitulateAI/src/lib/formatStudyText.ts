/**
 * Converts common LaTeX-style math returned by language models into readable
 * plain text. The UI intentionally avoids a full math renderer so formulas
 * remain legible in cards and buttons without additional runtime dependencies.
 */
const SUBSCRIPT: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ',
  m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ',
  u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
};

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ',
  h: 'ʰ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ', n: 'ⁿ',
  o: 'ᵒ', p: 'ᵖ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ',
  w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
};

const LATEX_SYMBOLS: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ',
  epsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ', pi: 'π',
  rho: 'ρ', sigma: 'σ', Sigma: 'Σ', tau: 'τ', phi: 'φ',
  omega: 'ω', Omega: 'Ω', degree: '°', times: '×', cdot: '·',
  cdotp: '·', div: '÷', pm: '±', mp: '∓', neq: '≠', ne: '≠',
  le: '≤', leq: '≤', ge: '≥', geq: '≥', approx: '≈', propto: '∝',
  infty: '∞', sum: '∑', int: '∫', partial: '∂', nabla: '∇',
  rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐',
  therefore: '∴', perp: '⊥', parallel: '∥',
  circ: '°', ell: 'ℓ', Angstrom: 'Å',
};

function convertScript(value: string, map: Record<string, string>): string {
  const characters = [...value.replace(/\s+/g, '')];
  if (characters.length === 0 || characters.some((character) => !map[character])) {
    return value;
  }
  return characters.map((character) => map[character]).join('');
}

/** Safely turn model-generated mathematical notation into readable text. */
export function formatStudyText(input: string): string {
  if (!input) return input;

  let text = input;

  // Remove display and inline math wrappers while preserving their contents.
  text = text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\$([^$\n]+)\$/g, (match, expression: string) => {
      const candidate = expression.trim();
      const looksLikeMath = /\\[A-Za-z]+|[_^=<>≤≥×÷±+*\/]|\b(?:sin|cos|tan|log|ln)\b/.test(candidate)
        || /^[A-Za-z]$/.test(candidate);
      return looksLikeMath ? expression : match;
    });

  // Replace common TeX grouping commands and elementary fractions/roots.
  text = text
    .replace(/\\(?:text|textrm|mathrm|mathit|mathbf|operatorname)\{([^{}]*)\}/g, '$1')
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, '√($1)')
    .replace(/\\(?:left|right)\b/g, '')
    .replace(/\\[,;!]/g, ' ')
    .replace(/\\%/g, '%')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}');

  // Convert named LaTeX symbols to their Unicode equivalents.
  text = text.replace(/\\([A-Za-z]+)\b/g, (match, name: string) => LATEX_SYMBOLS[name] ?? match);

  // Convert common subscript/superscript forms (for example N_s, H_2O, x^2).
  text = text
    .replace(/_\{([^{}]+)\}|_([A-Za-z])|_([0-9]+)/g, (match, braced: string | undefined, letter: string | undefined, digits: string | undefined) => {
      const value = braced ?? letter ?? digits ?? '';
      const converted = convertScript(value, SUBSCRIPT);
      return converted === value ? match : converted;
    })
    .replace(/\^\{([^{}]+)\}|\^([A-Za-z])|\^([0-9]+)/g, (match, braced: string | undefined, letter: string | undefined, digits: string | undefined) => {
      const value = braced ?? letter ?? digits ?? '';
      const converted = convertScript(value, SUPERSCRIPT);
      return converted === value ? match : converted;
    });

  // Clean up remaining TeX spacing commands and spacing around punctuation.
  return text
    .replace(/\\(?:,|;|!|quad\b|qquad\b)/g, ' ')
    .replace(/\\\\/g, ' ')
    .replace(/\\(?=[^A-Za-z])/g, '')
    .replace(/\^°/g, '°')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
