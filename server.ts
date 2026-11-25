import 'dotenv/config';
import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import {GoogleGenAI, ThinkingLevel, Type} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const CRAFT_LABELS: Record<string, string> = {
  artesanato: 'Artesanato',
  'jogos-brinquedos': 'Jogos e Brinquedos',
  decoracao: 'Decoração',
  instrumentos: 'Instrumentos',
};

function parseDataUrl(
  dataUrl: string,
): {mimeType: string; base64Data: string} | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return null;
  return {mimeType: match[1], base64Data: match[2]};
}

function formatGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  if (
    raw.includes('503') ||
    raw.includes('UNAVAILABLE') ||
    raw.includes('high demand')
  ) {
    return 'O serviço de IA está temporariamente com alta demanda. Aguarde alguns segundos e tente novamente.';
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'Limite temporário de consultas à IA atingido. Tente novamente em instantes.';
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED')) {
    return 'Chave da API Gemini inválida ou sem permissão no servidor.';
  }
  return raw || 'Erro inesperado ao consultar a IA.';
}

function parseJsonPayload<T>(rawText: string | undefined): T {
  const cleaned = (rawText ?? '{}')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned || '{}') as T;
}

function isRetryableGeminiError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  return (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('ECONNRESET') ||
    msg.includes('fetch failed') ||
    msg.includes('404') ||
    msg.includes('NOT_FOUND')
  );
}

async function generateWithModelFallback(params: {
  contents: Parameters<typeof ai.models.generateContent>[0]['contents'];
  systemInstruction?: string;
  responseSchema: NonNullable<
    Parameters<typeof ai.models.generateContent>[0]['config']
  >['responseSchema'];
}) {
  const candidates: Array<{
    model: string;
    thinkingLevel?: ThinkingLevel;
    attempts: number;
  }> = [
    {model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW, attempts: 2},
    {model: 'gemini-3.1-flash-lite', attempts: 2},
  ];

  let lastError: unknown;
  const attemptErrors: string[] = [];
  for (const candidate of candidates) {
    for (let attempt = 1; attempt <= candidate.attempts; attempt++) {
      try {
        return await ai.models.generateContent({
          model: candidate.model,
          contents: params.contents,
          config: {
            ...(params.systemInstruction
              ? {systemInstruction: params.systemInstruction}
              : {}),
            responseMimeType: 'application/json',
            ...(candidate.thinkingLevel
              ? {thinkingConfig: {thinkingLevel: candidate.thinkingLevel}}
              : {}),
            responseSchema: params.responseSchema,
          },
        });
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err || '');
        attemptErrors.push(`${candidate.model}#${attempt}: ${msg.slice(0, 180)}`);
        if (!isRetryableGeminiError(err)) {
          const wrapped = new Error(`${msg} | attempts=${attemptErrors.join(' ; ')}`);
          throw wrapped;
        }
        if (attempt < candidate.attempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 600));
        }
      }
    }
  }
  console.error('[Gemini Fallback Failed]', attemptErrors.join(' | '));
  throw lastError;
}

function getGeminiHttpStatus(err: unknown): number {
  const raw = err instanceof Error ? err.message : String(err || '');
  if (
    raw.includes('503') ||
    raw.includes('UNAVAILABLE') ||
    raw.includes('high demand')
  ) {
    return 503;
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 429;
  }
  return 500;
}

