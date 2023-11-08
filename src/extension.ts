import * as vscode from 'vscode';
import touch from './commands/touch';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "touch-my-files" is now active! 🎉');
  let disposable = vscode.commands.registerCommand('touch-my-files.touch', touch);

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
