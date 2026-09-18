import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Sun, Moon } from 'lucide-react'

const MONACO_LANG = {
  python: 'python',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  javascript: 'javascript',
  php: 'php',
  typescript: 'typescript',
}

export default function CodeEditor({
  code,
  onChange,
  language,
}) {
  const [editorTheme, setEditorTheme] = useState('dark')

  const toggleEditorTheme = () => {
    setEditorTheme((current) =>
      current === 'dark' ? 'light' : 'dark'
    )
  }

  return (
    <div className="border border-line/10 rounded-lg overflow-hidden">

      {/* EDITOR TOOLBAR */}
      <div className="h-10 px-3 flex items-center justify-between bg-panel border-b border-line/10">

        <span className="text-xs text-mute font-mono">
          {MONACO_LANG[language] || 'plaintext'}
        </span>

        <button
          type="button"
          onClick={toggleEditorTheme}
          title={
            editorTheme === 'dark'
              ? 'Switch editor to light theme'
              : 'Switch editor to dark theme'
          }
          className="p-1.5 rounded-md text-mute hover:text-ink hover:bg-raised transition-colors"
        >
          {editorTheme === 'dark' ? (
            <Sun size={16} />
          ) : (
            <Moon size={16} />
          )}
        </button>

      </div>

      {/* MONACO EDITOR */}
      <Editor
        height="560px"
        language={MONACO_LANG[language] || 'plaintext'}
        value={code}
        onChange={(val) => onChange(val ?? '')}
        theme={editorTheme === 'light' ? 'light' : 'vs-dark'}
        options={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          minimap: { enabled: false },
          padding: {
            top: 16,
            bottom: 16,
          },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
        }}
      />

    </div>
  )
}