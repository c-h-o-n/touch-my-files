import * as path from 'path';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "touch-my-files" is now active! 🎉');

  let disposable = vscode.commands.registerCommand('touch-my-files.helloWorld', async () => {
    const activeEditor = vscode.window.activeTextEditor;

    if (!activeEditor) {
      vscode.window.showInformationMessage('Please open a file first!');
      return;
    }

    const activeEditerPath = activeEditor.document.uri.fsPath;

    const editorDir = path.dirname(activeEditerPath);

    vscode.window.showInformationMessage('dir: ' + editorDir);

    vscode.window.showInputBox({ prompt: 'Enter the filename', placeHolder: 'e.g. package.json' })
      .then(newFileName => {
        if (!newFileName) {
          vscode.window.showInformationMessage('No filename entered');
          return;
        }

        const newFileUri = vscode.Uri.file(path.join(editorDir, newFileName));

        vscode.workspace.fs.writeFile(newFileUri, new Uint8Array());
      });
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
