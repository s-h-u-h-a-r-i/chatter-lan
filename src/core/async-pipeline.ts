type Awaitable<T> = T | PromiseLike<T>;

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };

/**
 * Discriminated result type used across the async pipeline API.
 */
export type Result<T, E> = Ok<T> | Err<E>;

type MapFn<T> = (value: T) => Awaitable<unknown>;
type ResultFn<T> = (value: T) => Awaitable<Result<unknown, unknown>>;
type MapParallelValues<T, Fns extends readonly MapFn<T>[]> = {
  [K in keyof Fns]: Fns[K] extends (value: T) => Awaitable<infer U> ? U : never;
};
type ParallelValues<T, Fns extends readonly ResultFn<T>[]> = {
  [K in keyof Fns]: Fns[K] extends (
    value: T
  ) => Awaitable<Result<infer U, unknown>>
    ? U
    : never;
};
type ParallelErrors<T, Fns extends readonly ResultFn<T>[]> = {
  [K in keyof Fns]: Fns[K] extends (
    value: T
  ) => Awaitable<Result<unknown, infer E>>
    ? E
    : never;
}[number];

/**
 * Helpers for creating and narrowing `Result` values.
 */
export const Result = {
  /**
   * Creates a successful result.
   *
   * @param value Value to wrap in `Ok`.
   */
  ok: <T>(value: T): Result<T, never> => ({ ok: true, value }),
  /**
   * Creates a failed result.
   *
   * @param error Error value to wrap in `Err`.
   */
  err: <E>(error: E): Result<never, E> => ({ ok: false, error }),
  /**
   * Returns `true` when the result is `Ok`.
   *
   * @param result Result value to test.
   */
  isOk: <T, E>(result: Result<T, E>) => result.ok === true,
  /**
   * Returns `true` when the result is `Err`.
   *
   * @param result Result value to test.
   */
  isErr: <T, E>(result: Result<T, E>) => result.ok === false,
};

/**
 * Standard error wrapper used by `AsyncPipeline` for unexpected exceptions.
 *
 * If a step throws instead of returning `Result.err(...)`, the thrown value is
 * wrapped as `PipelineError` so the pipeline can continue with a typed error path.
 */
export class PipelineError extends Error {
  override readonly cause?: unknown;

