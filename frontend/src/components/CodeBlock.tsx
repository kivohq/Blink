import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ language, code }) => {
  return (
    <SyntaxHighlighter language={language || 'text'} style={vscDarkPlus} className="rounded-lg text-sm">
      {code}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;
