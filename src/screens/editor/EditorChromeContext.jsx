import { createContext, useContext } from 'react';

const EditorChromeContext = createContext(null);

export function EditorChromeProvider({ value, children }) {
  return (
    <EditorChromeContext.Provider value={value}>{children}</EditorChromeContext.Provider>
  );
}

export function useEditorChrome() {
  const value = useContext(EditorChromeContext);
  if (!value) {
    throw new Error('useEditorChrome must be used within EditorChromeProvider');
  }
  return value;
}
