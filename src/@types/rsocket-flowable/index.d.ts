declare module 'rsocket-flowable' {

    import { IPublisher, ISubscriber, IPartialSubscriber, ISubject, ISubscription } from 'rsocket-types'

    export type CancelCallback = () => void;
    export interface IPartialFutureSubscriber<T> {
        readonly onComplete?: (value: T) => void,
        readonly onError?: (error: Error) => void,
        readonly onSubscribe?: (cancel: CancelCallback) => void,
    }
    export interface IFutureSubscriber<T> {
        readonly onComplete: (value: T) => void,
        readonly onError: (error: Error) => void,
        readonly onSubscribe: (cancel: CancelCallback) => void,
    }
    export interface IFutureSubject<T> {
        readonly onComplete: (value: T) => void,
        readonly onError: (error: Error) => void,
        readonly onSubscribe: (cancel?: CancelCallback) => void,
    }

    export class Single<T> {
        static of<U>(value: U): Single<U>;
      
        static error<U>(error: Error): Single<U>;
      
        constructor(source: (subject: IFutureSubject<T>) => void);
      
        subscribe(partialSubscriber?: IPartialFutureSubscriber<T>): void;
      
        flatMap<R>(fn: (data: T) => Single<R>): Single<R>;
      
        /**
         * Return a new Single that resolves to the value of this Single applied to
         * the given mapping function.
         */
        map<R>(fn: (data: T) => R): Single<R>;
      
        then(successFn?: (data: T) => void, errorFn?: (error: Error) => void): void;
    }


    export class Flowable<T> implements IPublisher<T> {
        static just<U>(...values: Array<U>): Flowable<U>;

        static error<U>(error: Error): Flowable<U>;

        static never<U>(): Flowable<U>;

        constructor(source: (subscriber: ISubscriber<T>) => void, max?: number);

        subscribe(subscriberOrCallback?: (IPartialSubscriber<T> | ((e: T) => void)),): void;

        lift<R>(onSubscribeLift: (subscriber: ISubscriber<R>) => ISubscriber<T>,): Flowable<R>;

        map<R>(fn: (data: T) => R): Flowable<R>;

        take(toTake: number): Flowable<T>;
    }
}