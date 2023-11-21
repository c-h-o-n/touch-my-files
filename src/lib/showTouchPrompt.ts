import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as braces from 'braces';

export async function showTouchPrompt(editorPath: string): Promise<string[]> {
  return new Promise(resolve => {
    const openedWorkspaces = vscode.workspace.workspaceFolders;
    if (!openedWorkspaces) {
      return;
    }

    const quickPick = vscode.window.createQuickPick();

    let choices: string[] = fs
      .readdirSync(editorPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(dirent.name, '/'));

    quickPick.items = choices.map(choice => ({ label: choice, iconPath: vscode.ThemeIcon.Folder }));

    let inputs: string[] = quickPick.value.split(' ');
    let lastInput: string = inputs[inputs.length - 1];
    let bracedInputs: string[] = inputs.map(input => braces.expand(input)).flat();

    quickPick.placeholder = path.relative(openedWorkspaces[0].uri.fsPath, editorPath) + '/';
    quickPick.title = 'Create new file relative to the currently opened in editor.';

    quickPick.onDidChangeValue(() => {
      inputs = quickPick.value.split(' ');
      lastInput = inputs[inputs.length - 1];

      bracedInputs = inputs.map(input => braces.expand(input)).flat();

      quickPick.title = 'You are about to create ' + bracedInputs.length + ' file(s)';

      const currentlyScopedDir = lastInput.substring(0, lastInput.lastIndexOf('/'));
      try {
        choices = fs
          .readdirSync(path.join(editorPath, currentlyScopedDir), { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => path.join(currentlyScopedDir, dirent.name, '/'));
      } catch (error) {
        console.log("Dir doesn't exists");
      }

      let quickPickItems: vscode.QuickPickItem[] = choices.map(value => ({
        label: value,
        iconPath: vscode.ThemeIcon.Folder,
        alwaysShow: true,
      }));

      if (lastInput !== '') {
        quickPickItems = [{ label: lastInput, iconPath: vscode.ThemeIcon.File, alwaysShow: true }, ...quickPickItems];
      }

      quickPick.items = [...quickPickItems];
    });

    quickPick.onDidAccept(() => {
      const selection = quickPick.activeItems[0];

      if (choices.find(choice => choice === selection.label)) {
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
