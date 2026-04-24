import { MarkdownRenderer } from './MarkdownRenderer';

export function ChatMessage({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl rounded-2xl px-4 py-3 ${isUser ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200'}`}>
        {isUser ? <p className="whitespace-pre-wrap text-sm">{content}</p> : <MarkdownRenderer content={content} />}
      </div>
    </div>
  );
}
