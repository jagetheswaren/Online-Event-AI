import { AI_PLAYBOOKS, EVENT_AI_MASTER_PROMPT } from '@/constants/aiPlaybooks';

const toLabel = (placeholder: string) =>
  placeholder
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

const fillTemplate = (template: string, values: Record<string, string>) => {
  return template.replace(/{{(.*?)}}/g, (_, key: string) => {
    const normalized = key.trim();
    return values[normalized] || `<${toLabel(normalized)}>`;
  });
};

export const buildPlaybookPrompt = (playbookId: string, values: Record<string, string> = {}) => {
  const playbook = AI_PLAYBOOKS.find((item) => item.id === playbookId);
  if (!playbook) return '';

  const userPrompt = fillTemplate(playbook.userPromptTemplate, values);

  return [
    `Global Prompt: ${EVENT_AI_MASTER_PROMPT}`,
    '',
    `System Prompt: ${playbook.systemPrompt}`,
    '',
    userPrompt,
    '',
    'Output requirements:',
    '- Return valid JSON only.',
    '- Do not use markdown.',
    '- No text outside JSON.',
    '- Use clear keys and structured arrays/objects.',
  ].join('\n');
};
