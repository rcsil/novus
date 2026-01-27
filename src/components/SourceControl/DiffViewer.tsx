interface DiffViewerProps {
  content: string;
}

export default function DiffViewer({ content }: DiffViewerProps) {
  const lines = content.split('\n');

  return (
    <div className="h-full overflow-auto bg-[#1e1e1e] font-mono text-sm p-4">
      {lines.map((line, index) => {
        let bgColor = 'transparent';
        let textColor = '#d4d4d4';

        if (line.startsWith('+') && !line.startsWith('+++')) {
          bgColor = 'rgba(46, 160, 67, 0.2)';
          textColor = '#b5cea8';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          bgColor = 'rgba(248, 81, 73, 0.2)';
          textColor = '#ce9178';
        } else if (line.startsWith('@@')) {
            textColor = '#569cd6';
        }

        return (
          <div key={index} style={{ backgroundColor: bgColor, color: textColor }} className="whitespace-pre w-full px-1">
            {line}
          </div>
        );
      })}
    </div>
  );
}
