import { useMemo, useRef, useState } from 'react';
import { ensureBlankHomepage, projectHasPages } from './pages/pageModel';
import { EditorScreen } from './screens/EditorScreen';
import { PreviewScreen } from './screens/PreviewScreen';
import { SetupModal } from './screens/setup/SetupModal';
import {
  clearProject,
  createEmptyProject,
  loadProject,
  saveProject,
} from './storage/projectStorage';

function getInitialState() {
  const saved = loadProject();
  if (saved && projectHasPages(saved)) {
    return { project: saved, setupOpen: false };
  }
  const project = ensureBlankHomepage(saved || createEmptyProject());
  return { project, setupOpen: true };
}

export default function App() {
  const initial = useMemo(() => getInitialState(), []);
  const [screen, setScreen] = useState('editor');
  const [project, setProject] = useState(initial.project);
  const [setupOpen, setSetupOpen] = useState(initial.setupOpen);
  const [editorMountKey, setEditorMountKey] = useState(0);
  const [readyMessage, setReadyMessage] = useState('');
  const setupTriggerRef = useRef(null);

  function handleCommitProject(nextProject, options = {}) {
    const { remount = false, closeSetup = false, save = false } = options;

    let next = nextProject;
    if (save) {
      const result = saveProject(next);
      if (!result.ok) {
        window.alert(result.error);
      } else {
        next = result.project;
      }
    } else {
      // Persist setup draft / blank page quietly so reload keeps progress.
      const result = saveProject(next);
      if (result.ok) next = result.project;
    }

    setProject(next);
    if (remount) setEditorMountKey((value) => value + 1);
    if (closeSetup) setSetupOpen(false);
    setScreen('editor');
  }

  async function handleResetToSetup() {
    const confirmed = window.confirm(
      'Start fresh? This clears the saved project and attachments in this browser.',
    );
    if (!confirmed) return;
    await clearProject();
    const fresh = ensureBlankHomepage(createEmptyProject());
    setProject(fresh);
    setEditorMountKey((value) => value + 1);
    setReadyMessage('');
    setSetupOpen(true);
    setScreen('editor');
  }

  function handleImportedProject(nextProject) {
    setProject(nextProject);
    setEditorMountKey((value) => value + 1);
    setSetupOpen(false);
    setScreen('editor');
  }

  function handleProjectChange(next) {
    setProject((current) => (typeof next === 'function' ? next(current) : next));
  }

  if (screen === 'preview' && projectHasPages(project)) {
    return (
      <div className="cr-app">
        <PreviewScreen project={project} onBackToEditor={() => setScreen('editor')} />
      </div>
    );
  }

  return (
    <div className={`cr-app ${setupOpen ? 'cr-app--setup-open' : ''}`}>
      <EditorScreen
        key={editorMountKey}
        project={project}
        onProjectChange={handleProjectChange}
        onPreview={() => setScreen('preview')}
        onResetToSetup={handleResetToSetup}
        onEditSetup={() => {
          setReadyMessage('');
          setSetupOpen(true);
        }}
        onImported={handleImportedProject}
        setupTriggerRef={setupTriggerRef}
        readyMessage={readyMessage}
        onClearReadyMessage={() => setReadyMessage('')}
        setupOpen={setupOpen}
      />
      <SetupModal
        open={setupOpen}
        project={project}
        triggerRef={setupTriggerRef}
        onClose={() => setSetupOpen(false)}
        onCommitProject={handleCommitProject}
        onReadyMessage={setReadyMessage}
      />
    </div>
  );
}
