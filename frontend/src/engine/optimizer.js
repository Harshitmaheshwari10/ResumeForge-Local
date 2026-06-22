import { analyzeJobDescription } from './jdAnalyzer'
import { parseResume } from './resumeParser'
import { rewriteResume } from './resumeRewriter'
import {
  analyzeKeywords, analyzeSkillGap, calculateAtsScores, generateSuggestions,
} from './scoring'

export function optimizeResume(resumeText, jobDescription, template = 'generic') {
  const original_resume = parseResume(resumeText)
  const job_analysis = analyzeJobDescription(jobDescription)
  const optimized = rewriteResume(original_resume, job_analysis, template)
  const scores = calculateAtsScores(optimized, job_analysis)
  const keyword_analysis = analyzeKeywords(optimized.raw_text, job_analysis)
  const skill_gap = analyzeSkillGap(optimized, job_analysis)
  const suggestions = generateSuggestions(scores, keyword_analysis, skill_gap)

  return {
    original_resume,
    optimized_resume: optimized,
    optimized_text: optimized.raw_text,
    job_analysis,
    scores,
    keyword_analysis,
    skill_gap,
    suggestions,
    template,
  }
}
