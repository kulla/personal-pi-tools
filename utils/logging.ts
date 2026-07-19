import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

const LOG_TYPE = "log-message";

export type LogLevel = "info" | "warning" | "error";

export type LogEntryData = {
  level: LogLevel;
  message: string;
};

export type Logger = {
  log: (message: string, level?: LogLevel) => void;
};

export function createLogger(pi: ExtensionAPI, maxChars = 500): Logger {
  pi.registerEntryRenderer<LogEntryData>(
    LOG_TYPE,
    (entry, { expanded }, theme) => {
      const data = entry.data ?? { level: "info", message: "" };
      const color =
        data.level === "error"
          ? "error"
          : data.level === "warning"
            ? "warning"
            : "dim";
      const message = expanded
        ? data.message
        : truncateText(data.message, maxChars);

      return new Text(theme.fg(color, message), 1, 0);
    },
  );

  return {
    log(message: string, level: LogLevel = "info") {
      pi.appendEntry(LOG_TYPE, { level, message });
    },
  };
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n...[truncated]`;
}
