'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { CopyButton } from './CopyButton';

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-stone max-w-none text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code(props) {
            const codeText = String(props.children ?? '');
            const inline = !props.className;
            if (inline) return <code className="rounded bg-stone-100 px-1 py-0.5">{props.children}</code>;
            return (
              <div className="relative my-3 rounded-xl bg-stone-900 p-3 text-stone-100">
                <div className="absolute right-2 top-2">
                  <CopyButton text={codeText} />
                </div>
                <code className={props.className}>{props.children}</code>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
