"use client";
import { Button } from "@/components/ui/button";
import { AI_NAME } from "@/features/theme/customise";
import { Download } from "lucide-react";
import { useSession } from "next-auth/react";
import { FC } from "react";
import { useChatContext } from "./chat-context";
import { ChatStyleSelector } from "./chat-empty-state/chat-style-selector";
import { ChatTypeSelector } from "./chat-empty-state/chat-type-selector";

interface Prop {}

export const ChatHeader: FC<Prop> = () => {
  const { chatBody, messages, chatThreadName } = useChatContext();
  const { data: session } = useSession();

  const handleDownload = () => {
    const userName = session?.user?.name ?? "User";
    const lines: string[] = [
      `# ${chatThreadName || "Chat Conversation"}`,
      "",
      `**Exported:** ${new Date().toLocaleDateString()}`,
      "",
      "---",
      "",
    ];

    for (const msg of messages) {
      const role = msg.role === "user" ? userName : AI_NAME;
      lines.push(`## ${role}`);
      lines.push("");
      lines.push(msg.content);
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    const blob = new Blob([lines.join("\n")], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(chatThreadName || "conversation")
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <ChatTypeSelector disable={true} />
        <ChatStyleSelector disable={true} />
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            title="Download conversation as Markdown"
          >
            <Download size={16} />
          </Button>
        )}
      </div>
      <div className="flex gap-2 h-2">
        <p className="text-xs">{chatBody.chatOverFileName}</p>
      </div>
    </div>
  );
};
