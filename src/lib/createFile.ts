import * as path from 'path';
import * as vscode from 'vscode';

export default function createFile(location: string) {
  const newFileUri = vscode.Uri.file(location);
  vscode.workspace.fs.writeFile(newFileUri, new Uint8Array());
  console.log('Created to: ', newFileUri);
}
