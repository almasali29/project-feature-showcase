import { z } from "zod";
export const semanticSchema = z.object({
  findings: z.array(z.object({ sectionId: z.string(), title: z.string(), quote: z.string(), explanation: z.string(), evidence: z.string(), confidence: z.enum(["low", "medium", "high"]) }).strict()),
  reproducibility: z.array(z.object({ item: z.enum(["Dataset", "Hyperparameters", "Random seed", "Metrics", "Environment"]), status: z.enum(["reported", "missing", "unclear"]), quote: z.string(), explanation: z.string() }).strict()),
}).strict();
export type SemanticResult = z.infer<typeof semanticSchema>;