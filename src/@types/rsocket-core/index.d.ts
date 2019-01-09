declare module "rsocket-core" {
    import { DuplexConnection, Responder, PartialResponder, Encodable, ReactiveSocket, Payload, Frame, ConnectionStatus } from "rsocket-types";
    import { Single, Flowable } from "rsocket-flowable";

    export type Serializer<T> = {
        deserialize: (data: Encodable) => T,
        serialize: (data: T) => Encodable,
    };
    
    export type PayloadSerializers<D, M> = {
        data: Serializer<D>,
        metadata: Serializer<M>,
    };
    
    export type ClientConfig<D, M> = {
        serializers?: PayloadSerializers<D, M>,
        setup: {
          dataMimeType: string,
          keepAlive: number,
          lifetime: number,
          metadataMimeType: string,
        },
        transport: DuplexConnection,
        responder?: Responder<D, M>,
    };
      
      /**
       * RSocketClient: A client in an RSocket connection that will communicates with
       * the peer via the given transport client. Provides methods for establishing a
       * connection and initiating the RSocket interactions:
       * - fireAndForget()
       * - requestResponse()
       * - requestStream()
       * - requestChannel()
       * - metadataPush()
       */
    export class RSocketClient<D, M> {
      
        constructor(config: ClientConfig<D, M>);
      
        close(): void;
      
        connect(): Single<ReactiveSocket<D, M>>;
    }


    export interface TransportServer {
        start(): Flowable<DuplexConnection>,
        stop(): void,
    }

    export type ServerConfig<D, M> = {
        getRequestHandler: (socket: ReactiveSocket<D, M>, payload: Payload<D, M>,) => PartialResponder<D, M>,
        serializers?: PayloadSerializers<D, M>,
        transport: TransportServer,
    };
  
  /**
   * RSocketServer: A server in an RSocket connection that accepts connections
   * from peers via the given transport server.
   */
    export class RSocketServer<D, M> {
    
        constructor(config: ServerConfig<D, M>);
    
        start(): void;
    
        stop(): void;
    }

    export type Encoder<T extends Encodable> = {
        byteLength: (value: Encodable) => number,
        encode: (
          value: Encodable,
          buffer: Buffer,
          start: number,
          end: number,
        ) => number,
        decode: (buffer: Buffer, start: number, end: number) => T,
    };
      
      /**
       * The Encoders object specifies how values should be serialized/deserialized
       * to/from binary.
       */
    export type Encoders<T extends Encodable> = {
        data: Encoder<T>,
        dataMimeType: Encoder<string>,
        message: Encoder<string>,
        metadata: Encoder<T>,
        metadataMimeType: Encoder<string>,
        resumeToken: Encoder<T>,
    };

    export const UTF8Encoder: Encoder<string>;
      
    export const BufferEncoder: Encoder<Buffer>;
      
      /**
       * Encode all values as UTF8 strings.
       */
    export const Utf8Encoders: Encoders<string>;
      
      /**
       * Encode all values as buffers.
       */
    export const BufferEncoders: Encoders<Buffer>;

    export type Options = {
        bufferSize: number,
        resumeToken: string,
    };

    export class RSocketResumableTransport implements DuplexConnection {
      
        constructor(source: () => DuplexConnection, options: Options);
      
        close(): void;
      
        connect(): void;
      
        connectionStatus(): Flowable<ConnectionStatus>;
      
        receive(): Flowable<Frame>;
      
        sendOne(frame: Frame): void;
      
        send(frames: Flowable<Frame>): void;
    }
}