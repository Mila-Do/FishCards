import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  FlashcardProposal,
  GenerationDTO,
  GenerationProposalsResponse,
  PaginatedGenerationErrorLogsResponse,
  PaginatedGenerationsResponse,
} from "../../types";
import { flashcardProposalsSchema } from "../validation/generation";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export class AiApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, options: { code: string; status: number; details?: Record<string, unknown> }) {
    super(message);
    this.name = "AiApiError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export function hashSourceText(sourceText: string) {
  return createHash("sha256").update(sourceText, "utf8").digest("hex");
}

function extractJsonObjectMaybe(text: string) {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  return text.slice(firstBrace, lastBrace + 1);
}

function normalizeProposals(items: unknown): FlashcardProposal[] {
  const normalized = Array.isArray(items)
    ? items
    : typeof items === "object" && items !== null && "flashcards" in items
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (items as any).flashcards
      : null;

  const proposals = (Array.isArray(normalized) ? normalized : []).map((p) => {
    if (!p || typeof p !== "object") return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maybe = p as any;
    const front = typeof maybe.front === "string" ? maybe.front.trim() : "";
    const back = typeof maybe.back === "string" ? maybe.back.trim() : "";
    if (!front || !back) return null;
    return { front, back, source: "ai" as const };
  });

  const filtered = proposals.filter(Boolean) as FlashcardProposal[];
  return flashcardProposalsSchema.parse(filtered);
}

export async function generateFlashcardsFromText(options: {
  sourceText: string;
  model: string;
  apiKey: string;
  timeoutMs?: number;
}): Promise<{ proposals: FlashcardProposal[]; generationDurationMs: number; rawModelResponse: unknown }> {
  const { sourceText, model, apiKey } = options;
  const timeoutMs = options.timeoutMs ?? 30_000;

  const startedAt = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'You generate flashcards from a given text. Return ONLY valid JSON with shape: {"flashcards":[{"front":"...","back":"..."}]}. Do not include markdown.',
          },
          {
            role: "user",
            content: `Generate 10 concise Q/A flashcards from the text below.\n\nTEXT:\n${sourceText}`,
          },
        ],
      }),
    });

    const json = (await res.json().catch(() => null)) as unknown;
    const generationDurationMs = Math.max(0, Math.round(performance.now() - startedAt));

    if (!res.ok) {
      throw new AiApiError("AI API request failed", {
        code: "AI_API_ERROR",
        status: res.status === 429 ? 429 : 502,
        details: {
          upstream_status: res.status,
          upstream_body: json,
        },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = (json as any)?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      throw new AiApiError("AI API returned empty response", { code: "AI_API_ERROR", status: 502, details: { json } });
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const maybeJson = extractJsonObjectMaybe(content);
      if (maybeJson) {
        parsed = JSON.parse(maybeJson);
      }
    }

    if (!parsed) {
      throw new AiApiError("AI API returned non-JSON content", {
        code: "AI_API_ERROR",
        status: 502,
        details: { content_preview: content.slice(0, 500) },
      });
    }

    const proposals = normalizeProposals(parsed);
    return { proposals, generationDurationMs, rawModelResponse: json };
  } catch (err) {
    if (err instanceof AiApiError) throw err;
    const generationDurationMs = Math.max(0, Math.round(performance.now() - startedAt));
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new AiApiError(message, { code: "AI_API_ERROR", status: 502, details: { generationDurationMs } });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function createGenerationRecord(options: {
  supabase: SupabaseClient;
  userId: string;
  model: string;
  generatedCount: number;
  sourceTextHash: string;
  sourceTextLength: number;
  generationDurationMs: number;
}) {
  const { supabase, userId, model, generatedCount, sourceTextHash, sourceTextLength, generationDurationMs } = options;

  const { data, error } = await supabase
    .from("generations")
    .insert({
      user_id: userId,
      model,
      generated_count: generatedCount,
      accepted_unedited_count: 0,
      accepted_edited_count: 0,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      generation_duration_ms: generationDurationMs,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create generation record");
  }

  return data;
}

export async function logGenerationError(options: {
  supabase: SupabaseClient;
  userId: string;
  model: string;
  sourceTextHash: string;
  sourceTextLength: number;
  errorCode: string;
  errorMessage: string;
}) {
  const { supabase, userId, model, sourceTextHash, sourceTextLength, errorCode, errorMessage } = options;

  // Best-effort logging only.
  await supabase.from("generation_error_logs").insert({
    user_id: userId,
    model,
    source_text_hash: sourceTextHash,
    source_text_length: sourceTextLength,
    error_code: errorCode,
    error_message: errorMessage,
  });
}

export async function getGenerations(options: {
  supabase: SupabaseClient;
  userId: string;
  page: number;
  limit: number;
  sort: "created_at" | "updated_at";
  order: "asc" | "desc";
}): Promise<PaginatedGenerationsResponse> {
  const { supabase, userId, page, limit, sort, order } = options;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("generations")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order(sort, { ascending: order === "asc" })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;
  const total_pages = Math.max(1, Math.ceil(total / limit));

  return {
    data: data ?? [],
    pagination: {
      page,
      limit,
      total,
      total_pages,
    },
  };
}

export async function getGenerationById(options: {
  supabase: SupabaseClient;
  userId: string;
  generationId: number;
}): Promise<GenerationDTO | null> {
  const { supabase, userId, generationId } = options;

  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("id", generationId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

export async function getGenerationErrorLogs(options: {
  supabase: SupabaseClient;
  userId: string;
  page: number;
  limit: number;
}): Promise<PaginatedGenerationErrorLogsResponse> {
  const { supabase, userId, page, limit } = options;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("generation_error_logs")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;
  const total_pages = Math.max(1, Math.ceil(total / limit));

  return {
    data: data ?? [],
    pagination: {
      page,
      limit,
      total,
      total_pages,
    },
  };
}

export async function createGeneration(options: {
  supabase: SupabaseClient;
  userId: string;
  sourceText: string;
  model: string;
  apiKey: string;
}): Promise<GenerationProposalsResponse> {
  const { supabase, userId, sourceText, model, apiKey } = options;

  const sourceTextHash = hashSourceText(sourceText);
  const sourceTextLength = sourceText.length;

  const { proposals, generationDurationMs } = await generateFlashcardsFromText({
    sourceText,
    model,
    apiKey,
  });

  const generation = await createGenerationRecord({
    supabase,
    userId,
    model,
    generatedCount: proposals.length,
    sourceTextHash,
    sourceTextLength,
    generationDurationMs,
  });

  return {
    generation_id: generation.id,
    flashcards_proposals: proposals,
    metadata: {
      generated_count: proposals.length,
      source_text_length: sourceTextLength,
      generation_duration_ms: generationDurationMs,
    },
  };
}
