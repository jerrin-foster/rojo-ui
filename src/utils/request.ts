// All this because request doesn't automatically parse json -_-

import * as requestPromise from 'request-promise';
import * as requestOriginal from 'request';

const request = requestPromise.defaults({
    transform: (body: string, res: requestOriginal.Response) => {
        try {
            return JSON.parse(body);
        } catch(err) {
            return body;
        }
    }
});

export default request;