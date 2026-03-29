import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
}

function getLabel(toolName: string, args: Record<string, unknown>): string {
  const filename = typeof args.path === "string"
    ? args.path.split("/").pop() ?? args.path
    : null;

  if (toolName === "str_replace_editor" && filename) {
    const command = args.command as string | undefined;
    switch (command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return `Editing ${filename}`;
      case "view":
        return `Viewing ${filename}`;
      case "undo_edit":
        return `Undoing edit in ${filename}`;
    }
  }

  if (toolName === "file_manager" && filename) {
    const command = args.command as string | undefined;
    if (command === "rename") {
      const newFilename = typeof args.new_path === "string"
        ? args.new_path.split("/").pop() ?? args.new_path
        : null;
      return newFilename ? `Renaming ${filename} to ${newFilename}` : `Renaming ${filename}`;
    }
    if (command === "delete") {
      return `Deleting ${filename}`;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolName, args, state }: ToolInvocationBadgeProps) {
  const label = getLabel(toolName, args);
  const done = state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
