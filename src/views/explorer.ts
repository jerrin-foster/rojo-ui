import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import * as prop from './properties';

import request from '../utils/request';
import window from '../utils/window';

import getIconIndex from '../utils/icons';
import RojoSession from '../session';

export class Item extends vscode.TreeItem {
    constructor (
        public label: string,
        public state: number | vscode.TreeItemCollapsibleState,

        public instance: RojoInstance,
        public session: RojoSession,

        public iconPath: string,
        public subText: string = '',
        public contextValue?: string
    ) {
        super(label, state);

        if (this.instance.ClassName === 'DataModel') {
            this.contextValue = 'rojo-ui.sessionContainer';
        }
    }

    get tooltip(): string {
        return this.instance.ClassName;
    }

    get description(): string {
        return this.subText;
    }
}

class ExplorerProvider implements vscode.TreeDataProvider<Item> {
    constructor (
        public context: vscode.ExtensionContext,
        public sessions: RojoSession[],

        public meta: {
            rbxAPI: RbxAPI,
            iconPathIndex: IconPathIndex,
            sortOrder: { [className: string]: number }
        }
    ) {}

    private _onDidChangeTreeData = new vscode.EventEmitter<Item | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    
    getTreeItem(item: Item): Item {
        item.command = { command: 'rojo-ui.action.open', title: 'Open file', arguments: [item] };

        switch (item.instance.ClassName) {
            case 'ModuleScript':
            case 'LocalScript':
            case 'Script':
                item.command.arguments?.push(true);
            
            default: break;
        }

        return item;
    }

    getChildren(item?: Item): Promise<Item[]> {
        return new Promise(async resolve => {
            let children: Item[] = [];

            if (item) {
                for (let childId of item.instance.Children) {
                    let child = await item.session.getInstance(childId);

                    children.push(new Item(
                        child.Name, child.Children.length > 0 ? 1 : 0, child, item.session, this.getClassIconPath(child.ClassName)
                    ));
                }

                let sortOrder = this.meta.sortOrder;

                children.sort((a, b) => {
                    return sortOrder[a.instance.ClassName] - sortOrder[b.instance.ClassName];
                });

            } else {
                for (let session of this.sessions) {
                    children.push(new Item(
                        session.name, 2, await session.getInstance(session.info.rootInstanceId),
                        session, '', session.port.toString()
                    ));
                }
            }

            resolve(children);
        });
    }

    getClassIconPath(className: string) {
        return this.meta.iconPathIndex[className];
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }
}

function applyCustomIcons(iconPathIndex: IconPathIndex, dir?: string) {
    if (dir) {
        fs.readdir(dir, (err, files) => {
            if (!err) {
                for (let className in iconPathIndex) {
                    let filePath = path.join(dir, className + '.png');

                    if (fs.existsSync(filePath)) {
                        iconPathIndex[className] = filePath;
                    }
                }
            }
        });
    }
}

export async function handler(context: vscode.ExtensionContext, propertyProvider: prop.PropertiesProvider) {
    let iconPathIndex = await getIconIndex(context);
    let sortOrder: { [className: string]: number } = {};
    let sessions: RojoSession[] = [];

    applyCustomIcons(iconPathIndex, vscode.workspace.getConfiguration('rojo-ui').get('iconFolder'));

    request('https://reflection.rbx-api.xyz/v1/all').then((dump: RbxReflection) => {
        propertyProvider.api = dump;

        for (let rbxClass of Object.values(dump.api.Classes)) {
            sortOrder[rbxClass.Name] = rbxClass.SortOrder;
        }

        const provider = new ExplorerProvider(context, sessions, {
            rbxAPI: dump.api,
            iconPathIndex: iconPathIndex,
            sortOrder: sortOrder
        });

        vscode.window.createTreeView('rojo-ui.view.explorer', {
            treeDataProvider: provider,
            canSelectMany: true
        });

        let validators: Dictionary<Fn> = {
            name: (str: string) => {
                if (!str) {
                    return 'A name must be specified.';
                } else {
                    let session = sessions.find((s: RojoSession) => { return s.name === str; });

                    if (session) {
                        return `Another project is already using that name.`;
                    }
                }
            },

            port: async (str: string) => {
                let port = Number(str);

                if (!port || port < 1 || port > 65535) {
                    return 'Invalid port specified.';
                } else {
                    let session = sessions.find((s: RojoSession) => { return s.port === port; });

                    if (session) {
                        return `${session.name} is already using that port.`;
                    } else {
                        try {
                            await request({ uri: `http://localhost:${port}/api/rojo`, timeout: 100 });
                        } catch (err) {
                            return 'Couldn\'t find Rojo on that port.';
                        }
                    }
                }
            }
        };

        let genericMessage = 'Rojo\'s two-way sync API is incomplete.';

        let commands: Dictionary<Fn> = {
            'connect': async (name, port) => {
                port = port || await window.showInputBox({ validateInput: validators.port, value: '34872', prompt: 'What port is Rojo listening on?' });

                if (port) {
                    name = name || await window.showInputBox({ validateInput: validators.name, prompt: 'What would you like to name the project?' });

                    if (name) {
                        request(`http://localhost:${port}/api/rojo`).then(info => {
                            sessions.push(new RojoSession(name, 'localhost', Number(port), info)); provider.refresh();
                        }).catch(err => {
                            console.error(err); window.showError('Couldn\'t connect to Rojo.');
                        });
                    }
                }
            },

            'disconnect': (item: Item) => {
                if (propertyProvider.currentItem?.session === item.session) {
                    propertyProvider.refresh();
                }

                let index = sessions.indexOf(item.session);

                if (index >= 0) {
                    sessions.splice(index, 1);
                }

                provider.refresh();
            },

            'open': (item: Item, isSourceContainer: boolean) => {
                if (isSourceContainer) {
                    item.session.open(item.instance.Id).catch(err => {});
                }
                
                propertyProvider.refresh(item);
            },

            'rename': async (item: Item) => {
                if (item.instance.ClassName === 'DataModel') {
                    let name = await window.showInputBox({ validateInput: validators.name, value: item.label });
                    
                    if (name) {
                        item.session.name = name;

                        provider.refresh();
                    }
                } else {
                    window.showWarning(genericMessage);
                }
            },

            'cut': (item: Item) => window.showWarning(genericMessage),
            'copy': (item: Item) => window.showWarning(genericMessage),
            'paste': (item: Item) => window.showWarning(genericMessage),
            'duplicate': (item: Item) => window.showWarning(genericMessage),
            'delete': (item: Item) => window.showWarning(genericMessage),
            'group': (item: Item) => window.showWarning(genericMessage),
            'ungroup': (item: Item) => window.showWarning(genericMessage),
            'selectChildren': (item: Item) => window.showWarning(genericMessage),
            'insertInstance': (item: Item) => window.showWarning(genericMessage),
            'insertFile': (item: Item) => window.showWarning(genericMessage)
        };

        setInterval(async () => {
            for (let session of sessions) {
                try {
                    await request({ uri: `http://localhost:${session.port}/api/rojo`, timeout: 100 });
                } catch (err) {
                    commands.disconnect({ session: session });
                    
                    window.showWarning(`Disconnected from project ${session.name} on port ${session.port}`);
                    
                    provider.refresh();
                }
            }
        }, 1000);

        for (let cmdName in commands) {
            vscode.commands.registerCommand('rojo-ui.action.' + cmdName, commands[cmdName]);
        }
    });
}