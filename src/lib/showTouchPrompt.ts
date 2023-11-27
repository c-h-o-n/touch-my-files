import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as braces from 'braces';
import * as fuzzy from 'fuzzy';

export async function showTouchPrompt(editorPath: string): Promise<string[]> {
  function getFuzzySearchTerm(input: string) {
    if (!input || path.normalize(input) === './') {
      return '';
    }

    return path.normalize(input);
  }

  function getRelativeDirectoriePathsInScope(scopedPathToRead: string): string[] | undefined {
    try {
      return fs
        .readdirSync(path.join(editorPath, scopedPathToRead), { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => path.join(scopedPathToRead, dirent.name, '/'));
    } catch (error) {
      console.error("Dir doesn't exists", error);
      return;
    }
  }

  return new Promise(resolve => {
    const openedWorkspaces = vscode.workspace.workspaceFolders;
    if (!openedWorkspaces) {
      return;
    }

    const quickPick = vscode.window.createQuickPick();

    let dirNames: string[] = getRelativeDirectoriePathsInScope('') || [];

    quickPick.items = dirNames.map(dirName => ({ label: dirName, iconPath: vscode.ThemeIcon.Folder }));

    let inputs: string[] = quickPick.value.split(' ');
    let bracedInputs: string[] = inputs.map(input => braces.expand(input)).flat();

    quickPick.placeholder = path.relative(openedWorkspaces[0].uri.fsPath, editorPath) + '/';
    quickPick.title = 'Create new file relative to the currently opened in editor.';

    quickPick.onDidChangeValue(() => {
      inputs = quickPick.value.split(' ');
      const lastInput = inputs[inputs.length - 1];

      bracedInputs = inputs.map(input => braces.expand(input)).flat();
      quickPick.title = 'You are about to create ' + bracedInputs.length + ' file(s)';

      const currentlyScopedDir = path.normalize(lastInput.substring(0, lastInput.lastIndexOf('/')));

      dirNames = getRelativeDirectoriePathsInScope(currentlyScopedDir) || [];

      const fuzzyFilteredDirNames = fuzzy.filter(getFuzzySearchTerm(lastInput), dirNames).map(value => value.string);

      const newQuickPickItems: vscode.QuickPickItem[] = fuzzyFilteredDirNames.map(dirName => ({
        label: dirName,
        iconPath: vscode.ThemeIcon.Folder,
        alwaysShow: true,
      }));

      if (
        lastInput !== '' &&
        !lastInput.endsWith('/') &&
        !dirNames.some(dirName => path.normalize(lastInput) + '/' === dirName)
      ) {
        newQuickPickItems.unshift({ label: path.normalize(lastInput), iconPath: vscode.ThemeIcon.File, alwaysShow: true });
      }

      quickPick.items = newQuickPickItems;
    });

    quickPick.onDidAccept(() => {
      const selection = quickPick.activeItems[0];

      if (dirNames.find(dirName => dirName === selection.label)) {
        if (inputs.length < 2) {
          quickPick.value = selection.label;
          return;
        }

        quickPick.value = inputs.filter((_, idx) => idx < inputs.length - 1).join(' ') + ' ' + selection.label;
        return;
      }

      if (quickPick.value.at(-1) === '/') {
        vscode.window.showErrorMessage('Please enter a file name.');
        return;
      }

      resolve(bracedInputs.map(input => path.normalize(input)));
      quickPick.hide();
    });

    quickPick.show();
  });
}
