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

  return new Promise(resolve => {
    const openedWorkspaces = vscode.workspace.workspaceFolders;
    if (!openedWorkspaces) {
      return;
    }

    const quickPick = vscode.window.createQuickPick();

    let dirNames: string[] = fs
      .readdirSync(editorPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(dirent.name, '/'));

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

      try {
        dirNames = fs
          .readdirSync(path.join(editorPath, currentlyScopedDir), { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => path.join(currentlyScopedDir, dirent.name, '/'));
      } catch (error) {
        console.log("Dir doesn't exists");
      }

      const fuzzyFilteredDirNames = fuzzy.filter(getFuzzySearchTerm(lastInput), dirNames, {}).map(i => i.string);

      const newQuickPickItems: vscode.QuickPickItem[] = fuzzyFilteredDirNames.map(dirName => ({
        label: dirName,
        iconPath: vscode.ThemeIcon.Folder,
        alwaysShow: true,
      }));

      console.log({ dirNames, fuzzyFilteredDirNames, search: path.normalize(lastInput) });

      if (
        lastInput !== '' &&
        !lastInput.endsWith('/') &&
        !dirNames.some(dirName => path.normalize(lastInput) + '/' === dirName)
      ) {
        newQuickPickItems.unshift({ label: path.normalize(lastInput), iconPath: vscode.ThemeIcon.File, alwaysShow: true });
      }

      quickPick.items = [...newQuickPickItems];
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
