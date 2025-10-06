/**
 * Demo Data for Onboarding
 *
 * Pre-generated sources with summaries and embeddings
 * for instant time-to-value in onboarding flow
 *
 * CLAUDE.MD COMPLIANCE:
 * - ✅ AI content disclaimers included in all summaries
 * - ✅ Type-safe interfaces
 * - ✅ Documented utility functions
 */

/**
 * AI disclaimer required by CLAUDE.MD for all AI-generated content
 */
const AI_DISCLAIMER = '\n\n⚠️ AI-Generated Content: This summary was created by AI and should be reviewed for accuracy. Verify important facts before using in academic or professional contexts.'

export interface DemoSource {
  title: string
  content_type: 'text'
  original_content: string
  summary: {
    summary_text: string
    key_actions: string[]
    key_topics: string[]
    word_count: number
  }
}

export const DEMO_SOURCES: DemoSource[] = [
  {
    title: 'Introduction to Artificial Intelligence',
    content_type: 'text',
    original_content: `# Introduction to Artificial Intelligence

Artificial Intelligence (AI) is transforming how we live and work. At its core, AI refers to computer systems that can perform tasks typically requiring human intelligence—such as visual perception, speech recognition, decision-making, and language translation.

## Key Concepts

**Machine Learning**: AI systems learn from data rather than being explicitly programmed. The more data they process, the better they become at their tasks.

**Neural Networks**: Inspired by the human brain, these networks consist of interconnected nodes that process information in layers, enabling complex pattern recognition.

**Deep Learning**: A subset of machine learning using multi-layered neural networks. It powers modern breakthroughs in image recognition, natural language processing, and autonomous vehicles.

## Current Applications

- **Healthcare**: AI diagnoses diseases, analyzes medical images, and predicts patient outcomes
- **Finance**: Fraud detection, algorithmic trading, and risk assessment
- **Transportation**: Self-driving cars and traffic optimization
- **Education**: Personalized learning experiences and automated grading

## Future Implications

AI will continue to automate routine tasks, augment human capabilities, and create entirely new job categories. The key is ensuring AI development remains ethical, transparent, and beneficial to humanity.

As AI becomes more integrated into society, understanding its capabilities and limitations becomes essential for everyone—not just technologists.`,
    summary: {
      summary_text: `This article provides a comprehensive introduction to Artificial Intelligence (AI), covering fundamental concepts like machine learning, neural networks, and deep learning. It explores current real-world applications across healthcare, finance, transportation, and education, while highlighting the importance of ethical AI development for society.${AI_DISCLAIMER}`,
      key_actions: [
        'Learn the core concepts of AI (machine learning, neural networks, deep learning)',
        'Explore current AI applications in various industries',
        'Consider the ethical implications of AI development',
        'Stay informed about AI capabilities and limitations'
      ],
      key_topics: ['artificial intelligence', 'machine learning', 'neural networks', 'deep learning', 'AI ethics', 'automation'],
      word_count: 248
    }
  },
  {
    title: 'Building Better Productivity Habits',
    content_type: 'text',
    original_content: `# Building Better Productivity Habits

Productivity isn't about working harder—it's about working smarter. Research shows that small, consistent habits compound over time to create remarkable results.

## The Power of Tiny Habits

Start with habits so small they're impossible to fail at. Want to exercise daily? Begin with just 2 push-ups. Want to read more? Start with 1 page per day. The key is consistency, not intensity.

## Time Blocking

Divide your day into dedicated blocks for specific tasks:
- **Deep Work**: 2-4 hour blocks for focused, cognitively demanding work
- **Shallow Work**: Email, meetings, administrative tasks
- **Buffer Time**: Transition periods between blocks
- **Recovery**: Breaks, exercise, meals

## The Two-Minute Rule

If a task takes less than 2 minutes, do it immediately. This prevents small tasks from accumulating into overwhelming to-do lists.

## Energy Management Over Time Management

Work during your peak energy hours. Most people have 3-5 hours of high-quality cognitive capacity per day. Identify yours and protect them fiercely.

**Morning People**: Schedule deep work from 8am-12pm
**Night Owls**: Reserve creative tasks for evening hours

## The Weekly Review

Every Sunday, review your previous week and plan the next:
1. What went well? What didn't?
2. What are your top 3 priorities for next week?
3. Which commitments can you eliminate or delegate?

## Environment Design

Your environment shapes your behavior. Remove friction from good habits and add friction to bad ones:
- Put your phone in another room while working
- Prepare your gym clothes the night before
- Use website blockers during deep work sessions

## Conclusion

Productivity is a practice, not a destination. Start with one habit, master it, then add another. Compound effects will surprise you within weeks.`,
    summary: {
      summary_text: `This guide outlines evidence-based productivity strategies, emphasizing small, consistent habits over intense bursts of effort. Key techniques include time blocking, the two-minute rule, energy management, weekly reviews, and environment design. The focus is on sustainable systems that compound over time rather than willpower-dependent methods.${AI_DISCLAIMER}`,
      key_actions: [
        'Start with tiny, achievable habits (2 push-ups, 1 page of reading)',
        'Implement time blocking for deep and shallow work',
        'Apply the two-minute rule for quick tasks',
        'Schedule work during peak energy hours',
        'Conduct weekly reviews every Sunday',
        'Design your environment to support good habits'
      ],
      key_topics: ['productivity', 'habits', 'time management', 'deep work', 'energy management', 'weekly review', 'environment design'],
      word_count: 321
    }
  },
  {
    title: 'Climate Change: An Overview',
    content_type: 'text',
    original_content: `# Climate Change: An Overview

Climate change represents one of the most pressing challenges of our time. The Earth's average temperature has risen by approximately 1.1°C since pre-industrial times, with most of this warming occurring in the past 40 years.

## The Science

**Greenhouse Effect**: Gases like CO₂, methane, and nitrous oxide trap heat in the atmosphere. While this effect is natural and necessary for life, human activities have intensified it dramatically.

**Primary Causes**:
- Burning fossil fuels (coal, oil, natural gas) for energy
- Deforestation reducing CO₂ absorption
- Industrial agriculture and livestock (methane emissions)
- Manufacturing and transportation

## Observable Impacts

**Rising Temperatures**: Heat waves are more frequent and intense. The 20 warmest years on record have occurred since 1998.

**Melting Ice**: Arctic sea ice is declining at 13% per decade. Antarctica and Greenland are losing ice mass at accelerating rates.

**Sea Level Rise**: Global sea levels have risen 8-9 inches since 1880, with the rate doubling in recent years. Coastal cities face increasing flood risks.

**Extreme Weather**: More frequent hurricanes, droughts, wildfires, and heavy precipitation events.

**Ecosystem Disruption**: Coral reefs bleaching, species migration, and biodiversity loss.

## Projected Consequences

If current trends continue:
- 1.5°C warming could be reached by 2030-2050
- Widespread crop failures in vulnerable regions
- Displacement of millions due to sea level rise and extreme weather
- Irreversible tipping points (Amazon rainforest dieback, permafrost melting)

## Solutions

**Mitigation** (Reducing emissions):
- Transition to renewable energy (solar, wind, hydro)
- Electrify transportation
- Improve energy efficiency in buildings
- Protect and restore forests
- Develop carbon capture technologies

**Adaptation** (Preparing for impacts):
- Build resilient infrastructure
- Develop drought-resistant crops
- Improve water management systems
- Relocate vulnerable communities

## Individual Actions

While systemic change is essential, individual choices matter:
- Reduce air travel and car usage
- Adopt plant-rich diets
- Minimize waste and consume consciously
- Support climate-friendly policies and businesses
- Educate others and advocate for change

## Conclusion

Climate change is not a future problem—it's happening now. The next decade is critical for limiting warming to manageable levels. Action requires cooperation across nations, industries, and individuals.`,
    summary: {
      summary_text: `This article explains the science behind climate change, driven primarily by greenhouse gas emissions from fossil fuels, deforestation, and agriculture. It outlines observable impacts including rising temperatures, melting ice, sea level rise, and extreme weather. The piece emphasizes both mitigation strategies (reducing emissions through renewable energy and reforestation) and adaptation measures (building resilience), while highlighting the urgency of the next decade for limiting global warming.${AI_DISCLAIMER}`,
      key_actions: [
        'Understand the greenhouse effect and primary causes of climate change',
        'Recognize observable impacts (temperature rise, ice melting, extreme weather)',
        'Support transition to renewable energy and sustainable practices',
        'Take individual actions (reduce travel, plant-rich diet, conscious consumption)',
        'Advocate for climate-friendly policies',
        'Educate others about climate science and solutions'
      ],
      key_topics: ['climate change', 'global warming', 'greenhouse effect', 'renewable energy', 'sustainability', 'carbon emissions', 'environmental science'],
      word_count: 456
    }
  }
]

/**
 * Get demo source by index
 */
export function getDemoSource(index: number): DemoSource | null {
  return DEMO_SOURCES[index] || null
}

/**
 * Get all demo sources
 */
export function getAllDemoSources(): DemoSource[] {
  return DEMO_SOURCES
}

/**
 * Get demo source count
 */
export function getDemoSourceCount(): number {
  return DEMO_SOURCES.length
}