  constructor(cause?: unknown, message?: string) {
    super(message ?? (cause instanceof Error ? cause.message : undefined));
    this.name = 'PipelineError';
    this.cause = cause;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Composable async workflow that carries success and failure as `Result`.
 *
 * Use `AsyncPipeline` to chain asynchronous steps without throwing for expected
 * failures. Each step receives the successful value and returns either another
 * success (`Result.ok`) or failure (`Result.err`).
 *
 * Unexpected thrown exceptions are wrapped into `PipelineError` automatically.
 *
 * @example
 * const result = await AsyncPipeline.from(fetchUser(userId))
 *   .flatMap((user) => validateUser(user))
 *   .map((user) => user.profile)
 *   .recover(() => ({ displayName: 'Guest' }))
 *   .execute();
 *
 * if (Result.isOk(result)) {
 *   console.log(result.value.displayName);
 * }
 */
export class AsyncPipeline<T, E = never> {
  private constructor(private readonly promise: Promise<Result<T, E>>) {}

  /**
   * Starts a new pipeline from an existing `Result` or promise of `Result`.
   *
   * @param promise Initial result source.
   */
  static chain<T, E = never>(promise: Awaitable<Result<T, E>>) {
    return new AsyncPipeline(Promise.resolve(promise));
  }

  /**
   * Starts a successful pipeline from a plain value.
   *
   * @param value Initial success value.
   */
  static of<T>(value: T) {
    return AsyncPipeline.chain(Result.ok(value));
  }

  /**
   * Starts a pipeline from a promise-like value.
   *
   * Rejections are converted into `Result.err(new PipelineError(...))`.
   *
   * @param promise Promise-like value source.
   */
  static from<T>(promise: Awaitable<T>) {
    return AsyncPipeline.chain(
      Promise.resolve(promise)
        .then((value) => Result.ok(value))
        .catch((err) => Result.err(new PipelineError(err)))
    );
  }

  /**
   * Starts a pipeline directly from an existing `Result` source.
   *
   * @param result Result or promise of result.
   */
  static fromResult<T, E>(result: Awaitable<Result<T, E>>) {
    return AsyncPipeline.chain(result);
  }

  /**
   * Transforms the success value synchronously.
   *
   * @param fn Mapper applied when the pipeline is successful.
   */
  map<U>(fn: (value: T) => U) {
    return this._andThen((value) => Result.ok(fn(value)));
  }

  /**
   * Chains the pipeline with an async or sync result-producing function.
   *
   * @param fn Function that returns the next `Result`.
   */
  flatMap<U, F = never>(fn: (value: T) => Awaitable<Result<U, F>>) {
    return this._andThen(fn);
  }

  /**
   * Runs a side effect for a success value without changing that value.
   *
   * @param fn Side-effect function executed on success.
   */
  tap(fn: (value: T) => Awaitable<void>) {
    return this._andThen(async (value) => {
      await fn(value);
      return Result.ok(value);
    });
  }

  /**
   * Validates the success value with a predicate.
   *
   * When the predicate returns `true`, the current value continues through the
   * pipeline. When it returns `false`, the pipeline switches to `Err` using the
   * value produced by `onFail`.
   *
   * @param predicate Guard condition evaluated on success values.
   * @param onFail Error factory called when the predicate fails.
   * @example
   * const result = await AsyncPipeline.of('hello')
   *   .ensure(
   *     (value) => value.length >= 3,
   *     () => 'Too short'
   *   )
   *   .execute();
   */
  ensure<U extends T, F>(
    predicate: (value: T) => value is U,
    onFail: (value: T) => Awaitable<F>
  ): AsyncPipeline<U, E | F | PipelineError>;
  ensure<F>(
    predicate: (value: T) => Awaitable<boolean>,
    onFail: (value: T) => Awaitable<F>
  ): AsyncPipeline<T, E | F | PipelineError>;
  ensure<F>(
    predicate: (value: T) => Awaitable<boolean>,
    onFail: (value: T) => Awaitable<F>
  ) {
    return this._andThen(async (value) => {
      if (await predicate(value)) {
        return Result.ok(value);
      }

      return Result.err(await onFail(value));
    });
  }

  /**
   * Runs multiple mappers in parallel and returns all mapped values as a tuple.
   *
   * Any thrown exception is wrapped as `PipelineError`.
   *
   * @param fns Mapping functions executed concurrently.
   * @example
   * const pair = await AsyncPipeline.of('hello')
   *   .mapParallel(
   *     (value) => value.length,
   *     async (value) => value.toUpperCase()
   *   )
   *   .execute();
   */
  mapParallel<const Fns extends readonly MapFn<T>[]>(...fns: Fns) {
    return this._andThen(async (value) => {
      const values = (await Promise.all(fns.map((fn) => fn(value)))) as {
        [K in keyof Fns]: Awaited<ReturnType<Fns[K]>>;
      };

      return Result.ok(values as MapParallelValues<T, Fns>);
    });
  }

  /**
   * Runs multiple result-producing functions in parallel.
   *
   * Returns the first `Err` encountered in completion order of the collected
   * results. If all succeed, returns a tuple of success values.
   *
   * @param fns Functions executed concurrently for the same input.
   * @example
   * const result = await AsyncPipeline.of(input)
   *   .parallel(
   *     (value) => checkPermissions(value),
   *     (value) => loadPreferences(value)
   *   )
   *   .execute();
   */
  parallel<const Fns extends readonly ResultFn<T>[]>(...fns: Fns) {
    return this._andThen(async (value) => {
      type Values = ParallelValues<T, Fns>;
      type Errors = ParallelErrors<T, Fns>;

      const results = (await Promise.all(fns.map((fn) => fn(value)))) as {
        [K in keyof Fns]: Awaited<ReturnType<Fns[K]>>;
      };

      for (const result of results) {
        if (Result.isErr(result)) {
          return result as Result<never, Errors>;
        }
      }

      const values = results.map(
        (result) => (result as Ok<unknown>).value
      ) as Values;
      return Result.ok(values);
    });
  }

  /**
   * Recovers from an error by mapping it to a fallback success value.
   *
   * @param fn Recovery function producing a replacement value.
   */
  recover(fn: (error: E | PipelineError) => Awaitable<T>) {
    return this._orElse(async (error) => Result.ok(await fn(error)));
  }

  /**
   * Recovers from an error with a function that returns another `Result`.
   *
   * @param fn Recovery function producing the next result.
   * @example
   * const result = await AsyncPipeline.from(readConfig())
   *   .recoverWith((error) => {
   *     if (error instanceof PipelineError) {
   *       return Result.ok(defaultConfig);
   *     }
   *     return Result.err(error);
   *   })
   *   .execute();
   */
  recoverWith<F = never>(
    fn: (error: E | PipelineError) => Awaitable<Result<T, F>>
  ) {
    return this._orElse(fn);
  }

  /**
   * Runs an error side effect without changing the failure value.
   *
   * @param fn Side-effect function executed on error.
   */
  tapError(fn: (error: E | PipelineError) => Awaitable<void>) {
    return this._orElse(async (error) => {
      await fn(error);
      return Result.err(error);
    });
  }

  /**
   * Transforms an error value without recovering to success.
   *
   * @param fn Mapper applied when the pipeline is in an error state.
   */
  mapError<F>(fn: (error: E | PipelineError) => F) {
    return this._orElse((error) => Result.err(fn(error)));
  }

  /**
   * Converts any pipeline error into a predefined success fallback.
   *
   * @param fallback Value returned when an error occurs.
   */
  ignoreError(fallback: T) {
    return this.recover(() => fallback);
  }

  /**
   * Resolves the pipeline and returns its final `Result`.
   *
   * Any thrown exception from internal execution is wrapped in `PipelineError`.
   */
  async execute(): Promise<Result<T, E | PipelineError>> {
    try {
      return await this.promise;
    } catch (err) {
      return Result.err(new PipelineError(err));
    }
  }

  private _andThen<U, F = never>(
    fn: (value: T) => Awaitable<Result<U, F>>
  ): AsyncPipeline<U, E | F | PipelineError> {
    return AsyncPipeline.chain(
      (async (): Promise<Result<U, E | F | PipelineError>> => {
        try {
          const result = await this.promise;
          if (Result.isErr(result)) return result;

          return await fn(result.value);
        } catch (err) {
          return Result.err(new PipelineError(err));
        }
      })()
    );
  }

  private _orElse<F = never>(
    fn: (error: E | PipelineError) => Awaitable<Result<T, F>>
  ): AsyncPipeline<T, F | PipelineError> {
    return AsyncPipeline.chain(
      (async (): Promise<Result<T, F | PipelineError>> => {
        try {
          const result = await this.promise;
          if (Result.isOk(result)) return result;

          return await fn(result.error);
        } catch (err) {
          return Result.err(new PipelineError(err));
        }
      })()
    );
  }
}
