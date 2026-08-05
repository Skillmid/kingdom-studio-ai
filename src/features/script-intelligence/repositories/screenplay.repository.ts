import {
  supabase,
} from "@/lib/supabase/client";

import type {
  Screenplay,
  ScreenplayRevision,
  SaveScreenplayInput,
} from "../types/screenplay";

interface ScreenplayRow {
  id: string;
  production_id: string;
  title: string;
  content: string;
  source: Screenplay["source"];
  source_file_name: string | null;
  version: number;
  status: Screenplay["status"];
  created_at: string;
  updated_at: string;
}

interface RevisionRow {
  id: string;
  screenplay_id: string;
  version: number;
  title: string;
  content: string;
  reason: string;
  created_at: string;
}

function mapScreenplay(
  row: ScreenplayRow
): Screenplay {
  return {
    id: row.id,

    productionId:
      row.production_id,

    title: row.title,

    content: row.content,

    source: row.source,

    sourceFileName:
      row.source_file_name,

    version: row.version,

    status: row.status,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

function mapRevision(
  row: RevisionRow
): ScreenplayRevision {
  return {
    id: row.id,

    screenplayId:
      row.screenplay_id,

    version: row.version,

    title: row.title,

    content: row.content,

    reason: row.reason,

    createdAt:
      row.created_at,
  };
}

export class ScreenplayRepository {
  async getByProductionId(
    productionId: string
  ): Promise<Screenplay | null> {
    const {
      data,
      error,
    } = await supabase
      .from("screenplays")
      .select("*")
      .eq(
        "production_id",
        productionId
      )
      .maybeSingle();

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (!data) {
      return null;
    }

    return mapScreenplay(
      data as ScreenplayRow
    );
  }

  async create(
    productionId: string,
    input: SaveScreenplayInput
  ): Promise<Screenplay> {
    const {
      data,
      error,
    } = await supabase
      .from("screenplays")
      .insert({
        production_id:
          productionId,

        title:
          input.title ||
          "Untitled Screenplay",

        content:
          input.content,

        source:
          input.source ??
          "internal",

        source_file_name:
          input.sourceFileName ??
          null,

        status:
          input.status ??
          "draft",

        version: 1,
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        error.message
      );
    }

    const screenplay =
      mapScreenplay(
        data as ScreenplayRow
      );

    await this.createRevision(
      screenplay,
      input.reason ??
        "initial-save"
    );

    return screenplay;
  }

  async save(
    productionId: string,
    input: SaveScreenplayInput
  ): Promise<Screenplay> {
    const existing =
      await this.getByProductionId(
        productionId
      );

    if (!existing) {
      return this.create(
        productionId,
        input
      );
    }

    const nextVersion =
      existing.version + 1;

    const {
      data,
      error,
    } = await supabase
      .from("screenplays")
      .update({
        title:
          input.title ||
          existing.title,

        content:
          input.content,

        source:
          input.source ??
          existing.source,

        source_file_name:
          input.sourceFileName ??
          existing.sourceFileName,

        status:
          input.status ??
          "revised",

        version:
          nextVersion,
      })
      .eq(
        "id",
        existing.id
      )
      .select()
      .single();

    if (error) {
      throw new Error(
        error.message
      );
    }

    const screenplay =
      mapScreenplay(
        data as ScreenplayRow
      );

    await this.createRevision(
      screenplay,
      input.reason ??
        "manual-save"
    );

    return screenplay;
  }

  async createRevision(
    screenplay: Screenplay,
    reason: string
  ): Promise<ScreenplayRevision> {
    const {
      data,
      error,
    } = await supabase
      .from(
        "screenplay_revisions"
      )
      .insert({
        screenplay_id:
          screenplay.id,

        version:
          screenplay.version,

        title:
          screenplay.title,

        content:
          screenplay.content,

        reason,
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        error.message
      );
    }

    return mapRevision(
      data as RevisionRow
    );
  }

  async getRevisions(
    screenplayId: string
  ): Promise<
    ScreenplayRevision[]
  > {
    const {
      data,
      error,
    } = await supabase
      .from(
        "screenplay_revisions"
      )
      .select("*")
      .eq(
        "screenplay_id",
        screenplayId
      )
      .order(
        "version",
        {
          ascending: false,
        }
      );

    if (error) {
      throw new Error(
        error.message
      );
    }

    return (
      (data ?? []) as RevisionRow[]
    ).map(mapRevision);
  }

  async getRevisionById(
    revisionId: string
  ): Promise<ScreenplayRevision> {
    const {
      data,
      error,
    } = await supabase
      .from(
        "screenplay_revisions"
      )
      .select("*")
      .eq(
        "id",
        revisionId
      )
      .single();

    if (error) {
      throw new Error(
        error.message
      );
    }

    return mapRevision(
      data as RevisionRow
    );
  }

  async restoreRevision(
    productionId: string,
    revisionId: string
  ): Promise<Screenplay> {
    const revision =
      await this.getRevisionById(
        revisionId
      );

    const current =
      await this.getByProductionId(
        productionId
      );

    if (!current) {
      throw new Error(
        "Screenplay not found."
      );
    }

    if (
      revision.screenplayId !==
      current.id
    ) {
      throw new Error(
        "Revision does not belong to this screenplay."
      );
    }

    return this.save(
      productionId,
      {
        title:
          revision.title,

        content:
          revision.content,

        source:
          current.source,

        sourceFileName:
          current.sourceFileName,

        status:
          "revised",

        reason:
          `restored-from-version-${revision.version}`,
      }
    );
  }
}

export const screenplayRepository =
  new ScreenplayRepository();