

declare module 'rsocket-websocket-server' {
    
    import { DuplexConnection } from "rsocket-types";
    import { Flowable } from "rsocket-flowable";
    import { TransportServer, Encoders } from "rsocket-core";
    /**
     * A WebSocket transport client for use in browser environments.
     */
    export type ServerOptions = {
        host?: string,
        port?: number,
        backlog?: number,
        server?: any,
        verifyClient?: Function,
        handleProtocols?: Function,
        path?: string,
        noServer?: boolean,
        clientTracking?: boolean,
        perMessageDeflate?: any,
        maxPayload?: number,
    };
  
    /**
     * A WebSocket transport server.
     */
    export default class RSocketWebSocketServer implements TransportServer {
    
        constructor(options: ServerOptions, encoders?: Encoders<any>);
    
        start(): Flowable<DuplexConnection>;
    
        stop(): void;
    }
}