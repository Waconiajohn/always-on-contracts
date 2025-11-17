// src/lib/api/linkedin.ts
import { supabase } from "@/integrations/supabase/client";
import {
  OptimizeLinkedInProfileRequestSchema,
  LinkedInProfileDraftSchema,
  OptimizeLinkedInProfileRequest,
  LinkedInProfileDraft,
  GenerateSeriesPostsRequestSchema,
  GenerateSeriesPostsRequest,
  GenerateSeriesPostsResponseSchema,
  GenerateSeriesPostsResponse,
  GenerateNetworkingMessagesRequestSchema,
  GenerateNetworkingMessagesRequest,
  GenerateNetworkingMessagesResponseSchema,
  GenerateNetworkingMessagesResponse,
} from "@/lib/schemas/linkedin";

/**
 * Generic error for function invocation issues.
 */
export class LinkedInApiError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = "LinkedInApiError";
  }
}

/**
 * Call the `optimize-linkedin-profile` edge function.
 *
 * Validates input & output with Zod so React components can rely on strong types.
 */
export async function optimizeLinkedInProfile(
  params: OptimizeLinkedInProfileRequest
): Promise<LinkedInProfileDraft> {
  // Validate input on the client so we fail fast if something is wrong.
  const parsedInput = OptimizeLinkedInProfileRequestSchema.parse(params);

  const { data, error } = await supabase.functions.invoke(
    "optimize-linkedin-profile",
    {
      body: parsedInput,
    }
  );

  if (error) {
    throw new LinkedInApiError(
      "Failed to call optimize-linkedin-profile",
      error
    );
  }

  const parsedOutput = LinkedInProfileDraftSchema.safeParse(data);
  if (!parsedOutput.success) {
    throw new LinkedInApiError(
      "Invalid response from optimize-linkedin-profile",
      parsedOutput.error
    );
  }

  return parsedOutput.data;
}

/**
 * Call the `generate-series-posts` edge function.
 *
 * Use this after you already have a series outline from your outline generator.
 */
export async function generateLinkedInSeriesPosts(
  params: GenerateSeriesPostsRequest
): Promise<GenerateSeriesPostsResponse> {
  const parsedInput = GenerateSeriesPostsRequestSchema.parse(params);

  const { data, error } = await supabase.functions.invoke(
    "generate-series-posts",
    {
      body: parsedInput,
    }
  );

  if (error) {
    throw new LinkedInApiError(
      "Failed to call generate-series-posts",
      error
    );
  }

  const parsedOutput = GenerateSeriesPostsResponseSchema.safeParse(data);
  if (!parsedOutput.success) {
    throw new LinkedInApiError(
      "Invalid response from generate-series-posts",
      parsedOutput.error
    );
  }

  return parsedOutput.data;
}

/**
 * Call the `linkedin-networking-messages` edge function.
 *
 * Generates 3 message variants (direct, warm, brief) for a given scenario.
 */
export async function generateNetworkingMessages(
  params: GenerateNetworkingMessagesRequest
): Promise<GenerateNetworkingMessagesResponse> {
  const parsedInput = GenerateNetworkingMessagesRequestSchema.parse(params);

  const { data, error } = await supabase.functions.invoke(
    "linkedin-networking-messages",
    {
      body: parsedInput,
    }
  );

  if (error) {
    throw new LinkedInApiError(
      "Failed to call linkedin-networking-messages",
      error
    );
  }

  const parsedOutput =
    GenerateNetworkingMessagesResponseSchema.safeParse(data);
  if (!parsedOutput.success) {
    throw new LinkedInApiError(
      "Invalid response from linkedin-networking-messages",
      parsedOutput.error
    );
  }

  return parsedOutput.data;
}
