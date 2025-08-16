// DailyClaim contract ABI (minimal version for claim function)
export const dailyClaimAbi = [
  {
    inputs: [],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimAmount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract addresses
export const CONTRACTS = {
  dailyClaim: '0x0e72291f013cccf516a89381dd3966feedc63ef6' as `0x${string}`,
  streamToken: '0x2ce6620221d585cf8c8f5730581c781de5db4fc3' as `0x${string}`,
} as const;

// Error message mapping
export const ERROR_MESSAGES = {
  'DailyClaim: claim too soon': 'You\'ve already claimed today. Come back tomorrow!',
  'DailyClaim: paused': 'Claiming is temporarily disabled',
  'DailyClaim: zero token address': 'Contract configuration error',
  'DailyClaim: only admin': 'Admin only function',
  'DailyClaim: interval too small': 'Invalid claim interval',
  'DailyClaim: zero address': 'Invalid address',
  'DailyClaim: recovery failed': 'Token recovery failed',
  'User rejected the transaction': 'Transaction cancelled',
  'User rejected the request': 'Request cancelled',
  'insufficient funds': 'Insufficient funds for transaction',
  'network error': 'Network error. Please try again.',
  'unknown error': 'An unexpected error occurred. Please try again.',
} as const;
