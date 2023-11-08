import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';


export async function showTouchPrompt(editorPath: string): Promise<string> {
  return new Promise(resolve => {
    let choices = fs
      .readdirSync(editorPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(dirent.name, '/'));

    const quickPick = vscode.window.createQuickPick();

    quickPick.items = choices.map(choice => ({ label: choice }));

    const workspace = vscode.workspace.workspaceFolders;
    if (!workspace) {
      return;
    }
    quickPick.placeholder = path.relative(workspace[0].uri.fsPath, editorPath) + '/';
    quickPick.title = 'Create new file relative to the currently opened in editor.';

    quickPick.onDidChangeValue(() => {
      quickPick.title = path.join(editorPath, quickPick.value);

      try {
        choices = fs
          .readdirSync(path.join(editorPath, quickPick.value), { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => path.join(quickPick.value, dirent.name, '/'));
      } catch (error) {
        console.log("Dir doesn't exists");
      }

      if (quickPick.value === '') {
        quickPick.items = choices.map(label => ({ label: quickPick.value + label }));
        return;
      }

      // INJECT user values into proposed values
      quickPick.items = [quickPick.value, ...choices].map(label => ({ label: label }));
    });

    quickPick.onDidAccept(() => {
      const selection = quickPick.activeItems[0];

      if (choices.find(choice => choice === selection.label)) {
        quickPick.value = selection.label;
        return;
      }

      if (quickPick.value.at(-1) === '/') {
        vscode.window.showErrorMessage('Please enter a file name.');
        return;
      }

      resolve(path.normalize(selection.label));
      quickPick.hide();
    });
    quickPick.show();
  });
}