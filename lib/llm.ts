import type { ChatMessage } from '@/types';

export async function callLLM(messages: ChatMessage[], system?: string): Promise<string> {
  const provider = process.env.LLM_PROVIDER || 'anthropic';
  const model = process.env.LLM_MODEL || 'claude-opus-4-5';

  if (provider === 'openai') {
    return callOpenAI(messages, system, model);
  }
  return callAnthropic(messages, system, model);
}

async function callAnthropic(messages: ChatMessage[], system: string | undefined, model: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const body: Record<string, unknown> = {
    model,
    max_tokens: 1024,
    messages,
  };
  if (system) body.system = system;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error('[Anthropic] error', res.status, errBody);
    throw new Error(`Anthropic API ${res.status}: ${errBody}`);
  }

  const data = await res.json() as { content: { text: string }[] };
  return data.content[0].text;
}

async function callOpenAI(messages: ChatMessage[], system: string | undefined, model: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const openaiMessages: { role: string; content: string }[] = [];
  if (system) openaiMessages.push({ role: 'system', content: system });
  openaiMessages.push(...messages.map(m => ({ role: m.role, content: m.content })));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, max_completion_tokens: 1024, messages: openaiMessages }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error('[OpenAI] error', res.status, errBody);
    throw new Error(`OpenAI API ${res.status}: ${errBody}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}
