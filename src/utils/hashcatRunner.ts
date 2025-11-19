import type { HashcatConfig } from '@/types/hashcat.types'

export function buildHashcatArgs(config: HashcatConfig): string[] {
  const args: string[] = []
  
  // Attack mode and hash type (must come first)
  args.push('-m', config.hashType.toString())
  args.push('-a', config.attackMode.toString())
  
  // Add --force flag early to allow CPU-only mode if OpenCL is not available
  // This helps when GPU drivers aren't installed
  if (config.forceCpu) {
    args.push('--force')
  }
  
  // Options (before hash file)
  args.push('-w', config.workloadProfile.toString())
  
  // Rules (if applicable, comes before hash file)
  if (config.rules) {
    args.push('-r', config.rules)
  }
  
  // GPU selection
  if (config.gpuDevices) {
    args.push('--hwmon-temp-abort', '90')
    // GPU device selection would be --device-id or similar
  }
  
  // Output format
  args.push('--outfile-format', '2') // hash:password format
  // Output file for cracked passwords (hashcat writes results here)
  if (config.outputFile) {
    args.push('--outfile', config.outputFile)
  }
  // Don't use --quiet so we can see progress updates
  // args.push('--quiet') // Less verbose output for parsing
  // Note: --show is handled separately after hashcat runs if needed
  
  // Custom arguments (before positional args)
  if (config.customArgs) {
    args.push(...config.customArgs)
  }
  
  // Hash file (positional, comes after options)
  if (config.hashFile) {
    args.push(config.hashFile)
  }
  
  // Attack mode specific arguments (positional, after hash file)
  if (config.attackMode === 0) {
    // Dictionary attack
    if (config.wordlist) {
      args.push(config.wordlist)
    }
  } else if (config.attackMode === 1) {
    // Combinator attack
    if (config.wordlist) {
      args.push(config.wordlist)
    }
    // Second wordlist would be needed
  } else if (config.attackMode === 3) {
    // Brute-force
    if (config.mask) {
      args.push(config.mask)
    }
  } else if (config.attackMode === 6 || config.attackMode === 7) {
    // Hybrid attacks
    if (config.wordlist) {
      args.push(config.wordlist)
    }
    if (config.mask) {
      args.push(config.mask)
    }
  }
  
  return args
}

export function parseHashcatOutput(line: string): {
  speed?: number
  progress?: number
  timeElapsed?: number
  timeEstimated?: number
  recovered?: number
} | null {
  const result: any = {}
  
  // Skip timestamp lines (Started:, Stopped:) - these are not elapsed time
  if (line.includes('Started:') || line.includes('Stopped:')) {
    return null
  }
  
  // Parse speed (H/s, KH/s, MH/s)
  const speedMatch = line.match(/([\d.]+)\s*([KM]?H\/s)/)
  if (speedMatch) {
    let speed = parseFloat(speedMatch[1])
    const unit = speedMatch[2]
    if (unit === 'KH/s') speed *= 1000
    if (unit === 'MH/s') speed *= 1000000
    result.speed = speed
  }
  
  // Parse progress percentage (look for patterns like "Progress: 12.34%" or "12.34%")
  const progressMatch = line.match(/(?:Progress|progress)[:\s]+([\d.]+)%|^([\d.]+)%/)
  if (progressMatch) {
    result.progress = parseFloat(progressMatch[1] || progressMatch[2])
  }
  
  // Parse elapsed time (look for "Time.Estimated" or "Time.Elapsed" patterns)
  // Format: "Time.Elapsed.: 0:00:05" or similar
  const elapsedMatch = line.match(/Time\.Elapsed[:\s]+(\d+):(\d+):(\d+)/i)
  if (elapsedMatch) {
    const hours = parseInt(elapsedMatch[1])
    const minutes = parseInt(elapsedMatch[2])
    const seconds = parseInt(elapsedMatch[3])
    result.timeElapsed = hours * 3600 + minutes * 60 + seconds
  }
  
  // Parse estimated time
  const estimatedMatch = line.match(/Time\.Estimated[:\s]+(\d+):(\d+):(\d+)/i)
  if (estimatedMatch) {
    const hours = parseInt(estimatedMatch[1])
    const minutes = parseInt(estimatedMatch[2])
    const seconds = parseInt(estimatedMatch[3])
    result.timeEstimated = hours * 3600 + minutes * 60 + seconds
  }
  
  // Parse recovered count
  const recoveredMatch = line.match(/Recovered\.\.\.\.\.\.\.\.:\s*(\d+)/)
  if (recoveredMatch) {
    result.recovered = parseInt(recoveredMatch[1])
  }
  
  return Object.keys(result).length > 0 ? result : null
}

export function parseCrackedLine(line: string): { hash: string; password: string } | null {
  // Hashcat outputs cracked passwords in format: hash:password
  // Potfile format is also hash:password (but might have different hash formats)
  // But we need to be strict - ignore status messages, file paths, etc.
  
  // Skip common non-password lines
  // Be careful not to skip lines where these words might be passwords!
  // Only skip if they appear in specific contexts (e.g., "hashcat" as a tool name, not as a password)
  if (line.includes('Started:') || 
      line.includes('Stopped:') || 
      line.includes('Counting lines') ||
      line.includes('Reading dictionary') ||
      line.includes('Progress') ||
      line.includes('Time.') ||
      line.includes('Speed.') ||
      line.includes('Recovered') ||
      line.includes('OpenCL') ||
      line.includes('ERROR') ||
      line.includes('WARNING') ||
      line.startsWith('Session.') ||
      line.includes('INFO:') ||
      line.includes('For more information') ||
      // Only skip "hashcat" if it's clearly a tool reference (not a password)
      (line.includes('hashcat') && (line.includes('hashcat.net') || line.includes('hashcat ') || line.startsWith('hashcat'))) ||
      line.includes('hashcat.net')) {
    return null
  }
  
  // Skip file paths (but allow colons in passwords)
  if (line.includes('\\') && (line.includes('C:\\') || line.includes('Users\\') || line.includes('Temp\\'))) {
    return null
  }
  
  // Match hash:password format
  // Hash can be various lengths (MD5=32, SHA1=40, SHA256=64, etc.)
  // Potfile format is typically just hash:password on a single line
  // Try multiple patterns:
  // 1. Standard hex hash (16-256 chars):password
  // 2. Any hex string (8+ chars):password (more flexible for potfile)
  // 3. Any alphanumeric string that looks like a hash:password
  
  // First try the strict pattern
  let match = line.match(/^([a-fA-F0-9]{16,256}):(.+)$/)
  
  // If that fails, try a more flexible pattern for potfile (minimum 8 hex chars)
  if (!match) {
    match = line.match(/^([a-fA-F0-9]{8,256}):(.+)$/)
  }
  
  // If still no match, try any string that looks like hash:password (at least 8 chars before colon)
  if (!match) {
    match = line.match(/^([a-fA-F0-9]{8,}):(.+)$/)
  }
  
  if (match) {
    const hash = match[1].trim()
    const password = match[2].trim()
    
    // Additional validation: password shouldn't look like a file path or timestamp
    if (password.includes('\\') && (password.includes('C:') || password.includes('Users') || password.includes('Temp'))) {
      return null
    }
    if (password.match(/^\d{4}-\d{2}-\d{2}/)) { // Date format
      return null
    }
    if (password.match(/^[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4}/)) { // Full timestamp format
      return null
    }
    
    // Password should have at least one character
    if (password.length === 0) {
      return null
    }
    
    return { hash, password }
  }
  return null
}

