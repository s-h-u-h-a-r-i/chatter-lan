type Result<O, E> = Ok<O> | Err<E>;

class Ok<O> {
  constructor(public readonly value: O) {}
  // #region Type Guards
  isOk(): this is Ok<O> {
    return true;
  }
  isErr(): this is Err<unknown> {
    return false;
  }
  // #endregion Type Guards

  // #region Transformations
  map<R>(fn: (value: O) => R): Ok<R> {
    return new Ok(fn(this.value));
  }
  async mapAsync<R>(fn: (value: O) => Promise<R>): Promise<Ok<R>> {
    return new Ok(await fn(this.value));
  }
  andThen<R, E>(fn: (value: O) => Result<R, E>): Result<R, E> {
    return fn(this.value);
  }
  mapErr<R>(_fn: (error: never) => R): this {
    return this;
  }
  async mapErrAsync<R>(_fn: (error: never) => Promise<R>): Promise<this> {
    return this;
  }
  or<R, F>(_other: Result<R, F>): this {
    return this;
  }
  orElse<R, F>(_fn: (error: never) => Result<R, F>): this {
    return this;
  }
  // #endregion Transformations

  // #region Pattern Matching
  match<U>(onOk: (v: O) => U, _onErr: (e: never) => U): U {
    return onOk(this.value);
  }
  // #endregion Pattern Matching

  // #region Side Effects
  tap(fn: (v: O) => void): this {
    fn(this.value);
    return this;
  }
  tapErr(_fn: (e: never) => void): this {
    return this;
  }
  // #endregion Side Effects

  // #region Unwrapping
  unwrap(): O {
    return this.value;
  }
  unwrapOr(_defaultValue: O): O {
    return this.value;
  }
  unwrapOrElse(_fn: (error: never) => O): O {
    return this.value;
  }
  expect(_message: string): O {
    return this.value;
  }
  // #endregion Unwrapping
}

class Err<E> {
  constructor(public readonly error: E) {}

  // #region Type Guards
  isOk(): this is Ok<unknown> {
    return false;
  }
  isErr(): this is Err<E> {
    return true;
  }
  // #endregion Type Guards

  // #region Transformations
  map<R>(_fn: (value: never) => R): this {
    return this;
  }
  async mapAsync<R>(_fn: (value: never) => Promise<R>): Promise<this> {
    return this;
  }
  andThen<R, F>(_fn: (value: never) => Result<R, F>): this {
    return this;
  }
  mapErr<R>(fn: (error: E) => R): Err<R> {
    return new Err(fn(this.error));
  }
  async mapErrAsync<R>(fn: (error: E) => Promise<R>): Promise<Err<R>> {
    return new Err(await fn(this.error));
  }
  or<R, F>(other: Result<R, F>): Result<R, F> {
    return other;
  }
  orElse<R, F>(fn: (error: E) => Result<R, F>): Result<R, F> {
    return fn(this.error);
  }
  // #endregion Transformations

  match<U>(_onOk: (v: never) => U, onErr: (e: E) => U): U {
    return onErr(this.error);
  }

  // #region Side Effects
  tap(_fn: (v: never) => void): this {
    return this;
  }
  tapErr(fn: (e: E) => void): this {
    fn(this.error);
    return this;
  }
  // #endregion Side Effects

  // #region Unwrapping
  unwrap(): never {
    throw this.error instanceof Error
      ? this.error
      : new Error(String(this.error));
  }
  unwrapOr<R>(defaultValue: R): R {
    return defaultValue;
  }
  unwrapOrElse<R>(fn: (error: E) => R): R {
    return fn(this.error);
  }
  expect(message: string): never {
    throw new Error(`${message}: ${this.error}`);
  }
  // #endregion Unwrapping
}

const Result = {
  // #region Constructors
  ok: <O>(value: O) => new Ok(value),
  err: <E>(error: E) => new Err(error),
  // #endregion Constructors

  // #region Utilities
  flatten: <O, E>(result: Result<Result<O, E>, E>): Result<O, E> => {
    return result.match(
      (inner) => inner,
      (err) => Result.err(err)
    );
  },
  // #endregion Utilities

  // #region Async
  fromPromise: async <O, E = unknown>(
    promise: Promise<O>
  ): Promise<Result<O, E>> => {
    try {
      const value = await promise;
      return Result.ok(value);
    } catch (error) {
      return Result.err(error as E);
    }
  },
  // #endregion Async
};

export { type Ok, type Err, Result };
