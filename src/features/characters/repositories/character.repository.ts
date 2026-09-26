import { supabase } from "@/lib/supabase/client";

import type { Character } from "../types/character";

const TABLE_NAME = "characters";

type CharacterRow = {
  id: string;
  production_id: string;
  name: Character["name"];
  role: Character["role"];
  status: Character["status"];
  age: Character["age"];
  gender: Character["gender"];
  occupation: Character["occupation"];
  nationality: Character["nationality"];
  ethnicity: Character["ethnicity"];
  biography: Character["biography"];
  appearance: Character["appearance"];
  height: Character["height"];
  weight: Character["weight"];
  eye_color: Character["eyeColor"];
  hair_color: Character["hairColor"];
  distinguishing_features: Character["distinguishingFeatures"];
  personality: Character["personality"];
  strengths: Character["strengths"];
  weaknesses: Character["weaknesses"];
  fears: Character["fears"];
  habits: Character["habits"];
  values: Character["values"];
  motivation: Character["motivation"];
  goal: Character["goal"];
  conflict: Character["conflict"];
  character_arc: Character["characterArc"];
  spiritual_journey: Character["spiritualJourney"];
  speech_style: Character["speechStyle"];
  catch_phrases: Character["catchPhrases"];
  ai_instructions: Character["aiInstructions"];
  progress: number | null;
  created_at: Character["createdAt"];
  updated_at: Character["updatedAt"];
};

type CharacterWritePayload = {
  production_id?: string;
  name?: Character["name"];
  role?: Character["role"];
  status?: Character["status"];
  age?: Character["age"];
  gender?: Character["gender"];
  occupation?: Character["occupation"];
  nationality?: Character["nationality"];
  ethnicity?: Character["ethnicity"];
  biography?: Character["biography"];
  appearance?: Character["appearance"];
  height?: Character["height"];
  weight?: Character["weight"];
  eye_color?: Character["eyeColor"];
  hair_color?: Character["hairColor"];
  distinguishing_features?: Character["distinguishingFeatures"];
  personality?: Character["personality"];
  strengths?: Character["strengths"];
  weaknesses?: Character["weaknesses"];
  fears?: Character["fears"];
  habits?: Character["habits"];
  values?: Character["values"];
  motivation?: Character["motivation"];
  goal?: Character["goal"];
  conflict?: Character["conflict"];
  character_arc?: Character["characterArc"];
  spiritual_journey?: Character["spiritualJourney"];
  speech_style?: Character["speechStyle"];
  catch_phrases?: Character["catchPhrases"];
  ai_instructions?: Character["aiInstructions"];
  progress?: number;
};

export class CharacterRepository {
  private readonly supabase = supabase;

  async getByProductionId(productionId: string): Promise<Character[]> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("production_id", productionId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) =>
      this.mapCharacter(row as CharacterRow)
    );
  }

  async getById(id: string): Promise<Character | null> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return this.mapCharacter(data as CharacterRow);
  }

  async create(character: Partial<Character>): Promise<Character> {
    const payload = this.toDatabase(character);

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapCharacter(data as CharacterRow);
  }

  async createMany(characters: Partial<Character>[]): Promise<Character[]> {
    if (characters.length === 0) {
      return [];
    }

    const payloads = characters.map((c) => this.toDatabase(c));

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(payloads)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as CharacterRow[]).map((row) =>
      this.mapCharacter(row)
    );
  }

  async update(
    id: string,
    updates: Partial<Character>
  ): Promise<Character> {
    const payload = this.toDatabase(updates);

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapCharacter(data as CharacterRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    const { error } = await this.supabase
      .from(TABLE_NAME)
      .update({
        progress,
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }

  private mapCharacter(data: CharacterRow): Character {
    return {
      id: data.id,
      productionId: data.production_id,
      name: data.name,
      role: data.role,
      status: data.status,
      age: data.age,
      gender: data.gender,
      occupation: data.occupation,
      nationality: data.nationality,
      ethnicity: data.ethnicity,
      biography: data.biography,
      appearance: data.appearance,
      height: data.height,
      weight: data.weight,
      eyeColor: data.eye_color,
      hairColor: data.hair_color,
      distinguishingFeatures: data.distinguishing_features,
      personality: data.personality,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      fears: data.fears,
      habits: data.habits,
      values: data.values,
      motivation: data.motivation,
      goal: data.goal,
      conflict: data.conflict,
      characterArc: data.character_arc,
      spiritualJourney: data.spiritual_journey,
      speechStyle: data.speech_style,
      catchPhrases: data.catch_phrases,
      aiInstructions: data.ai_instructions,
      progress: data.progress ?? 0,
      references: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private toDatabase(character: Partial<Character>): CharacterWritePayload {
    const payload: CharacterWritePayload = {};

    if (character.productionId !== undefined) payload.production_id = character.productionId;
    if (character.name !== undefined) payload.name = character.name;
    if (character.role !== undefined) payload.role = character.role;
    if (character.status !== undefined) payload.status = character.status;
    if (character.age !== undefined) payload.age = character.age;
    if (character.gender !== undefined) payload.gender = character.gender;
    if (character.occupation !== undefined) payload.occupation = character.occupation;
    if (character.nationality !== undefined) payload.nationality = character.nationality;
    if (character.ethnicity !== undefined) payload.ethnicity = character.ethnicity;
    if (character.biography !== undefined) payload.biography = character.biography;
    if (character.appearance !== undefined) payload.appearance = character.appearance;
    if (character.height !== undefined) payload.height = character.height;
    if (character.weight !== undefined) payload.weight = character.weight;
    if (character.eyeColor !== undefined) payload.eye_color = character.eyeColor;
    if (character.hairColor !== undefined) payload.hair_color = character.hairColor;
    if (character.distinguishingFeatures !== undefined) {
      payload.distinguishing_features = character.distinguishingFeatures;
    }
    if (character.personality !== undefined) payload.personality = character.personality;
    if (character.strengths !== undefined) payload.strengths = character.strengths;
    if (character.weaknesses !== undefined) payload.weaknesses = character.weaknesses;
    if (character.fears !== undefined) payload.fears = character.fears;
    if (character.habits !== undefined) payload.habits = character.habits;
    if (character.values !== undefined) payload.values = character.values;
    if (character.motivation !== undefined) payload.motivation = character.motivation;
    if (character.goal !== undefined) payload.goal = character.goal;
    if (character.conflict !== undefined) payload.conflict = character.conflict;
    if (character.characterArc !== undefined) payload.character_arc = character.characterArc;
    if (character.spiritualJourney !== undefined) {
      payload.spiritual_journey = character.spiritualJourney;
    }
    if (character.speechStyle !== undefined) payload.speech_style = character.speechStyle;
    if (character.catchPhrases !== undefined) payload.catch_phrases = character.catchPhrases;
    if (character.aiInstructions !== undefined) {
      payload.ai_instructions = character.aiInstructions;
    }
    if (character.progress !== undefined) payload.progress = character.progress;

    return payload;
  }
}

export const characterRepository = new CharacterRepository();
