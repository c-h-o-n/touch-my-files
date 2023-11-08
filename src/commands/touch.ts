import * as path from 'path';
import * as vscode from 'vscode';

import { showTouchPrompt } from '../lib/showTouchPrompt';

export default async function touch() {
  const activeEditor = vscode.window.activeTextEditor;
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length < 1) {
    vscode.window.showErrorMessage('Please open a workspace.');
    return;
  }

  if (workspaceFolders.length > 1) {
    vscode.window.showErrorMessage('Multi-root workspaces is not supported yet.');
    return;
  }

  const activeEditorPath = activeEditor?.document.uri.fsPath;

  const workspacePath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, workspaceFolders[0].name);

  const dirname = path.dirname(activeEditorPath || workspacePath);

  const newFilePath = await showTouchPrompt(dirname);

  const saveLocation  = path.join(dirname, newFilePath);

  console.log('Created new file as: ', newFilePath, '\nsaved to: ', saveLocation);

  const newFileUri = vscode.Uri.file(saveLocation);
  vscode.workspace.fs.writeFile(newFileUri, new Uint8Array());
}


