const {
  getGeminiModel,
  getFallbackModelNames,
  setActiveGeminiModel,
} = require('../config/gemini');
const OpenAI = require('openai');

let openaiClient = null;
let xaiClient = null;

const SECTION_RULES = [
  {
    key: 'projectOverview',
    label: 'Project Overview',
    max: 10,
    patterns: ['project overview', 'introduction', 'objective', 'aim', 'problem statement'],
  },
  {
    key: 'moduleBreakdown',
    label: 'Module-Wise Breakdown',
    max: 10,
    patterns: ['module', 'architecture', 'component', 'design', 'workflow'],
  },
  {
    key: 'functionalities',
    label: 'Functionalities',
    max: 10,
    patterns: ['features', 'functionality', 'working', 'execution', 'implementation'],
  },
  {
    key: 'technologyUsed',
    label: 'Technology Used',
    max: 10,
    patterns: ['technology', 'language', 'library', 'tool', 'framework'],
  },
  {
    key: 'flowDiagram',
    label: 'Flow Diagram',
    max: 10,
    patterns: ['flow diagram', 'flowchart', 'sequence diagram', 'pipeline', 'data flow'],
  },
  {
    key: 'githubTracking',
    label: 'Revision Tracking on GitHub',
    max: 10,
    patterns: ['github', 'repository', 'commit', 'version control', 'branch'],
  },
  {
    key: 'conclusion',
    label: 'Conclusion and Future Scope',
    max: 10,
    patterns: ['conclusion', 'future scope', 'result', 'summary', 'limitation'],
  },
  {
    key: 'references',
    label: 'References',
    max: 5,
    patterns: ['reference', 'bibliography', 'citation', 'source'],
  },
  {
    key: 'appendixAI',
    label: 'Appendix A',
    max: 10,
    patterns: ['appendix a', 'ai-generated', 'elaboration', 'breakdown report'],
  },
  {
    key: 'problemStatement',
    label: 'Appendix B',
    max: 5,
    patterns: ['appendix b', 'problem statement', 'problem definition'],
  },
  {
    key: 'solutionCode',
    label: 'Appendix C',
    max: 10,
    patterns: ['appendix c', 'source code', 'code', 'algorithm', 'program'],
  },
];

const SECTION_IMPROVEMENT_GUIDES = {
  projectOverview: 'Write 2 short paragraphs covering objective, expected output, and practical use-case in OS lab context.',
  moduleBreakdown: 'Add module-wise breakup with module name, responsibility, input, output, and dependency for each module.',
  functionalities: 'List implemented features with clear behavior: what the feature does, when it runs, and sample input/output.',
  technologyUsed: 'Separate technologies into Programming Languages, Libraries/Frameworks, and Tools with one-line purpose each.',
  flowDiagram: 'Include a flow sequence in text: Start -> Input -> Validation -> Processing -> Output -> End.',
  githubTracking: 'Add repository name, GitHub link, and at least 3 meaningful commit examples with dates and purpose.',
  conclusion: 'Summarize achieved results, key learning, limitation, and 2-3 future enhancements.',
  references: 'Add 3-5 references in consistent format including docs/tutorial links used during implementation.',
  appendixAI: 'Expand Appendix A with generated breakdown and explain how the breakdown maps to your actual implementation.',
  problemStatement: 'State problem constraints, expected output, assumptions, and evaluation criteria in 5-8 lines.',
  solutionCode: 'Include complete runnable code with comments for key logic and mention execution steps.',
};

const isForceLocalEnabled = () => String(process.env.AI_FORCE_LOCAL || 'false').toLowerCase() === 'true';

