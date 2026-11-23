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

async function startServer() {
  const app = express();
  app.use(express.json({limit: '12mb'}));

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
      } = req.body as {
        imageDataUrl?: string;
        material?: string;
        craftCategory?: string;
        title?: string;
        description?: string;
      };

      if (!imageDataUrl || typeof imageDataUrl !== 'string') {
        return res.status(400).json({
          error: 'Envie a foto do Antes (material/sucata) para gerar com IA.',
        });
      }

      const parsedImage = parseDataUrl(imageDataUrl);
      if (!parsedImage) {
        return res.status(400).json({
          error: 'Formato de imagem inválido. Envie uma foto JPG, PNG ou WebP.',
        });
      }

      const categoryLabel =
        craftCategory === 'auto'
          ? 'Escolha automaticamente a melhor entre: Artesanato, Jogos e Brinquedos, Decoração ou Instrumentos'
          : CRAFT_LABELS[craftCategory] || 'Artesanato';

      const prompt = [
        'Analise a foto enviada do material bruto / reciclável / sucata (Antes).',
        `Categoria desejada: ${categoryLabel}.`,
        `Material base informado: ${material}.`,
        title ? `Título ou ideia inicial: ${title}.` : '',
        description ? `Observação do usuário: ${description}.` : '',
        '',
        'Responda em português do Brasil (pt-BR) com:',
        '1. suggestedTitle: um título curto e prático para a transformação principal.',
        '2. identifiedMaterial: descrição clara do material bruto identificado na foto (ex.: 2 garrafas PET transparentes de 2L, tampa de papelão, etc.).',
        '3. preparationTip: dica rápida e segura de higienização, secagem ou preparo desse material bruto antes de começar.',
        '4. suggestions: EXATAMENTE 3 sugestões criativas, úteis e realistas de peças que podem ser feitas reutilizando esse material bruto (cada sugestão deve ter title, suggestedCategory ("artesanato", "jogos-brinquedos", "decoracao" ou "instrumentos"), difficulty ("Fácil" ou "Intermediário"), estimatedTime (ex.: "25 min"), summary (1 frase prática), extraMaterials (3 a 5 itens simples) e steps (4 a 6 passos claros e seguros para fazer aquela peça)).',
        '5. steps: o passo a passo completo (5 a 7 etapas em ordem lógica, sem numeração no texto pois a UI já numera) de como fazer a primeira/melhor sugestão com segurança.',
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: parsedImage.mimeType,
                data: parsedImage.base64Data,
              },
            },
            {text: prompt},
          ],
        },
        config: {
          systemInstruction:
            'Você é um mestre em upcycling, sustentabilidade e arte com sucata. Sempre forneça instruções práticas, seguras (especialmente ao lidar com cortes/bordas) e exatas 3 sugestões criativas em português do Brasil.',
          responseMimeType: 'application/json',
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
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
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as {
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
      };

      const validCategories = new Set([
        'artesanato',
        'jogos-brinquedos',
        'decoracao',
        'instrumentos',
      ]);

      const suggestions = (parsed.suggestions || []).slice(0, 3).map((s) => ({
        ...s,
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
        suggestedTitle: parsed.suggestedTitle || '',
        identifiedMaterial: parsed.identifiedMaterial || material,
        preparationTip: parsed.preparationTip || '',
        steps,
        suggestions,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro inesperado ao consultar a IA.';
      return res.status(500).json({error: message});
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

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
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
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              catalogId: {type: Type.STRING},
              detectedLabel: {type: Type.STRING},
              quickTip: {type: Type.STRING},
            },
            required: ['catalogId', 'detectedLabel', 'quickTip'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as {
        catalogId?: string;
        detectedLabel?: string;
        quickTip?: string;
      };

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
      const message =
        err instanceof Error
          ? err.message
          : 'Erro ao identificar o material na foto.';
      return res.status(500).json({error: message});
    }
  });

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
