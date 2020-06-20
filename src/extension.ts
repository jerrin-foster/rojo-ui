import * as vscode from 'vscode';
import * as fs from 'fs';

import * as explorer from './views/explorer';
import * as properties from './views/properties';

export async function activate(context: vscode.ExtensionContext) {
	if (!fs.existsSync(context.globalStoragePath)) {
        fs.mkdirSync(context.globalStoragePath);
	}
	
	explorer.handler(context, properties.handler(context));
}