import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateFlashcardCommand,
  FlashcardDTO,
  FlashcardSortField,
  FlashcardSource,
  FlashcardStatus,
  PaginatedFlashcardsResponse,
  SortOrder,
  UpdateFlashcardCommand,
} from "../../types";

/**
 * Get paginated list of flashcards with optional filtering and sorting
 */
export async function getFlashcards(options: {
  supabase: SupabaseClient;
  userId: string;
  page: number;
  limit: number;
  status?: FlashcardStatus;
  source?: FlashcardSource;
  sort: FlashcardSortField;
  order: SortOrder;
}): Promise<PaginatedFlashcardsResponse> {
  const { supabase, userId, page, limit, status, source, sort, order } = options;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

  // Apply filters
  if (status) {
    query = query.eq("status", status);
  }
  if (source) {
    query = query.eq("source", source);
  }

  // Apply sorting and pagination
  const { data, error, count } = await query.order(sort, { ascending: order === "asc" }).range(from, to);

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

/**
 * Get a single flashcard by ID, ensuring it belongs to the user
 */
export async function getFlashcardById(options: {
  supabase: SupabaseClient;
  userId: string;
  flashcardId: number;
}): Promise<FlashcardDTO | null> {
  const { supabase, userId, flashcardId } = options;

  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", flashcardId)
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

/**
 * Create one or more flashcards in a single transaction
 * Updates generation statistics if generation_id is provided
 */
export async function createFlashcards(options: {
  supabase: SupabaseClient;
  userId: string;
  flashcards: CreateFlashcardCommand[];
}): Promise<FlashcardDTO[]> {
  const { supabase, userId, flashcards } = options;

  // Prepare flashcards for insertion
  const flashcardsToInsert = flashcards.map((flashcard) => ({
    user_id: userId,
    front: flashcard.front,
    back: flashcard.back,
    source: flashcard.source ?? "manual",
    generation_id: flashcard.generation_id ?? null,
    status: "new" as const,
    repetition_count: 0,
  }));

  // Insert flashcards
  const { data, error } = await supabase.from("flashcards").insert(flashcardsToInsert).select("*");

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create flashcards");
  }

  // Update generation statistics if any flashcards have generation_id
  const generationIds = [...new Set(data.map((f) => f.generation_id).filter(Boolean))];
  for (const generationId of generationIds) {
    const flashcardsForGeneration = data.filter((f) => f.generation_id === generationId);
    const aiFlashcards = flashcardsForGeneration.filter((f) => f.source === "ai");
    const editedFlashcards = flashcardsForGeneration.filter((f) => f.source === "mixed");

    if (aiFlashcards.length > 0 || editedFlashcards.length > 0) {
      // Update generation statistics using direct UPDATE
      const updateData: Partial<{ accepted_unedited_count: number; accepted_edited_count: number }> = {};
      if (aiFlashcards.length > 0) {
        updateData.accepted_unedited_count = aiFlashcards.length;
      }
      if (editedFlashcards.length > 0) {
        updateData.accepted_edited_count = editedFlashcards.length;
      }

      await supabase
        .from("generations")
        .update(updateData)
        .eq("id", generationId as number)
        .eq("user_id", userId);
    }
  }

  return data;
}

/**
 * Update an existing flashcard
 */
export async function updateFlashcard(options: {
  supabase: SupabaseClient;
  userId: string;
  flashcardId: number;
  updates: UpdateFlashcardCommand;
}): Promise<FlashcardDTO | null> {
  const { supabase, userId, flashcardId, updates } = options;

  // Build update object with only provided fields
  const updateData: Partial<FlashcardDTO> = {};
  if (updates.front !== undefined) updateData.front = updates.front;
  if (updates.back !== undefined) updateData.back = updates.back;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.source !== undefined) updateData.source = updates.source;
  if (updates.repetition_count !== undefined) updateData.repetition_count = updates.repetition_count;

  const { data, error } = await supabase
    .from("flashcards")
    .update(updateData)
    .eq("id", flashcardId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned (no matching flashcard or doesn't belong to user)
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

/**
 * Delete a flashcard by ID, ensuring it belongs to the user
 */
export async function deleteFlashcard(options: {
  supabase: SupabaseClient;
  userId: string;
  flashcardId: number;
}): Promise<boolean> {
  const { supabase, userId, flashcardId } = options;

  const { error } = await supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
