export type CommandResultLike = {
  stdout: string;
  stderr: string;
  code: number;
};

export function getCommandErrorMessage(
  result: CommandResultLike,
  fallback: string,
): string {
  return result.stderr.trim() || result.stdout.trim() || fallback;
}

export function throwIfCommandFailed(
  result: CommandResultLike,
  fallbackMessage: string,
): void {
  if (result.code !== 0) {
    throw new Error(getCommandErrorMessage(result, fallbackMessage));
  }
}
