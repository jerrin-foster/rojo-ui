import { URL } from 'url';
import request from './utils/request';
import * as vscode from 'vscode';

export default class RojoSession {
	constructor (
		public name: string,
		public host: string,
		public port: number,

		public info: RojoSessionData
    ) {
        this.listen();
    }

    public connected = true;
    
    get url(): URL {
        return new URL(`http://${this.host}:${this.port}/api`);
    }

    public async read(instanceId: string): Promise<RojoResponse> {
        return request(`${this.url}/read/${instanceId}`);
    }

    public async write(body: Dictionary<any>): Promise<RojoResponse> {
        return request({ method: 'POST', uri: `${this.url}/write`, body: body, json: true });
    }

    public async open(instanceId: string, body: Dictionary<any> = {}): Promise<RojoResponse> {
        return request({ method: 'POST', uri: `${this.url}/open/${instanceId}`, body: body, json: true });
    }

    public async listen(cursor?: number) {
        if (this.connected) {
            request({ method: 'GET', uri: `${this.url}/subscribe/${cursor || 0}` }).then(data => {
                let messageCursor = Number(data.messageCursor);

                if (messageCursor) {
                    this.listen(messageCursor);
                }

                this._onUpdated.fire();
            }).catch(err => {
                this._onUpdated.fire(err);
            });
        }
    }

    private _onUpdated: vscode.EventEmitter<Error | void> = new vscode.EventEmitter();
    public onUpdated: vscode.Event<Error | void> = this._onUpdated.event;

    public async getInstance(instanceId: string): Promise<RojoInstance> {
        return new Promise((resolve, reject) => {
            this.read(instanceId).then(data => {
                if (data.instances) {
                    resolve(data.instances[instanceId]);
                } else {
                    reject('No instance list received from /api/read/{instanceId}');
                }
            }).catch(reject);
        });
    }
}