import { ChatReportingUI } from "@/features/reporting/chat-reporting-ui";

export default async function Home({ params }: { params: Promise<{ chatid: string }> }) {
  const { chatid } = await params;
  return <ChatReportingUI chatId={chatid} />;
}
