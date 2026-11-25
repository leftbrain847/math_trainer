/**
 * Every topic that can be solved more than one way. Each topic with 2+ methods gets its own page.
 * A topic is built when src/client/topics/<id>.ts exists; until then its page lists the planned methods.
 * Method lists are standard school and textbook methods (compiled from general knowledge, not a cited source).
 */
export interface Topic {
  id: string;
  title: string;
  symbol: string;
  /** The methods planned for this topic. Once built, the grid file in src/client/topics/ is the source of truth. */
  methods: string[];
}

export const TOPICS: Topic[] = [
  { id: 'multiplication', title: 'Multiplication', symbol: '×', methods: ['Standard (long)', 'Lattice', 'Area / box', 'Partial products', 'Halve & double', 'Lines (sticks)'] },
  { id: 'division', title: 'Division', symbol: '÷', methods: ['Long division', 'Short (bus stop)', 'Chunking', 'Partial quotients', 'Doubling (Egyptian)', 'Area model'] },
  { id: 'addition', title: 'Addition', symbol: '+', methods: ['Column with carrying', 'Left to right', 'Number line jumps', 'Compensation', 'Partitioning'] },
  { id: 'subtraction', title: 'Subtraction', symbol: '−', methods: ['Column with borrowing', 'Equal addition', 'Counting up', 'Compensation', 'Number line', "Nines' complement"] },
  { id: 'fractions', title: 'Adding fractions', symbol: '⁄', methods: ['Common denominator', 'Lowest common denominator', 'Butterfly (cross-multiply)', 'Area model', 'Number line'] },
  { id: 'percent', title: 'Percentages', symbol: '%', methods: ['Decimal multiply', 'As a fraction', 'Proportion', '10% building blocks', 'Swap (x% of y = y% of x)'] },
  { id: 'squares', title: 'Squaring', symbol: 'x²', methods: ['(a+b)² expansion', 'Ends in 5 trick', 'Near a base', 'Difference of squares', 'Area picture'] },
  { id: 'roots', title: 'Square roots', symbol: '√', methods: ['Digit by digit', 'Babylonian (Newton)', 'Prime factors', 'Estimate and refine', 'Binary search'] },
  { id: 'gcd', title: 'Greatest common divisor', symbol: 'gcd', methods: ['Euclid', 'Prime factors', 'List the factors', 'Binary (Stein)'] },
  { id: 'sum-1-n', title: 'Sum 1 to n', symbol: 'Σ', methods: ['Gauss pairing', 'Triangle picture', 'Induction', 'Formula n(n+1)/2'] },
  { id: 'systems', title: 'Two equations', symbol: '{', methods: ['Substitution', 'Elimination', 'Graphing', "Cramer's rule", 'Matrix (Gaussian elimination)'] },
  { id: 'quadratics', title: 'Quadratics', symbol: 'x²+', methods: ['Factoring', 'Completing the square', 'Quadratic formula', 'Graphing', 'Po-Shen Loh method'] },
  { id: 'derivatives', title: 'Derivatives', symbol: "f′", methods: ['Limit definition', 'Power rule', 'Product / chain rules', 'Logarithmic', 'Finite differences'] },
  { id: 'integrals', title: 'Integrals', symbol: '∫', methods: ['Riemann sums', 'Trapezoid rule', "Simpson's rule", 'Antiderivative (FTC)', 'Substitution', 'By parts', 'Monte Carlo'] },
  { id: 'circle-area', title: 'Area of a circle', symbol: 'πr²', methods: ['Rearranged slices', 'Archimedes polygons', 'Onion rings', 'Integration'] },
  { id: 'pythagoras', title: 'Pythagoras', symbol: 'a²+b²', methods: ['Rearranged squares', 'Similar triangles', "Garfield's trapezoid", "Euclid's proof", "Bhaskara's square"] },
  { id: 'counting', title: 'Counting choices', symbol: 'nCr', methods: ['List them', 'Tree diagram', 'Formula', "Pascal's triangle"] },
  { id: 'primes', title: 'Is it prime?', symbol: 'p', methods: ['Trial division', 'Sieve of Eratosthenes', 'Fermat test', 'Divisibility rules'] },
];
