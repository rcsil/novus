export interface EditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  path?: string;
}