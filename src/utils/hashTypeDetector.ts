import type { HashTypeInfo } from '@/types/hashcat.types'

// Common hash types with detection patterns
export const hashTypes: HashTypeInfo[] = [
  { id: 0, name: 'MD5', description: 'MD5 Hash', example: '5d41402abc4b2a76b9719d911017c592' },
  { id: 100, name: 'SHA1', description: 'SHA-1 Hash', example: 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d' },
  { id: 1400, name: 'SHA256', description: 'SHA-256 Hash', example: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae' },
  { id: 1700, name: 'SHA512', description: 'SHA-512 Hash', example: '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043' },
  { id: 3200, name: 'bcrypt', description: 'bcrypt Hash', example: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' },
  { id: 1000, name: 'NTLM', description: 'NTLM Hash', example: '209c6174da490caeb422f3fa5a7ae634' },
  { id: 1800, name: 'sha512crypt', description: 'sha512crypt $6$', example: '$6$rounds=5000$usesomesillystringforsalt$' },
  { id: 500, name: 'md5crypt', description: 'md5crypt $1$', example: '$1$28772684$iEwNOgGugqO9.bIz5sk8k/' },
]

export function detectHashType(hash: string): number | null {
  const trimmed = hash.trim()
  
  // MD5: 32 hex characters
  if (/^[a-fA-F0-9]{32}$/.test(trimmed)) {
    return 0
  }
  
  // SHA1: 40 hex characters
  if (/^[a-fA-F0-9]{40}$/.test(trimmed)) {
    return 100
  }
  
  // SHA256: 64 hex characters
  if (/^[a-fA-F0-9]{64}$/.test(trimmed)) {
    return 1400
  }
  
  // SHA512: 128 hex characters
  if (/^[a-fA-F0-9]{128}$/.test(trimmed)) {
    return 1700
  }
  
  // NTLM: 32 hex characters (same as MD5, but context matters)
  if (/^[a-fA-F0-9]{32}$/.test(trimmed)) {
    return 1000 // Default to NTLM if 32 chars (can be overridden)
  }
  
  // bcrypt: starts with $2a$, $2b$, or $2y$
  if (/^\$2[aby]\$/.test(trimmed)) {
    return 3200
  }
  
  // md5crypt: starts with $1$
  if (/^\$1\$/.test(trimmed)) {
    return 500
  }
  
  // sha512crypt: starts with $6$
  if (/^\$6\$/.test(trimmed)) {
    return 1800
  }
  
  return null
}

export function parseHashes(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith('#'))
}

