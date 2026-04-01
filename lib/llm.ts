import type { ChatMessage } from '@/types';

export async function callLLM(messages: ChatMessage[], system?: string): Promise<string> {
  const provider = process.env.LLM_PROVIDER || 'anthropic';
  const model = process.env.LLM_MODEL || 'claude-opus-4-5';

  if (provider === 'openai') {
    return callOpenAI(messages, system, model);
  }
  return callAnthropic(messages, system, model);
}

export async function callLLMJson<T>(
  messages: ChatMessage[],
  schema: Record<string, unknown>,
  schemaName: string,
  system?: string,
): Promise<T> {
  const provider = process.env.LLM_PROVIDER || 'anthropic';
  const model = process.env.LLM_MODEL || 'claude-opus-4-5';

  if (provider === 'openai') {
    return callOpenAIJson<T>(messages, schema, schemaName, system, model);
  }
  return callAnthropicJson<T>(messages, schema, system, model);
}

export async function callLLMStream(messages: ChatMessage[], system?: string): Promise<ReadableStream<Uint8Array>> {
  const provider = process.env.LLM_PROVIDER || 'anthropic';
  const model = process.env.LLM_MODEL || 'claude-opus-4-5';

  if (provider === 'openai') {
    return callOpenAIStream(messages, system, model);
  }
  return callAnthropicStream(messages, system, model);
}

// ── Anthropic ────────────────────────────────────────────────────────────────

async function callAnthropic(messages: ChatMessage[], system: string | undefined, model: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const body: Record<string, unknown> = { model, max_tokens: 1024, messages };
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

async function callAnthropicJson<T>(
  messages: ChatMessage[],
  schema: Record<string, unknown>,
  system: string | undefined,
  model: string,
): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const body: Record<string, unknown> = {
    model,
    max_tokens: 1024,
    messages,
    output_config: { format: { type: 'json_schema', schema } },
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
  return JSON.parse(data.content[0].text) as T;
}

async function callAnthropicStream(messages: ChatMessage[], system: string | undefined, model: string): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const body: Record<string, unknown> = { model, max_tokens: 1024, messages, stream: true };
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

  return sseToTextStream(res.body!, (event) => {
    if (event.type === 'content_block_delta') {
      const delta = (event as { delta?: { type?: string; text?: string } }).delta;
      if (delta?.type === 'text_delta' && delta.text) return delta.text;
    }
    return null;
  });
}

// ── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAIJson<T>(
  messages: ChatMessage[],
  schema: Record<string, unknown>,
  schemaName: string,
  system: string | undefined,
  model: string,
): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const body: Record<string, unknown> = {
    model,
    max_output_tokens: 1024,
    input: buildOpenAIInput(messages),
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        schema,
        strict: true,
      },
    },
  };
  if (system) body.instructions = system;

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error('[OpenAI] error', res.status, errBody);
    throw new Error(`OpenAI API ${res.status}: ${errBody}`);
  }

  const data = await res.json() as { output: { content: { text: string }[] }[] };
  return JSON.parse(data.output[0].content[0].text) as T;
}

function buildOpenAIInput(messages: ChatMessage[]): { role: string; content: string }[] | string {
  if (messages.length === 0) return '대화를 시작해주세요.';
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

async function callOpenAI(messages: ChatMessage[], system: string | undefined, model: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const body: Record<string, unknown> = {
    model,
    max_output_tokens: 1024,
    input: buildOpenAIInput(messages),
  };
  if (system) body.instructions = system;

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error('[OpenAI] error', res.status, errBody);
    throw new Error(`OpenAI API ${res.status}: ${errBody}`);
  }

  const data = await res.json() as { output: { content: { text: string }[] }[] };
  return data.output[0].content[0].text;
}

async function callOpenAIStream(messages: ChatMessage[], system: string | undefined, model: string): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const body: Record<string, unknown> = {
    model,
    max_output_tokens: 1024,
    stream: true,
    input: buildOpenAIInput(messages),
  };
  if (system) body.instructions = system;

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error('[OpenAI] error', res.status, errBody);
    throw new Error(`OpenAI API ${res.status}: ${errBody}`);
  }

  return sseToTextStream(res.body!, (event) => {
    if (event.type === 'response.output_text.delta') {
      const delta = (event as { delta?: string }).delta;
      if (delta) return delta;
    }
    return null;
  });
}

// ── SSE parser ───────────────────────────────────────────────────────────────

function sseToTextStream(
  source: ReadableStream<Uint8Array>,
  extractText: (event: Record<string, unknown>) => string | null,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';

  const reader = source.getReader();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const event = JSON.parse(data) as Record<string, unknown>;
              const text = extractText(event);
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // ignore malformed lines
            }
          }
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
