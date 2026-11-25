/**
 * Every topic that can be solved more than one way. Each topic with 2+ methods gets its own page;
 * `built: true` means its method grid is live, the rest show their method list until they're built.
 * Method lists are standard school and textbook methods (compiled from general knowledge, not a cited source).
 */
export interface Topic {
  id: string;
  title: string;
  symbol: string;
  methods: string[];
  built: boolean;
}

export const TOPICS: Topic[] = [
  { id: 'multiplication', title: 'Multiplication', symbol: '×', built: true, methods: ['Standard (long)', 'Lattice', 'Area / box', 'Partial products', 'Halve & double', 'Lines (sticks)'] },
  { id: 'division', title: 'Division', symbol: '÷', built: true, methods: ['Long division', 'Short (bus stop)', 'Chunking', 'Partial quotients', 'Doubling (Egyptian)', 'Area model'] },
  { id: 'addition', title: 'Addition', symbol: '+', built: false, methods: ['Column with carrying', 'Left to right', 'Number line jumps', 'Compensation', 'Partitioning'] },
  { id: 'subtraction', title: 'Subtraction', symbol: '−', built: false, methods: ['Column with borrowing', 'Equal addition', 'Counting up', 'Compensation', 'Number line', "Nines' complement"] },
  { id: 'fractions', title: 'Adding fractions', symbol: '⁄', built: false, methods: ['Common denominator', 'Lowest common denominator', 'Butterfly (cross-multiply)', 'Area model', 'Number line'] },
  { id: 'percent', title: 'Percentages', symbol: '%', built: false, methods: ['Decimal multiply', 'As a fraction', 'Proportion', '10% building blocks', 'Swap (x% of y = y% of x)'] },
  { id: 'squares', title: 'Squaring', symbol: 'x²', built: false, methods: ['(a+b)² expansion', 'Ends in 5 trick', 'Near a base', 'Difference of squares', 'Area picture'] },
  { id: 'roots', title: 'Square roots', symbol: '√', built: false, methods: ['Digit by digit', 'Babylonian (Newton)', 'Prime factors', 'Estimate and refine', 'Binary search'] },
  { id: 'gcd', title: 'Greatest common divisor', symbol: 'gcd', built: false, methods: ['Euclid', 'Prime factors', 'List the factors', 'Binary (Stein)'] },
  { id: 'sum-1-n', title: 'Sum 1 to n', symbol: 'Σ', built: false, methods: ['Gauss pairing', 'Triangle picture', 'Induction', 'Formula n(n+1)/2'] },
  { id: 'systems', title: 'Two equations', symbol: '{', built: false, methods: ['Substitution', 'Elimination', 'Graphing', "Cramer's rule", 'Matrix (Gaussian elimination)'] },
  { id: 'quadratics', title: 'Quadratics', symbol: 'x²+', built: false, methods: ['Factoring', 'Completing the square', 'Quadratic formula', 'Graphing', 'Po-Shen Loh method'] },
  { id: 'derivatives', title: 'Derivatives', symbol: "f′", built: false, methods: ['Limit definition', 'Power rule', 'Product / chain rules', 'Logarithmic', 'Finite differences'] },
  { id: 'integrals', title: 'Integrals', symbol: '∫', built: false, methods: ['Riemann sums', 'Trapezoid rule', "Simpson's rule", 'Antiderivative (FTC)', 'Substitution', 'By parts', 'Monte Carlo'] },
  { id: 'circle-area', title: 'Area of a circle', symbol: 'πr²', built: false, methods: ['Rearranged slices', 'Archimedes polygons', 'Onion rings', 'Integration'] },
  { id: 'pythagoras', title: 'Pythagoras', symbol: 'a²+b²', built: false, methods: ['Rearranged squares', 'Similar triangles', "Garfield's trapezoid", "Euclid's proof", "Bhaskara's square"] },
  { id: 'counting', title: 'Counting choices', symbol: 'nCr', built: false, methods: ['List them', 'Tree diagram', 'Formula', "Pascal's triangle"] },
  { id: 'primes', title: 'Is it prime?', symbol: 'p', built: false, methods: ['Trial division', 'Sieve of Eratosthenes', 'Fermat test', 'Divisibility rules'] },
];