async function startServer() {
  const app = express();
  app.use(express.json({limit: '12mb'}));

  app.get('/api/health', (_req, res) => {
    res.json({ok: true});
  });

  app.post('/api/before-after-ai', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error:
            'Chave da API Gemini não configurada no servidor (GEMINI_API_KEY).',
        });
      }

      const {
        imageDataUrl,
        material = 'Plástico PET',
        craftCategory = 'artesanato',
        title = '',
        description = '',
        allowTextOnly = false,
      } = req.body as {
        imageDataUrl?: string;
        material?: string;
        craftCategory?: string;
        title?: string;
        description?: string;
        allowTextOnly?: boolean;
      };

      const hasImage =
        typeof imageDataUrl === 'string' && imageDataUrl.trim().length > 0;

      if (!hasImage && !allowTextOnly) {
        return res.status(400).json({
          error: 'Envie a foto do Antes (material/sucata) para gerar com IA.',
        });
      }

      const parsedImage = hasImage ? parseDataUrl(imageDataUrl!) : null;
      if (hasImage && !parsedImage) {
        return res.status(400).json({
          error: 'Formato de imagem inválido. Envie uma foto JPG, PNG ou WebP.',
        });
      }

      if (!hasImage && !material.trim() && !description.trim() && !title.trim()) {
        return res.status(400).json({
          error:
            'Envie uma foto ou informe o material bruto para a IA gerar as 3 sugestões.',
        });
      }

      const categoryLabel =
        craftCategory === 'auto'
          ? 'Escolha automaticamente as melhores entre: Artesanato, Jogos e Brinquedos, Decoração ou Instrumentos'
          : CRAFT_LABELS[craftCategory] || 'Artesanato';

      const prompt = [
        parsedImage
          ? 'Analise a foto enviada do material bruto / reciclável / sucata (Antes).'
          : 'Analise o material bruto / reciclável informado pelo usuário para reutilização criativa.',
        `Categoria desejada: ${categoryLabel}.`,
        `Material base informado: ${material}.`,
        title ? `Título ou ideia inicial: ${title}.` : '',
        description ? `Observação/descrição do usuário: ${description}.` : '',
        '',
        'Responda em português do Brasil (pt-BR) com:',
        '1. suggestedTitle: um título curto e prático para a transformação principal.',
        '2. identifiedMaterial: descrição clara do material bruto identificado (ex.: 2 garrafas PET transparentes de 2L, caixas de papelão e tampinhas coloridas, etc.).',
        '3. preparationTip: dica rápida e segura de higienização, secagem ou preparo desse material bruto antes de começar.',
        '4. suggestions: EXATAMENTE 3 sugestões distintas, criativas, úteis e realistas de peças que podem ser feitas reutilizando esse material bruto. Cada uma das 3 sugestões deve ter: title, suggestedCategory ("artesanato", "jogos-brinquedos", "decoracao" ou "instrumentos"), difficulty ("Fácil" ou "Intermediário"), estimatedTime (ex.: "25 min"), summary (1 frase prática explicando o resultado), extraMaterials (3 a 5 itens simples) e steps (4 a 6 passos claros, práticos e seguros para montar aquela peça específica, sem numeração no início de cada string).',
        '5. steps: o passo a passo completo (5 a 7 etapas em ordem lógica, sem numeração no texto pois a UI já numera) de como fazer a primeira/melhor sugestão com segurança.',
      ]
        .filter(Boolean)
        .join('\n');

      const parts: Array<
        {inlineData: {mimeType: string; data: string}} | {text: string}
      > = parsedImage
        ? [
            {
              inlineData: {
                mimeType: parsedImage.mimeType,
                data: parsedImage.base64Data,
              },
            },
            {text: prompt},
          ]
        : [{text: prompt}];

      const response = await generateWithModelFallback({
        contents: {parts},
        systemInstruction:
          'Você é um mestre em upcycling, sustentabilidade e arte com sucata. Sempre forneça instruções práticas, seguras (especialmente ao lidar com cortes/bordas) e EXATAMENTE 3 sugestões distintas e completas em português do Brasil.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: {type: Type.STRING},
            identifiedMaterial: {type: Type.STRING},
            preparationTip: {type: Type.STRING},
            steps: {
              type: Type.ARRAY,
              items: {type: Type.STRING},
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {type: Type.STRING},
                  suggestedCategory: {type: Type.STRING},
                  difficulty: {type: Type.STRING},
                  estimatedTime: {type: Type.STRING},
                  summary: {type: Type.STRING},
                  extraMaterials: {
                    type: Type.ARRAY,
                    items: {type: Type.STRING},
                  },
                  steps: {
                    type: Type.ARRAY,
                    items: {type: Type.STRING},
                  },
                },
                required: [
                  'title',
                  'suggestedCategory',
                  'difficulty',
                  'estimatedTime',
                  'summary',
                  'extraMaterials',
                  'steps',
                ],
              },
            },
          },
          required: [
            'suggestedTitle',
            'identifiedMaterial',
            'preparationTip',
            'steps',
            'suggestions',
          ],
        },
      });

      const parsed = parseJsonPayload<{
        suggestedTitle?: string;
        identifiedMaterial?: string;
        preparationTip?: string;
        steps?: string[];
        suggestions?: Array<{
          title: string;
          suggestedCategory?: string;
          difficulty: string;
          estimatedTime: string;
          summary: string;
          extraMaterials?: string[];
          steps?: string[];
        }>;
      }>(response.text);

      const validCategories = new Set([
        'artesanato',
        'jogos-brinquedos',
        'decoracao',
        'instrumentos',
      ]);

      const suggestions = (parsed.suggestions || []).slice(0, 3).map((s) => ({
        title: s.title || 'Projeto criativo',
        difficulty: s.difficulty || 'Fácil',
        estimatedTime: s.estimatedTime || '25 min',
        summary: s.summary || '',
        extraMaterials: Array.isArray(s.extraMaterials) ? s.extraMaterials : [],
        steps: Array.isArray(s.steps) ? s.steps : [],
        suggestedCategory: validCategories.has(s.suggestedCategory || '')
          ? (s.suggestedCategory as
              | 'artesanato'
              | 'jogos-brinquedos'
              | 'decoracao'
              | 'instrumentos')
          : craftCategory !== 'auto' && validCategories.has(craftCategory)
            ? (craftCategory as
                | 'artesanato'
                | 'jogos-brinquedos'
                | 'decoracao'
                | 'instrumentos')
            : 'artesanato',
      }));
      const steps =
        parsed.steps && parsed.steps.length > 0
          ? parsed.steps
          : suggestions[0]?.steps || [];

      return res.json({
        suggestedTitle: parsed.suggestedTitle || suggestions[0]?.title || '',
        identifiedMaterial: parsed.identifiedMaterial || material,
        preparationTip: parsed.preparationTip || '',
        steps,
        suggestions,
      });
    } catch (err) {
      return res
        .status(getGeminiHttpStatus(err))
        .json({error: formatGeminiError(err)});
    }
  });

  app.post('/api/triage-ai', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error:
            'Chave da API Gemini não configurada no servidor (GEMINI_API_KEY).',
        });
      }

      const {imageDataUrl} = req.body as {imageDataUrl?: string};
      if (!imageDataUrl || typeof imageDataUrl !== 'string') {
        return res.status(400).json({
          error: 'Envie ou capture uma foto para identificar o material.',
        });
      }

      const parsedImage = parseDataUrl(imageDataUrl);
      if (!parsedImage) {
        return res.status(400).json({
          error: 'Formato de imagem inválido.',
        });
      }

      const response = await generateWithModelFallback({
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: parsedImage.mimeType,
                data: parsedImage.base64Data,
              },
            },
            {
              text: [
                'Identifique o resíduo ou material mostrado na foto para triagem de reciclagem.',
                'Classifique no catalogId mais adequado entre:',
                '- tr-pet (Garrafas PET e plásticos recicláveis)',
                '- tr-alu (Latas de alumínio, aço ou metais)',
                '- tr-glass (Potes e garrafas de vidro)',
                '- tr-cardboard (Caixas de papelão, papéis limpos)',
                '- tr-organic (Cascas, talos, borra de café, matéria orgânica)',
                '- tr-dirty-paper (Guardanapos engordurados, espelho quebrado, rejeito ou sucata mista)',
                'Responda em português do Brasil com catalogId, detectedLabel (nome curto do objeto visto) e quickTip (1 frase prática de preparo/descarte).',
              ].join('\n'),
            },
          ],
        },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            catalogId: {type: Type.STRING},
            detectedLabel: {type: Type.STRING},
            quickTip: {type: Type.STRING},
          },
          required: ['catalogId', 'detectedLabel', 'quickTip'],
        },
      });

      const parsed = parseJsonPayload<{
        catalogId?: string;
        detectedLabel?: string;
        quickTip?: string;
      }>(response.text);

      const validIds = new Set([
        'tr-pet',
        'tr-alu',
        'tr-glass',
        'tr-cardboard',
        'tr-organic',
        'tr-dirty-paper',
      ]);

      return res.json({
        catalogId: validIds.has(parsed.catalogId || '')
          ? parsed.catalogId
          : 'tr-pet',
        detectedLabel: parsed.detectedLabel || 'Material identificado',
        quickTip: parsed.quickTip || '',
      });
    } catch (err) {
      return res
        .status(getGeminiHttpStatus(err))
        .json({error: formatGeminiError(err)});
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({error: 'Rota da API não encontrada.'});
  });

  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (req.path.startsWith('/api')) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao processar requisição na API.';
        return res.status(400).json({error: message});
      }
      return next(err);
    },
  );

  if (isProduction) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReciclaOQ server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