const SYSTEM_PROMPT = `You are an expert evaluator for Operating System Lab Reports at Lovely Professional University (LPU).

Evaluate the following student OS lab report strictly based on this required format:
1. Project Overview
2. Module-Wise Breakdown
3. Functionalities
4. Technology Used (Programming Languages, Libraries and Tools, Other Tools)
5. Flow Diagram (check if mentioned/described)
6. Revision Tracking on GitHub (Repository Name + GitHub Link)
7. Conclusion and Future Scope
8. References
9. Appendix A: AI-Generated Project Elaboration/Breakdown Report
10. Appendix B: Problem Statement
11. Appendix C: Solution/Code (complete code)

Respond ONLY with a valid JSON object (no markdown, no explanation outside JSON):
{
  "totalScore": <number 0-100>,
  "sectionScores": {
    "projectOverview": <0-10>,
    "moduleBreakdown": <0-10>,
    "functionalities": <0-10>,
    "technologyUsed": <0-10>,
    "flowDiagram": <0-10>,
    "githubTracking": <0-10>,
    "conclusion": <0-10>,
    "references": <0-5>,
    "appendixAI": <0-10>,
    "problemStatement": <0-5>,
    "solutionCode": <0-10>
  },
  "missingSections": [<list of missing section names>],
  "mistakes": [<list of specific mistakes found>],
  "aiUsagePercentage": <estimated % of AI-generated content 0-100>,
  "aiUsageDetails": "<explanation of how AI use was detected>",
  "improvements": [<list of 5-8 specific actionable improvements>],
  "strengths": [<list of 3-5 strengths>],
  "overallFeedback": "<2-3 sentence summary>",
  "plagiarismRisk": "<Low/Medium/High>",
  "formatCompliance": <number 0-100>
}`;

const REPORT_DRAFT_SYSTEM_PROMPT = `You are an expert academic report writer for Operating System Lab Reports at Lovely Professional University (LPU).

Generate a clean, submission-ready report that strictly follows this exact order:
1. Project Overview
2. Module-Wise Breakdown
3. Functionalities
4. Technology Used (Programming Languages, Libraries and Tools, Other Tools)
5. Flow Diagram (write a textual flow description if image is unavailable)
6. Revision Tracking on GitHub (Repository Name + GitHub Link placeholder if missing)
7. Conclusion and Future Scope
8. References
9. Appendix A: AI-Generated Project Elaboration/Breakdown Report
10. Appendix B: Problem Statement
11. Appendix C: Solution/Code

Rules:
- Output plain text only.
- Include all section headings exactly.
- If data is missing, fill with "To be added" placeholders rather than skipping sections.
- Keep wording formal, concise, and student-friendly.
- For Appendix C include a clearly separated code section template.`;

const getOpenAIClient = () => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

const getXAIClient = () => {
  if (!xaiClient) {
    if (!process.env.XAI_API_KEY) {
      throw new Error('XAI_API_KEY is not set in environment variables');
    }
    xaiClient = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: process.env.XAI_BASE_URL || 'https://api.x.ai/v1',
    });
  }
  return xaiClient;
};

const cleanModelOutput = (text) => {
  let cleanedText = String(text || '').trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleanedText;
};

const clamp = (val, min, max) => Math.min(max, Math.max(min, Number(val) || 0));

const scoreSectionByRules = (textLower, wordCount, sectionRule) => {
  const hitCount = sectionRule.patterns.reduce((count, keyword) => {
    return count + (textLower.includes(keyword) ? 1 : 0);
  }, 0);

  const keywordCoverage = hitCount / sectionRule.patterns.length;
  const coverageScore = keywordCoverage * sectionRule.max * 0.85;
  const lengthBonus = Math.min(sectionRule.max * 0.15, (wordCount / 2000) * sectionRule.max * 0.15);

  return Math.round(clamp(coverageScore + lengthBonus, 0, sectionRule.max));
};

