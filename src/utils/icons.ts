import * as rbxIcons from 'rbx-icons';
import * as vscode from 'vscode';
import * as path from 'path';

import request from './request';

const ICON_INDEX_KEY = 'ICON_PATH_INDEX';
const CURRENT_VERSION_KEY = 'CURRENT_VERSION';

const INFO_URL = 'https://raw.githubusercontent.com/RobloxAPI/build-archive/master/data/production/latest.json';

export default function updateIcons(context: vscode.ExtensionContext): Promise<IconPathIndex> {
    return new Promise(resolve => {
        let currentIcons: IconPathIndex | undefined = context.globalState.get(ICON_INDEX_KEY);
        let currentVersion = context.globalState.get(CURRENT_VERSION_KEY);

        request(INFO_URL).then(infoBody => {
            if (infoBody.GUID !== currentVersion || !currentIcons || (currentIcons && !Object.values(currentIcons).length)) {
                rbxIcons.generate(path.join(context.globalStoragePath, 'resources')).then(iconPathIndex => {
                    context.globalState.update(ICON_INDEX_KEY, iconPathIndex);
                    context.globalState.update(CURRENT_VERSION_KEY, infoBody.GUID);

                    resolve(iconPathIndex);
                }).catch(err => {
                    console.error(err);

                    if (currentIcons) {
                        vscode.window.showWarningMessage('Failed to get latest class icons; falling back to cache.');

                        resolve(currentIcons);
                    } else {
                        vscode.window.showWarningMessage('Failed to get latest class icons and no cached icons exist. Continuing without icons.');

                        resolve({});
                    }
                });
            } else {
                resolve(currentIcons);
            }
        }).catch(err => {
            console.error(err);

            if (currentIcons) {
                vscode.window.showWarningMessage('Failed to get latest Roblox version for class icons; falling back to cache.');

                resolve(currentIcons);
            } else {
                vscode.window.showWarningMessage('Failed to get latest class icons and no cached icons exist. Continuing without icons.');

                resolve({});
            }
        });
    });
}