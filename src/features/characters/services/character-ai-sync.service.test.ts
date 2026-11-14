import assert from "node:assert/strict";
import { it } from "node:test";
import { createCharacterAISyncService } from "./character-ai-sync.service";

const altarOfGrace = [
  "THE ALTAR OF GRACE",
  "INT. DOCTOR'S OFFICE - DAY",
  "The office is quiet. A large Bible sits on the edge of a mahogany",
  "desk. DOCTOR LANRE (40s, composed but weary) reviews a medical file.",
  "The door swings open. CHIEF WILLIAMS (60s, wealthy, impatient)",
  "enters.",
  "CHIEF WILLIAMS",
  "You are delaying the procedure, Doctor. My",
  "time is not something you can play with.",
  "DOCTOR LANRE",
  "(Looking up)",
  "Chief, the test results changed overnight.",
  "There is no trace of the tumor. I cannot",
  "operate on a healthy man.",
  "CHIEF WILLIAMS",
  "Are you calling my private physicians liars?",
  "Or are you preaching to me again?",
  "DOCTOR LANRE",
  "I am looking at the facts, Chief. God has",
  "stepped into this matter.",
  "Chief Williams slams his walking stick on the floor.",
  "SCENE END",
].join("\n");

function character(name: string) {
  return {
    id: "character-" + name.toLowerCase().replaceAll(" ", "-"),
    productionId: "production-1",
    name,
    role: "lead" as const,
    status: "draft" as const,
    progress: 0,
    references: [],
    createdAt: "",
    updatedAt: "",
  };
}

async function captureCharacterPrompt(name: string) {
  let request: { systemPrompt: string; userPrompt: string; productionId?: string } | undefined;
  const service = createCharacterAISyncService({
    screenplayRepository: {
      getByProductionId: async () => ({
        id: "script-1", title: "The Altar of Grace", version: 1, content: altarOfGrace,
      }),
      getRevisions: async () => [{
        id: "revision-1", screenplayId: "script-1", version: 1,
      }],
    },
    aiGateway: {
      generate: async (input) => {
        request = input;
        return {
          provider: "gemini",
          text: JSON.stringify({
            fields: { biography: name + " appears in the doctor's office." },
            fieldEvidence: { biography: "The office is quiet." },
          }),
        };
      },
    },
  });
  await service.propose("production-1", character(name));
  assert.ok(request, "AI request should be constructed");
  return request;
}

it("builds a character-specific prompt for Doctor Lanre from the actual Altar of Grace test script", async () => {
  const request = await captureCharacterPrompt("Doctor Lanre");
  assert.match(request.userPrompt, /INT\. DOCTOR'S OFFICE - DAY/);
  assert.match(request.userPrompt, /DOCTOR LANRE: Chief, the test results changed overnight\./);
  assert.match(request.userPrompt, /I am looking at the facts, Chief\. God has/);
  assert.doesNotMatch(request.userPrompt, /CHIEF WILLIAMS: You are delaying the procedure/);
  assert.match(request.systemPrompt, /Character: Doctor Lanre/);
});

it("builds a character-specific prompt for Chief Williams from the same test script", async () => {
  const request = await captureCharacterPrompt("Chief Williams");
  assert.match(request.userPrompt, /INT\. DOCTOR'S OFFICE - DAY/);
  assert.match(request.userPrompt, /CHIEF WILLIAMS: You are delaying the procedure/);
  assert.match(request.userPrompt, /Are you calling my private physicians liars/);
  assert.doesNotMatch(request.userPrompt, /DOCTOR LANRE: Chief, the test results changed overnight/);
  assert.match(request.systemPrompt, /Character: Chief Williams/);
});
