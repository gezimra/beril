import { z } from "zod";

const emptyToUndefined = <T>(value: T) => (value === "" ? undefined : value);

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().optional(),
);

const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().min(1).optional(),
);

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalText,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: optionalText,
  NEXT_PUBLIC_WHATSAPP_NUMBER: optionalText,
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optionalText,
  SUPABASE_DB_URL: optionalUrl,
  RESEND_API_KEY: optionalText,
  POSTMARK_SERVER_TOKEN: optionalText,
});

const clientParsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
});

const serverParsed = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  POSTMARK_SERVER_TOKEN: process.env.POSTMARK_SERVER_TOKEN,
});

const clientFallback = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: undefined,
  NEXT_PUBLIC_WHATSAPP_NUMBER: undefined,
};

const serverFallback = {
  SUPABASE_SERVICE_ROLE_KEY: undefined,
  SUPABASE_DB_URL: undefined,
  RESEND_API_KEY: undefined,
  POSTMARK_SERVER_TOKEN: undefined,
};

const client = clientParsed.success ? clientParsed.data : clientFallback;
const server = serverParsed.success ? serverParsed.data : serverFallback;

export const env = {
  client: {
    siteUrl: client.NEXT_PUBLIC_SITE_URL,
    supabaseUrl: client.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: client.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    gaMeasurementId: client.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    whatsappNumber: client.NEXT_PUBLIC_WHATSAPP_NUMBER,
  },
  server: {
    supabaseServiceRoleKey: server.SUPABASE_SERVICE_ROLE_KEY,
    supabaseDbUrl: server.SUPABASE_DB_URL,
    resendApiKey: server.RESEND_API_KEY,
    postmarkServerToken: server.POSTMARK_SERVER_TOKEN,
  },
};

export const hasSupabaseClientEnv =
  Boolean(env.client.supabaseUrl) && Boolean(env.client.supabaseAnonKey);

export const hasSupabaseServiceEnv =
  Boolean(env.client.supabaseUrl) && Boolean(env.server.supabaseServiceRoleKey);

export const hasAnalyticsEnv = Boolean(env.client.gaMeasurementId);
