/**
 * Every topic that can be solved more than one way. Each topic with 2+ methods gets its own page.
 * A topic is built when src/client/topics/<id>.ts exists; until then its page lists the planned methods.
 * Method lists are standard school and textbook methods (compiled from general knowledge, not a cited source).
 */
export interface Topic {
  id: string;
  title: string;
  symbol: string;
  /** The topic's method titles, in grid order (test/grids.test.ts checks they match src/client/topics/<id>.ts). */
  methods: string[];
}

export const TOPICS: Topic[] = [
  { id: 'multiplication', title: 'Multiplication', symbol: '×', methods: ["Standard", "Lattice", "Area / box", "Partial products", "Halve & double", "Lines"] },
  { id: 'division', title: 'Division', symbol: '÷', methods: ["Long division", "Short (bus stop)", "Chunking", "Partial quotients", "Doubling", "Area model"] },
  { id: 'addition', title: 'Addition', symbol: '+', methods: ["Column with carrying", "Left to right", "Number line jumps", "Compensation", "Partitioning", "Bridging to 100"] },
  { id: 'subtraction', title: 'Subtraction', symbol: '−', methods: ["Column with borrowing", "Equal addition", "Counting up", "Compensation", "Number line", "Nines' complement"] },
  { id: 'fractions', title: 'Adding fractions', symbol: '⁄', methods: ["Common denominator", "Lowest common denom.", "Butterfly", "Area model", "Number line"] },
  { id: 'percent', title: 'Percentages', symbol: '%', methods: ["Decimal multiply", "As a fraction", "Proportion", "10% building blocks", "Swap (x% of y = y% of x)", "Hundred grid (1%)"] },
  { id: 'squares', title: 'Squaring', symbol: 'x²', methods: ["(a+b)² expansion", "Ends in 5 trick", "Near a base", "Difference of squares", "Area picture"] },
  { id: 'roots', title: 'Square roots', symbol: '√', methods: ["Digit by digit", "Babylonian (Newton)", "Prime factors", "Estimate and refine", "Binary search"] },
  { id: 'gcd', title: 'Greatest common divisor', symbol: 'gcd', methods: ["Euclid", "Cut squares", "Prime factors", "List the factors", "Binary (Stein)", "Ladder"] },
  { id: 'sum-1-n', title: 'Sum 1 to n', symbol: 'Σ', methods: ["Gauss pairing", "Two staircases", "Half a square", "Induction", "Formula n(n+1)/2"] },
  { id: 'systems', title: 'Two equations', symbol: '{', methods: ["Substitution", "Elimination", "Graphing", "Cramer's rule", "Matrix (Gaussian)", "Equating"] },
  { id: 'quadratics', title: 'Quadratics', symbol: 'x²+', methods: ["Factoring", "Completing the square", "Quadratic formula", "Graphing", "Po-Shen Loh"] },
  { id: 'derivatives', title: 'Derivatives', symbol: "f′", methods: ["Limit definition", "Power rule", "Product rule", "Logarithmic", "Finite differences", "Binomial expansion"] },
  { id: 'integrals', title: 'Integrals', symbol: '∫', methods: ["Riemann sums", "Trapezoid rule", "Simpson's rule", "Antiderivative (FTC)", "By parts", "Monte Carlo"] },
  { id: 'circle-area', title: 'Area of a circle', symbol: 'πr²', methods: ["Rearranged slices", "Archimedes polygons", "Onion rings", "Integration", "Counting squares"] },
  { id: 'pythagoras', title: 'Pythagoras', symbol: 'a²+b²', methods: ["Rearranged squares", "Similar triangles", "Garfield's trapezoid", "Euclid's proof", "Bhaskara's square"] },
  { id: 'counting', title: 'Counting choices', symbol: 'nCr', methods: ["List them", "Tree diagram", "Formula", "Pascal's triangle", "Ordered picks ÷ r!"] },
  { id: 'primes', title: 'Is it prime?', symbol: 'p', methods: ["Trial division", "Sieve of Eratosthenes", "Fermat test", "Divisibility rules", "Wilson's theorem"] },
];
