import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "touchmyfiles" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('touchmyfiles.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from TouchMyFiles!');

	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
