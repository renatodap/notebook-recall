/**
 * Quick Wins Configuration
 *
 * Defines onboarding milestones and progress tracking
 */

export interface QuickWin {
  id: string
  title: string
  description: string
  icon: string
  order: number
}

export const QUICK_WINS: QuickWin[] = [
  {
    id: 'onboarding_started',
    title: 'Start your journey',
    description: 'Begin the onboarding process',
    icon: '🚀',
    order: 0,
  },
  {
    id: 'first_source',
    title: 'Add your first source',
    description: 'Capture your first piece of knowledge',
    icon: '📄',
    order: 1,
  },
  {
    id: 'first_search',
    title: 'Perform a search',
    description: 'Find something with natural language',
    icon: '🔍',
    order: 2,
  },
  {
    id: 'five_sources',
    title: 'Collect 5 sources',
    description: 'Build your knowledge base',
    icon: '📚',
    order: 3,
  },
  {
    id: 'first_synthesis',
    title: 'Generate a synthesis report',
    description: 'See AI connect ideas across sources',
    icon: '✨',
    order: 4,
  },
  {
    id: 'first_collection',
    title: 'Create a collection',
    description: 'Organize related sources together',
    icon: '📁',
    order: 5,
  },
]

/**
 * Get quick win by ID
 */
export function getQuickWin(id: string): QuickWin | undefined {
  return QUICK_WINS.find((win) => win.id === id)
}

/**
 * Get all quick wins
 */
export function getAllQuickWins(): QuickWin[] {
  return QUICK_WINS
}

/**
 * Calculate completion percentage
 */
export function calculateProgress(completedWins: string[]): number {
  const totalWins = QUICK_WINS.length
  const completed = completedWins.length
  return Math.round((completed / totalWins) * 100)
}

/**
 * Get next uncompleted win
 */
export function getNextWin(completedWins: string[]): QuickWin | null {
  const completedSet = new Set(completedWins)
  return QUICK_WINS.find((win) => !completedSet.has(win.id)) || null
}

/**
 * Check if specific win is completed
 */
export function isWinCompleted(winId: string, completedWins: string[]): boolean {
  return completedWins.includes(winId)
}
