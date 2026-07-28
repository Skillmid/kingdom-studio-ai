export class SaveManager {
  async execute(
    callback: () => Promise<void>
  ) {
    await callback();
  }
}

export const saveManager =
  new SaveManager();