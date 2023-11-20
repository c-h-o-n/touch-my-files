import * as path from 'path';
import * as vscode from 'vscode';
import * as braces from 'braces';

import { showTouchPrompt } from '../lib/showTouchPrompt';
import createFile from '../lib/createFile';

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

  const newFileNames = await showTouchPrompt(dirname);

  const bracedFileNames = newFileNames.map(fileName => braces.expand(fileName)).flat();
  
  bracedFileNames.map(fileName => {
    console.log({ braced: fileName });
    const saveLocation = path.join(dirname, fileName);
    createFile(saveLocation);
  });
}
