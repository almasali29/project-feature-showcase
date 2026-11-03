import { expect, it } from "vitest";
import { validateDocument, MAX_DOCUMENT_SIZE } from "@/lib/document-import";
it("accepts only PDF and DOCX", () => {
  expect(validateDocument("paper.pdf", 1024)).toBeNull();
  expect(validateDocument("paper.docx", 1024)).toBeNull();
  expect(validateDocument("paper.exe", 1024)).not.toBeNull();
});
it("rejects oversized and empty documents", () => {
  expect(validateDocument("paper.pdf", MAX_DOCUMENT_SIZE + 1)).not.toBeNull();
  expect(validateDocument("paper.pdf", 0)).not.toBeNull();
});