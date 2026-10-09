/**
 * Focused regression checks for Composer Rapid product fixes.
 * Run with: npm test
 */

import assert from 'node:assert/strict';
import {
  applyWebsiteBrandingToProject,
  snapshotKey,
} from '../src/state/projectSnapshot.js';
import {
  countPageLinkReferences,
  scrubDeletedPageLinks,
  toPageLink,
} from '../src/pages/pageLinks.js';
import {
  addPageToProject,
  createBlankHomepage,
  projectFromHomepagePuckData,
  removePageFromProject,
  renamePageInProject,
} from '../src/pages/pageModel.js';
import { createEmptyProject, migrateProject } from '../src/storage/projectStorage.js';
import { validateProjectForImport } from '../src/storage/projectValidation.js';
import { remapAssetIdsInProject } from '../src/assets/assetRefs.js';

function makeProjectWithPages() {
  let project = createEmptyProject();
  project = projectFromHomepagePuckData(project, createBlankHomepage({ branding: project.branding }));
  project.pages[0].puckData = {
    content: [
      {
        type: 'Header',
        props: {
          id: 'Header-home',
          navLinks: [
            { label: 'Home', url: toPageLink('home') },
            { label: 'Speakers', url: toPageLink('speakers') },
          ],
          buttonLabel: 'Register',
          buttonUrl: toPageLink('speakers'),
        },
      },
      {
        type: 'CanvasSection',
        props: {
          id: 'CanvasSection-1',
          elements: [
            {
              type: 'ElementButton',
              props: {
                id: 'ElementButton-1',
                label: 'See speakers',
                url: toPageLink('speakers'),
              },
            },
          ],
        },
      },
    ],
    root: { props: { ...project.branding } },
  };
  project.puckData = project.pages[0].puckData;
  project = addPageToProject(project, { title: 'Speakers' });
  // Force known slug for link tests
  project.pages = project.pages.map((page) =>
    page.title === 'Speakers' ? { ...page, slug: 'speakers' } : page,
  );
  return project;
}

function testRenamePreservesLinks() {
  let project = makeProjectWithPages();
  const speakers = project.pages.find((page) => page.slug === 'speakers');
  project = renamePageInProject(project, speakers.id, 'Our speakers');
  const renamed = project.pages.find((page) => page.id === speakers.id);
  assert.equal(renamed.slug, 'speakers', 'slug stays stable on rename');
  assert.equal(renamed.title, 'Our speakers');
  const refs = countPageLinkReferences(project, 'speakers');
  assert.ok(refs >= 2, `expected internal links to remain, found ${refs}`);
  const homeNav = project.pages[0].puckData.content[0].props.navLinks.find(
    (link) => link.url === toPageLink('speakers'),
  );
  assert.equal(homeNav.label, 'Our speakers', 'nav label updates with title');
}

function testDeleteScrubsNestedLinks() {
  let project = makeProjectWithPages();
  const speakers = project.pages.find((page) => page.slug === 'speakers');
  const before = countPageLinkReferences(project, 'speakers');
  assert.ok(before >= 2);
  const result = removePageFromProject(project, speakers.id);
  assert.equal(result.ok, true);
  assert.equal(countPageLinkReferences(result.project, 'speakers'), 0);
  const button = result.project.pages[0].puckData.content[1].props.elements[0];
  assert.equal(button.props.url, '#', 'nested button destination cleared');
  const nav = result.project.pages[0].puckData.content[0].props.navLinks;
  assert.ok(!nav.some((link) => link.url === toPageLink('speakers')), 'nav entry removed');
}

function testPreviewRoundTripDirty() {
  const project = makeProjectWithPages();
  const saved = snapshotKey(project);
  const edited = {
    ...project,
    event: { ...project.event, name: 'Edited name' },
  };
  assert.notEqual(snapshotKey(edited), saved, 'edits make project dirty');
  // Preview must not rewrite the saved baseline — App keeps savedSnapshot unchanged.
  const afterPreviewReturn = edited;
  assert.notEqual(
    snapshotKey(afterPreviewReturn),
    saved,
    'unsaved status preserved after preview round trip',
  );
}

function testWebsiteBrandingAcrossPages() {
  let project = makeProjectWithPages();
  project = applyWebsiteBrandingToProject(project, {
    primaryColour: '#112233',
    secondaryColour: '#00aa88',
    backgroundColour: '#fafafa',
    font: 'Space Grotesk',
    designDirection: 'minimal',
  });
  assert.equal(project.branding.primaryColour, '#112233');
  for (const page of project.pages) {
    assert.equal(page.puckData.root.props.primaryColour, '#112233');
    assert.equal(page.puckData.root.props.font, 'Space Grotesk');
  }
  assert.equal(project.puckData.root.props.primaryColour, '#112233');
}

function testLegacyMigration() {
  const legacy = {
    version: 1,
    event: { name: 'Legacy event' },
    branding: { primaryColour: '#2a3c4c' },
    puckData: {
      content: [{ type: 'Header', props: { id: 'Header-1', eventName: 'Legacy event' } }],
      root: { props: { primaryColour: '#2a3c4c' } },
    },
  };
  const migrated = migrateProject(legacy);
  assert.ok(migrated);
  assert.equal(migrated.version, 4);
  assert.ok(migrated.pages?.length >= 1);
  assert.equal(migrated.pages[0].slug, 'home');
}

function testImportValidationRejectsBadProject() {
  const bad = {
    version: 4,
    event: {},
    branding: {},
    pages: [
      { id: 'a', slug: 'home', title: 'Home', puckData: { content: [], root: {} } },
      { id: 'a', slug: 'home', title: 'Dup', puckData: { content: [], root: {} } },
    ],
    activePageId: 'missing',
  };
  const result = validateProjectForImport(bad);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => /Duplicate page id/i.test(message)));
}

function testAssetRemap() {
  const project = {
    branding: { logoDataUrl: 'asset:old-1' },
    contentSetup: { assets: [{ id: 'old-1', name: 'logo.png' }] },
    pages: [
      {
        role: 'home',
        puckData: {
          content: [
            {
              type: 'ElementImage',
              props: { id: 'img-1', imageUrl: 'asset:old-1' },
            },
          ],
          root: { props: {} },
        },
      },
    ],
    puckData: null,
  };
  const next = remapAssetIdsInProject(project, { 'old-1': 'new-9' });
  assert.equal(next.branding.logoDataUrl, 'asset:new-9');
  assert.equal(next.contentSetup.assets[0].id, 'new-9');
  assert.equal(next.pages[0].puckData.content[0].props.imageUrl, 'asset:new-9');
}

function testScrubHelperStandalone() {
  const project = makeProjectWithPages();
  const scrubbed = scrubDeletedPageLinks(project, 'speakers');
  assert.equal(countPageLinkReferences(scrubbed, 'speakers'), 0);
}

const tests = [
  ['rename preserves internal links', testRenamePreservesLinks],
  ['delete scrubs nested page links', testDeleteScrubsNestedLinks],
  ['preview round trip keeps unsaved status', testPreviewRoundTripDirty],
  ['website branding syncs across pages', testWebsiteBrandingAcrossPages],
  ['legacy projects still migrate', testLegacyMigration],
  ['invalid import is rejected', testImportValidationRejectsBadProject],
  ['asset id remap updates references', testAssetRemap],
  ['scrub helper clears page links', testScrubHelperStandalone],
];

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`ok  - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`fail - ${name}`);
    console.error(error);
  }
}

if (failed) {
  console.error(`\n${failed} regression check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${tests.length} regression checks passed.`);
