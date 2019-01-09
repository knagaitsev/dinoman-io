declare module 'rsocket-rpc-core' {
    import { PayloadSerializers } from "rsocket-core";
    import { Encodable, DuplexConnection, Responder, ReactiveSocket, Payload } from "rsocket-types";
    import { Single, Flowable } from "rsocket-flowable";

    export type ClientConfig<D, M> = {
        serializers?: PayloadSerializers<D, M>,
        setup: {
          keepAlive: number,
          lifetime: number,
          metadata?: Encodable,
        },
        transport: DuplexConnection,
        responder?: Responder<D, M>,
    }

    export class RpcClient<D, M> {
        constructor(config: ClientConfig<D, M>);
        close(): void; 
        connect(): Single<ReactiveSocket<D, M>>;
    }

    export class RequestHandlingRSocket implements Responder<Buffer, Buffer> {

        addService(service: string, handler: Responder<Buffer, Buffer>): void;

        fireAndForget(payload: Payload<Buffer, Buffer>): void;

        requestResponse(payload: Payload<Buffer, Buffer>,): Single<Payload<Buffer, Buffer>>

        requestStream(payload: Payload<Buffer, Buffer>,): Flowable<Payload<Buffer, Buffer>>;

        requestChannel(payloads: Flowable<Payload<Buffer, Buffer>>,): Flowable<Payload<Buffer, Buffer>>;

        metadataPush(payload: Payload<Buffer, Buffer>): Single<void>;
    }
}