const runLocalFallbackAnalysis = (extractedText, reason = '') => {
  const text = String(extractedText || '');
  const textLower = text.toLowerCase();
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const sectionScores = {};
  const missingSections = [];
  const weakSections = [];

  for (const section of SECTION_RULES) {
    const sectionScore = scoreSectionByRules(textLower, wordCount, section);
    sectionScores[section.key] = sectionScore;

    if (sectionScore <= Math.ceil(section.max * 0.3)) {
      missingSections.push(section.label);
    }

    if (sectionScore < Math.ceil(section.max * 0.7)) {
      weakSections.push({
        key: section.key,
        label: section.label,
        score: sectionScore,
        max: section.max,
        gap: section.max - sectionScore,
      });
    }
  }

  const totalScore = clamp(
    SECTION_RULES.reduce((sum, section) => sum + (sectionScores[section.key] || 0), 0),
    0,
    100
  );

  const formatCompliance = Math.round((totalScore / 100) * 100);
  const strengths = SECTION_RULES
    .filter((section) => (sectionScores[section.key] || 0) >= Math.ceil(section.max * 0.7))
    .slice(0, 5)
    .map((section) => `${section.label} is reasonably documented.`);

  const sortedWeakSections = weakSections.sort((a, b) => b.gap - a.gap);

  const improvements = sortedWeakSections.slice(0, 8).map((section) => {
    const guide = SECTION_IMPROVEMENT_GUIDES[section.key] || 'Expand this section with clearer structure and concrete technical details.';
    return `${section.label} (${section.score}/${section.max}): ${guide}`;
  });

  if (!improvements.length) {
    improvements.push('Improve clarity by adding concrete examples, outputs, and a short validation summary for each major section.');
  }

  const mistakes = sortedWeakSections.length
    ? sortedWeakSections.slice(0, 8).map((section) => `Low coverage in ${section.label} (${section.score}/${section.max}). Add missing technical depth and structured explanation.`)
    : ['No major structure gaps detected, but depth and clarity can still be improved with stronger examples.'];

  const plagiarismRisk = totalScore >= 75 ? 'Low' : totalScore >= 45 ? 'Medium' : 'High';

  const localResult = {
    totalScore,
    sectionScores,
    missingSections,
    mistakes,
    aiUsagePercentage: 0,
    aiUsageDetails: 'Local rule-based fallback analysis was used. Scores are derived from section coverage and structure completeness, not external AI generation.',
    improvements,
    strengths,
    overallFeedback: `This report was evaluated in local mode. Current score is ${totalScore}/100 with ${missingSections.length} missing/weak sections. Focus first on low-scoring sections and add module-level depth, evidence, and complete appendices to improve overall quality.`,
    plagiarismRisk,
    formatCompliance,
  };

  return {
    success: true,
    data: sanitizeAnalysisResponse(localResult),
    rawResponse: JSON.stringify({ source: 'local', reason }),
    modelUsed: 'local-rules-v1',
    providerUsed: 'local',
    analysisMode: 'local',
    fallbackReason: reason,
  };
};

const buildProviderOrder = () => {
  const providerFromEnv = (process.env.AI_PROVIDER || '').toLowerCase();
  const allowFallback = String(process.env.AI_FALLBACK || 'false').toLowerCase() === 'true';
  const providers = [];

  if (providerFromEnv) {
    if (!allowFallback) {
      return ['openai', 'gemini', 'xai'].includes(providerFromEnv) ? [providerFromEnv] : [];
    }
    providers.push(providerFromEnv);
  }

  // Only auto-include providers when fallback mode is enabled.
  if (allowFallback) {
    if (process.env.XAI_API_KEY) {
      providers.push('xai');
    }
    if (process.env.OPENAI_API_KEY) {
      providers.push('openai');
    }
    if (process.env.GEMINI_API_KEY) {
      providers.push('gemini');
    }
  }

  return [...new Set(providers)].filter((provider) => ['openai', 'gemini', 'xai'].includes(provider));
};

const runGeminiAnalysis = async (prompt) => {
  const modelNames = getFallbackModelNames();
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      setActiveGeminiModel(modelName);
      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const parsed = JSON.parse(cleanModelOutput(text));
      const sanitized = sanitizeAnalysisResponse(parsed);
      return { success: true, data: sanitized, rawResponse: text, modelUsed: modelName, providerUsed: 'gemini' };
    } catch (error) {
      lastError = error;
      const message = String(error.message || '');
      const isModelNotFound = message.includes('is not found for API version') || message.includes('404 Not Found');

      if (!isModelNotFound) {
        throw new Error(`Gemini analysis failed: ${message}`);
      }

      console.warn(`Gemini model unavailable: ${modelName}. Trying next fallback model.`);
    }
  }

  throw new Error(`Gemini analysis failed: ${lastError?.message || 'No supported Gemini model found for this API key.'}`);
};

