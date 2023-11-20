import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';

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
    let latestInput: string = inputs[inputs.length - 1];

    quickPick.placeholder = path.relative(openedWorkspaces[0].uri.fsPath, editorPath) + '/';
    quickPick.title = 'Create new file relative to the currently opened in editor.';

    quickPick.onDidChangeValue(() => {
      inputs = quickPick.value.split(' ');
      latestInput = inputs[inputs.length - 1];

      // TODO show how many files will be generated
      quickPick.title = inputs.map(input => path.join(editorPath, input)).join('\n');

      try {
        choices = fs
          .readdirSync(path.join(editorPath, latestInput), { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => path.join(latestInput, dirent.name, '/'));
      } catch (error) {
        console.log("Dir doesn't exists");
      }

      let quickPickItems: vscode.QuickPickItem[] = choices.map(value => ({
        label: value,
        iconPath: vscode.ThemeIcon.Folder,
        alwaysShow: true,
      }));

      if (latestInput !== '') {
        quickPickItems = [{ label: latestInput, iconPath: vscode.ThemeIcon.File, alwaysShow: true }, ...quickPickItems];
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

      resolve(inputs.map(input => path.normalize(input)));
      quickPick.hide();
    });

    quickPick.show();
  });
}
