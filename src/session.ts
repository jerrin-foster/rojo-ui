import { URL } from 'url';
import request from './utils/request';

export default class RojoSession {
	constructor (
		public name: string,
		public host: string,
		public port: number,

		public info: RojoSessionData
    ) {}
    
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