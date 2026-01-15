/**
 * Generate a human-readable diff between two text strings
 * Returns a formatted string showing additions and deletions with line numbers
 */
export function generateTextDiff(oldText: string, newText: string): string {
  const oldLines = oldText ? oldText.split('\n') : []
  const newLines = newText ? newText.split('\n') : []
  
  const diffLines: string[] = []
  const maxOldLine = oldLines.length
  const maxNewLine = newLines.length
  
  let oldIndex = 0
  let newIndex = 0
  
  // Simple line-by-line diff algorithm
  while (oldIndex < maxOldLine || newIndex < maxNewLine) {
    const oldLine = oldLines[oldIndex]
    const newLine = newLines[newIndex]
    
    if (oldIndex >= maxOldLine) {
      // Only new lines remaining
      diffLines.push(`+ ${newIndex + 1}: ${newLine}`)
      newIndex++
    } else if (newIndex >= maxNewLine) {
      // Only old lines remaining
      diffLines.push(`- ${oldIndex + 1}: ${oldLine}`)
      oldIndex++
    } else if (oldLine === newLine) {
      // Lines match - skip
      oldIndex++
      newIndex++
    } else {
      // Lines differ - check if it's a modification or insertion/deletion
      const oldLineInNew = newLines.slice(newIndex).indexOf(oldLine)
      const newLineInOld = oldLines.slice(oldIndex).indexOf(newLine)
      
      if (oldLineInNew === -1 && newLineInOld === -1) {
        // Both lines unique - treat as modification
        diffLines.push(`- ${oldIndex + 1}: ${oldLine}`)
        diffLines.push(`+ ${newIndex + 1}: ${newLine}`)
        oldIndex++
        newIndex++
      } else if (oldLineInNew !== -1 && (newLineInOld === -1 || oldLineInNew <= newLineInOld)) {
        // Old line found later in new - lines were added
        diffLines.push(`+ ${newIndex + 1}: ${newLine}`)
        newIndex++
      } else {
        // New line found later in old - lines were deleted
        diffLines.push(`- ${oldIndex + 1}: ${oldLine}`)
        oldIndex++
      }
    }
  }
  
  if (diffLines.length === 0) {
    return 'No changes detected'
  }
  
  return diffLines.join('\n')
}

/**
 * Format diff for display in comments
 */
export function formatDiffForComment(diff: string): string {
  if (!diff || diff === 'No changes detected') {
    return diff
  }
  
  return '```diff\n' + diff + '\n```'
}

/**
 * Generate a summary of changes
 */
export function generateDiffSummary(oldText: string, newText: string): string {
  const oldLines = oldText ? oldText.split('\n') : []
  const newLines = newText ? newText.split('\n') : []
  
  const diff = generateTextDiff(oldText, newText)
  const diffLines = diff.split('\n')
  
  const additions = diffLines.filter(line => line.startsWith('+')).length
  const deletions = diffLines.filter(line => line.startsWith('-')).length
  
  const parts: string[] = []
  if (additions > 0) parts.push(`${additions} line${additions > 1 ? 's' : ''} added`)
  if (deletions > 0) parts.push(`${deletions} line${deletions > 1 ? 's' : ''} removed`)
  
  return parts.join(', ') || 'No changes'
}
