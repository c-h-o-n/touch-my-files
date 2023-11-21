import * as path from 'path';
import * as vscode from 'vscode';

export default function createFile(location: string) {
  if (location.endsWith('/')) {
    return;
  }

  const newFileUri = vscode.Uri.file(location);

  vscode.workspace.fs.writeFile(newFileUri, new Uint8Array());

  console.log('New file created: ', newFileUri.fsPath);
}
