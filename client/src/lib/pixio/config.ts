import { z } from 'zod';

const ColorSchema = z.string().regex(/^\d+ \d+ \d+$/);

const BrandingSchema = z.object({
  appName: z.string(),
  logoUrl: z.string(),
  colors: z.object({
    primary: ColorSchema,
    secondary: ColorSchema,
    accent: ColorSchema,
  }),
});

const FeatureSchema = z.object({
  enabled: z.boolean(),
  widgets: z.array(z.string()).optional(),
});

const LayoutSchema = z.object({
  sidebarPosition: z.enum(['left', 'right']),
  sidebarCollapsible: z.boolean(),
});

const ConfigSchema = z.object({
  version: z.string(),
  branding: BrandingSchema,
  features: z.record(z.string(), FeatureSchema),
  layout: LayoutSchema,
});

export type PixioConfig = z.infer<typeof ConfigSchema>;

let cachedConfig: PixioConfig | null = null;

export async function loadConfig(): Promise<PixioConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const response = await fetch('/config/pixio.config.json');
  const data = await response.json();
  cachedConfig = ConfigSchema.parse(data);
  return cachedConfig;
}

export function getConfig(): PixioConfig | null {
  return cachedConfig;
}