const runOpenAIAnalysis = async (userPrompt) => {
  const client = getOpenAIClient();
  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const completion = await client.chat.completions.create({
    model: modelName,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = completion.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(cleanModelOutput(text));
  const sanitized = sanitizeAnalysisResponse(parsed);
  return { success: true, data: sanitized, rawResponse: text, modelUsed: modelName, providerUsed: 'openai' };
};

const runXAIAnalysis = async (userPrompt) => {
  const client = getXAIClient();
  const modelName = process.env.XAI_MODEL || 'grok-4.20-reasoning';

  const completion = await client.chat.completions.create({
    model: modelName,
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = completion.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(cleanModelOutput(text));
  const sanitized = sanitizeAnalysisResponse(parsed);
  return { success: true, data: sanitized, rawResponse: text, modelUsed: modelName, providerUsed: 'xai' };
};

const runGeminiTextGeneration = async (prompt) => {
  const modelNames = getFallbackModelNames();
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      setActiveGeminiModel(modelName);
      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return {
        success: true,
        text: cleanModelOutput(text),
        providerUsed: 'gemini',
        modelUsed: modelName,
        mode: 'ai',
      };
    } catch (error) {
      lastError = error;
      const message = String(error.message || '');
      const isModelNotFound = message.includes('is not found for API version') || message.includes('404 Not Found');
      if (!isModelNotFound) {
        throw new Error(`Gemini report generation failed: ${message}`);
      }
    }
  }

  throw new Error(`Gemini report generation failed: ${lastError?.message || 'No supported Gemini model found.'}`);
};

const runOpenAITextGeneration = async (userPrompt) => {
  const client = getOpenAIClient();
  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const completion = await client.chat.completions.create({
    model: modelName,
    temperature: 0.2,
    messages: [
      { role: 'system', content: REPORT_DRAFT_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = completion.choices?.[0]?.message?.content || '';
  return {
    success: true,
    text: cleanModelOutput(text),
    providerUsed: 'openai',
    modelUsed: modelName,
    mode: 'ai',
  };
};

const runXAITextGeneration = async (userPrompt) => {
  const client = getXAIClient();
  const modelName = process.env.XAI_MODEL || 'grok-4.20-reasoning';

  const completion = await client.chat.completions.create({
    model: modelName,
    temperature: 0.2,
    messages: [
      { role: 'system', content: REPORT_DRAFT_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = completion.choices?.[0]?.message?.content || '';
  return {
    success: true,
    text: cleanModelOutput(text),
    providerUsed: 'xai',
    modelUsed: modelName,
    mode: 'ai',
  };
};

const runLocalFallbackReportDraft = (extractedText, analysisData, reason = '') => {
  const improvements = Array.isArray(analysisData?.improvements) ? analysisData.improvements : [];
  const mistakes = Array.isArray(analysisData?.mistakes) ? analysisData.mistakes : [];
  const strengths = Array.isArray(analysisData?.strengths) ? analysisData.strengths : [];
  const referencesBlock = '1. To be added\n2. To be added';
  const githubPlaceholder = 'Repository Name: To be added\nGitHub Link: To be added';
  const summarySnippet = String(extractedText || '').replace(/\s+/g, ' ').slice(0, 1200);

  const text = `1. Project Overview
This report is generated in local mode and arranged as per required LPU structure.
Objective: Describe what problem is solved and why this OS-lab implementation is relevant.
Expected Outcome: Describe measurable outcome (for example execution result, optimization result, or validation output).

2. Module-Wise Breakdown
- Module 1 (Input/Validation): Purpose, input format, validation rules, and failure cases.
- Module 2 (Core Processing): Algorithm/logic used, internal steps, and complexity note.
- Module 3 (Output/Reporting): Output format, interpretation, and storage/submission behavior.

3. Functionalities
- Feature 1: Describe trigger, processing path, and output.
- Feature 2: Describe edge-case handling and expected behavior.
- Feature 3: Describe integration with upload, analysis, and report lifecycle.

4. Technology Used (Programming Languages, Libraries and Tools, Other Tools)
- Programming Languages: Mention language and why it was chosen.
- Libraries and Tools: Mention package/tool + purpose.
- Other Tools: Mention version control, deployment/runtime tooling.

5. Flow Diagram
Flow description: Start -> Input collection -> Pre-check/Validation -> Core processing -> Score/Result generation -> Export/Submission -> End.
Add decision points where validation fails and show retry path.

6. Revision Tracking on GitHub (Repository Name + GitHub Link)
${githubPlaceholder}
Commit Guidance:
- Commit 1: Initial project setup
- Commit 2: Core feature implementation
- Commit 3: Bug fixes/refactor + final documentation

7. Conclusion and Future Scope
Conclusion: Summarize achieved objectives and quality of output.
Future Scope: Add 2-3 practical enhancements such as automation, better error handling, and richer analytics.

8. References
${referencesBlock}

9. Appendix A: AI-Generated Project Elaboration/Breakdown Report
Key strengths observed:
${strengths.length ? strengths.map((s, i) => `${i + 1}. ${s}`).join('\n') : '1. To be added'}

10. Appendix B: Problem Statement
Problem Statement: To be added with precise scope, constraints, and expected output.

11. Appendix C: Solution/Code
Code Template:

\
// Add your main implementation code here
function main() {
  // TODO
}

main();
\

Additional Notes from current analysis:
Improvements:
${improvements.length ? improvements.map((s, i) => `${i + 1}. ${s}`).join('\n') : '1. To be added'}

Mistakes to fix:
${mistakes.length ? mistakes.map((s, i) => `${i + 1}. ${s}`).join('\n') : '1. To be added'}

Extracted content snippet:
${summarySnippet || 'No content available.'}`;

  return {
    success: true,
    text,
    providerUsed: 'local',
    modelUsed: 'local-draft-v1',
    mode: 'local',
    fallbackReason: reason,
  };
};

const analyseReport = async (extractedText) => {
  // Truncate text to keep prompt size manageable across providers.
  const maxLength = 30000;
  const truncatedText = extractedText.length > maxLength
    ? extractedText.substring(0, maxLength) + '\n\n[Content truncated due to length...]'
    : extractedText;

  const prompt = `${SYSTEM_PROMPT}

Here is the student's OS lab report content:

---
${truncatedText}
---

Provide your evaluation as a JSON object only.`;

  const userPrompt = `Here is the student's OS lab report content:

---
${truncatedText}
---

Provide your evaluation as a JSON object only.`;

  if (isForceLocalEnabled()) {
    return runLocalFallbackAnalysis(truncatedText, 'AI_FORCE_LOCAL is enabled.');
  }

  const providerOrder = buildProviderOrder();
  const enableLocalFallback = String(process.env.AI_LOCAL_FALLBACK || 'true').toLowerCase() !== 'false';
  if (!providerOrder.length) {
    if (enableLocalFallback) {
      return runLocalFallbackAnalysis(truncatedText, 'No AI provider configured.');
    }
    throw new Error('No AI provider configured. Set AI_PROVIDER plus one of XAI_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in environment variables.');
  }

  let lastError = null;

  for (const provider of providerOrder) {
    try {
      if (provider === 'xai') {
        const aiResult = await runXAIAnalysis(userPrompt);
        return { ...aiResult, analysisMode: 'ai', fallbackReason: '' };
      }
      if (provider === 'openai') {
        const aiResult = await runOpenAIAnalysis(userPrompt);
        return { ...aiResult, analysisMode: 'ai', fallbackReason: '' };
      }
      if (provider === 'gemini') {
        const aiResult = await runGeminiAnalysis(prompt);
        return { ...aiResult, analysisMode: 'ai', fallbackReason: '' };
      }
    } catch (error) {
      lastError = error;
      const message = String(error.message || '');
      console.warn(`AI provider failed (${provider}): ${message}. Trying next provider if available.`);
    }
  }

  if (enableLocalFallback) {
    const reason = String(lastError?.message || 'No configured AI provider is available.');
    console.warn(`Using local fallback analysis because AI provider failed: ${reason}`);
    return runLocalFallbackAnalysis(truncatedText, reason);
  }

  throw new Error(`AI analysis failed: ${lastError?.message || 'No configured AI provider is available.'}`);
};

const generateFormattedReport = async (extractedText, analysisData = {}) => {
  const maxLength = 30000;
  const truncatedText = String(extractedText || '').length > maxLength
    ? String(extractedText || '').substring(0, maxLength) + '\n\n[Content truncated due to length...]'
    : String(extractedText || '');

  const userPrompt = `Use the following extracted report content and analysis summary to create a complete report in the required LPU format.

Extracted content:
---
${truncatedText}
---

Analysis summary:
${JSON.stringify({
    totalScore: analysisData?.totalScore,
    missingSections: analysisData?.missingSections || [],
    improvements: analysisData?.improvements || [],
    strengths: analysisData?.strengths || [],
    overallFeedback: analysisData?.overallFeedback || '',
  }, null, 2)}

Generate the final arranged report now.`;

  const providerOrder = buildProviderOrder();
  let lastError = null;
  const allowLocalDraftFallback = String(process.env.AI_LOCAL_FALLBACK_GENERATION || 'false').toLowerCase() === 'true';

  if (isForceLocalEnabled()) {
    return runLocalFallbackReportDraft(truncatedText, analysisData, 'AI_FORCE_LOCAL is enabled.');
  }

  if (!providerOrder.length) {
    if (allowLocalDraftFallback) {
      return runLocalFallbackReportDraft(truncatedText, analysisData, 'No AI provider configured for report generation.');
    }
    throw new Error('No AI provider configured for report generation. Configure xAI/OpenAI/Gemini credentials.');
  }

  for (const provider of providerOrder) {
    try {
      if (provider === 'xai') {
        return await runXAITextGeneration(userPrompt);
      }
      if (provider === 'openai') {
        return await runOpenAITextGeneration(userPrompt);
      }
      if (provider === 'gemini') {
        const prompt = `${REPORT_DRAFT_SYSTEM_PROMPT}\n\n${userPrompt}`;
        return await runGeminiTextGeneration(prompt);
      }
    } catch (error) {
      lastError = error;
      console.warn(`Report generation failed (${provider}): ${error.message}`);
    }
  }

  if (allowLocalDraftFallback) {
    return runLocalFallbackReportDraft(truncatedText, analysisData, String(lastError?.message || 'AI generation unavailable'));
  }

  throw new Error(`AI report generation failed: ${String(lastError?.message || 'No configured AI provider is available.')}`);
};

const sanitizeAnalysisResponse = (data) => {
  return {
    totalScore: clamp(data.totalScore, 0, 100),
    sectionScores: {
      projectOverview: clamp(data.sectionScores?.projectOverview, 0, 10),
      moduleBreakdown: clamp(data.sectionScores?.moduleBreakdown, 0, 10),
      functionalities: clamp(data.sectionScores?.functionalities, 0, 10),
      technologyUsed: clamp(data.sectionScores?.technologyUsed, 0, 10),
      flowDiagram: clamp(data.sectionScores?.flowDiagram, 0, 10),
      githubTracking: clamp(data.sectionScores?.githubTracking, 0, 10),
      conclusion: clamp(data.sectionScores?.conclusion, 0, 10),
      references: clamp(data.sectionScores?.references, 0, 5),
      appendixAI: clamp(data.sectionScores?.appendixAI, 0, 10),
      problemStatement: clamp(data.sectionScores?.problemStatement, 0, 5),
      solutionCode: clamp(data.sectionScores?.solutionCode, 0, 10),
    },
    missingSections: Array.isArray(data.missingSections) ? data.missingSections : [],
    mistakes: Array.isArray(data.mistakes) ? data.mistakes : [],
    aiUsagePercentage: clamp(data.aiUsagePercentage, 0, 100),
    aiUsageDetails: String(data.aiUsageDetails || ''),
    improvements: Array.isArray(data.improvements) ? data.improvements : [],
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    overallFeedback: String(data.overallFeedback || ''),
    plagiarismRisk: ['Low', 'Medium', 'High'].includes(data.plagiarismRisk) ? data.plagiarismRisk : 'Low',
    formatCompliance: clamp(data.formatCompliance, 0, 100),
  };
};

module.exports = { analyseReport, generateFormattedReport };
