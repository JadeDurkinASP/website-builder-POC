import { useEffect, useMemo, useRef, useState } from 'react';
import { ensureBlankHomepage, projectHasPages } from './pages/pageModel';
import { EditorScreen } from './screens/EditorScreen';
import { PreviewScreen } from './screens/PreviewScreen';
import { SetupModal } from './screens/setup/SetupModal';
import { snapshotKey } from './state/projectSnapshot';
import {
  clearProject,
  createEmptyProject,
  loadProject,
  saveProject,
} from './storage/projectStorage';
import { ConfirmDialog } from './ui/AppDialog';

function getInitialState() {
  const saved = loadProject();
  if (saved && projectHasPages(saved)) {
    return { project: saved, setupOpen: false, savedSnapshot: snapshotKey(saved) };
  }
  const project = ensureBlankHomepage(saved || createEmptyProject());
  // Blank auto-open: treat as saved baseline once persisted below isn't done yet
  return { project, setupOpen: true, savedSnapshot: snapshotKey(project) };
}

export default function App() {
  const initial = useMemo(() => getInitialState(), []);
  const [screen, setScreen] = useState('editor');
  const [project, setProject] = useState(initial.project);
  const [setupOpen, setSetupOpen] = useState(initial.setupOpen);
  const [editorMountKey, setEditorMountKey] = useState(0);
  const [readyMessage, setReadyMessage] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState(initial.savedSnapshot);
  const [saveError, setSaveError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  const setupTriggerRef = useRef(null);

  const dirty = snapshotKey(project) !== savedSnapshot;

  useEffect(() => {
    function onBeforeUnload(event) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  function markSaved(nextProject) {
    setSavedSnapshot(snapshotKey(nextProject));
    setSaveError('');
  }

  function handleCommitProject(nextProject, options = {}) {
    const { remount = false, closeSetup = false, save = false, readyMessage: ready } = options;

    let next = nextProject;
    if (save || options.persistDraft) {
      const result = saveProject(next);
      if (!result.ok) {
        setSaveError(result.error || 'Could not save.');
        if (save) return { ok: false, error: result.error };
      } else {
        next = result.project;
        markSaved(next);
      }
    }

    setProject(next);
    if (remount) setEditorMountKey((value) => value + 1);
    if (closeSetup) setSetupOpen(false);
    if (ready) setReadyMessage(ready);
    setScreen('editor');
    return { ok: true, project: next };
  }

  async function confirmReset() {
    setResetBusy(true);
    setResetError('');
    try {
      await clearProject();
    } catch (error) {
      setResetBusy(false);
      setResetError(error?.message || 'Could not clear attachments. Reset cancelled.');
      return;
    }

    const fresh = ensureBlankHomepage(createEmptyProject());
    const persisted = saveProject(fresh);
    const next = persisted.ok ? persisted.project : fresh;
    setProject(next);
    markSaved(next);
    setEditorMountKey((value) => value + 1);
    setReadyMessage('');
    setSetupOpen(true);
    setScreen('editor');
    setResetBusy(false);
    setResetOpen(false);
  }

  function handleImportedProject(nextProject) {
    setProject(nextProject);
    markSaved(nextProject);
    setEditorMountKey((value) => value + 1);
    setSetupOpen(false);
    setScreen('editor');
  }

  function handleProjectChange(next) {
    setProject((current) => (typeof next === 'function' ? next(current) : next));
  }

  function handleSaveProject(dataProject) {
    const result = saveProject(dataProject);
    if (result.ok) {
      setProject(result.project);
      markSaved(result.project);
      setSaveError('');
      return result;
    }
    setSaveError(result.error || 'Could not save.');
    return result;
  }

  if (screen === 'preview' && projectHasPages(project)) {
    return (
      <div className="cr-app">
        <PreviewScreen
          project={project}
          onBackToEditor={() => setScreen('editor')}
        />
        <ConfirmDialog
          open={resetOpen}
          title="Reset project"
          message={
            resetError ||
            'Start fresh? This clears the saved project and attachments in this browser.'
          }
          confirmLabel={resetBusy ? 'Resetting…' : 'Reset project'}
          danger
          onCancel={() => {
            if (resetBusy) return;
            setResetOpen(false);
            setResetError('');
          }}
          onConfirm={() => {
            if (!resetBusy && !resetError) confirmReset();
            else if (resetError) {
              setResetOpen(false);
              setResetError('');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={`cr-app ${setupOpen ? 'cr-app--setup-open' : ''}`}>
      <EditorScreen
        key={editorMountKey}
        project={project}
        dirty={dirty}
        saveError={saveError}
        onProjectChange={handleProjectChange}
        onSaveProject={handleSaveProject}
        onPreview={() => setScreen('preview')}
        onRequestReset={() => {
          setResetError('');
          setResetOpen(true);
        }}
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
      <ConfirmDialog
        open={resetOpen}
        title="Reset project"
        message={
          resetError ||
          'Start fresh? This clears the saved project and attachments in this browser. Cancellation leaves everything unchanged.'
        }
        confirmLabel={resetBusy ? 'Resetting…' : resetError ? 'Close' : 'Reset project'}
        danger={!resetError}
        onCancel={() => {
          if (resetBusy) return;
          setResetOpen(false);
          setResetError('');
        }}
        onConfirm={() => {
          if (resetBusy) return;
          if (resetError) {
            setResetOpen(false);
            setResetError('');
            return;
          }
          confirmReset();
        }}
      />
    </div>
  );
}
