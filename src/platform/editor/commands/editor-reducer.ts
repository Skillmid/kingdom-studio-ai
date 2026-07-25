export interface EditorState {
  values: Record<string, unknown>;

  originalValues: Record<string, unknown>;

  history: Record<string, unknown>[];

  future: Record<string, unknown>[];
}

export type EditorAction =
  | {
      type: "UPDATE_FIELD";

      field: string;

      value: unknown;
    }
  | {
      type: "RESET";
    }
  | {
      type: "UNDO";
    }
  | {
      type: "REDO";
    };

export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "UPDATE_FIELD": {
      return {
        ...state,

        history: [
          ...state.history,
          state.values,
        ],

        future: [],

        values: {
          ...state.values,

          [action.field]:
            action.value,
        },
      };
    }

    case "RESET": {
      return {
        ...state,

        values:
          state.originalValues,

        history: [],

        future: [],
      };
    }

    case "UNDO": {
      if (
        state.history.length === 0
      ) {
        return state;
      }

      const previous =
        state.history[
          state.history.length - 1
        ];

      return {
        ...state,

        values: previous,

        history:
          state.history.slice(
            0,
            -1
          ),

        future: [
          state.values,
          ...state.future,
        ],
      };
    }

    case "REDO": {
      if (
        state.future.length === 0
      ) {
        return state;
      }

      const next =
        state.future[0];

      return {
        ...state,

        values: next,

        future:
          state.future.slice(
            1
          ),

        history: [
          ...state.history,
          state.values,
        ],
      };
    }

    default:
      return state;
  }
}