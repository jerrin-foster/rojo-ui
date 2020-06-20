import * as vscode from 'vscode';

const window = {
    showError: vscode.window.showErrorMessage,
    showWarning: vscode.window.showWarningMessage,
    showInfo: vscode.window.showInformationMessage,

    showInputBox: vscode.window.showInputBox,
    showQuickPick: vscode.window.showQuickPick,
};

export default window;