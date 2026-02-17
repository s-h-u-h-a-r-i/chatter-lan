type Awaitable<T> = T | PromiseLike<T>;

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };

/**
 * Discriminated result type used across the async pipeline API.
 */
export type Result<T, E> = Ok<T> | Err<E>;

type Prettify<T> = { [K in keyof T]: T[K] } & {};
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
type ResultRecord = Record<PropertyKey, Awaitable<Result<unknown, unknown>>>;
type ResultRecordValues<R extends ResultRecord> = {
  [K in keyof R]: R[K] extends Awaitable<Result<infer U, unknown>> ? U : never;
};
type UnwrapRecordErrors<R extends ResultRecord> = Awaited<
  R[keyof R]
> extends Result<unknown, infer E>
  ? E
  : never;

/**
 * Helpers for creating and narrowing `Result` values.
 */
export const Result = {
  /**
   * Creates a successful result.
   *
   * @param value Value to wrap in `Ok`.
   */
  ok: <const T>(value: T): Result<T, never> => ({ ok: true, value }),
  /**
   * Creates a failed result.
   *
   * @param error Error value to wrap in `Err`.
   */
  err: <const E>(error: E): Result<never, E> => ({ ok: false, error }),
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
  /**
   * Wraps an async value in a `Result`, catching any thrown exceptions.
   *
   * If the awaited value succeeds, returns a `Result.ok` with the resolved value.
   * If the awaited value throws, returns a `Result.err` containing a `PipelineError`
   * that wraps the original exception.
   *
   * @template T The type of the resolved value.
   * @param value An Awaitable value (a Promise or value) to resolve.
   * @returns A Promise that resolves to a `Result` of the awaited value or a `PipelineError`.
   *
   * @example
   * const result = await Result.fromAsync(fetchSomeResource());
   * if (Result.isOk(result)) {
   *   // handle success
   * } else {
   *   // handle error (result.error is PipelineError)
   * }
   */
  fromAsync: async <T>(
    value: Awaitable<T>
  ): Promise<Result<T, PipelineError>> => {
    try {
      return Result.ok(await value);
    } catch (err) {
      return Result.err(new PipelineError(err));
    }
  },
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
 *   .andThen((user) => validateUser(user))
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
   * @example
   * const pipeline = AsyncPipeline.chain(Result.ok(10));
   * const result = await pipeline.execute();
   */
  static chain<T, E>(promise: Awaitable<Result<T, E>>) {
    return new AsyncPipeline(Promise.resolve(promise));
  }

  /**
   * Starts a successful pipeline from a plain value.
   *
   * @param value Initial success value.
   * @example
   * const result = await AsyncPipeline.of(21).map((n) => n * 2).execute();
   */
  static of<const T>(value: T) {
    return AsyncPipeline.chain(Result.ok(value));
  }

  /**
   * Starts a pipeline from a promise-like value.
   *
   * Rejections are converted into `Result.err(new PipelineError(...))`.
   *
   * @param promise Promise-like value source.
   * @example
   * const result = await AsyncPipeline.from(Promise.resolve('ready')).execute();
   */
  static from<T>(promise: PromiseLike<T>) {
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
   * @example
   * const existing = Result.ok({ id: 1 });
   * const result = await AsyncPipeline.fromResult(existing).execute();
   */
  static fromResult<T, E>(result: Awaitable<Result<T, E>>) {
    return AsyncPipeline.chain(result);
  }

  /**
   * Transforms the success value synchronously.
   *
   * @param fn Mapper applied when the pipeline is successful.
   * @example
   * const result = await AsyncPipeline.of(3).map((n) => n + 1).execute();
   */
  map<U>(fn: (value: T) => U) {
    return this._andThen((value) => Result.ok(fn(value)));
  }

  /**
   * Chains the pipeline with an async or sync result-producing function.
   *
   * @param fn Function that returns the next `Result`.
   * @example
   * const result = await AsyncPipeline.of('42')
   *   .andThen((value) => Result.ok(Number(value)))
   *   .execute();
   */
  andThen<U, F>(fn: (value: T) => Awaitable<Result<U, F>>) {
    return this._andThen(fn);
  }

  /**
   * Runs a result-producing step and stores its success value on a field.
   *
   * This is a convenience for the common "load something, then merge into context"
   * pattern used with object-shaped pipeline values. Existing keys may be
   * overwritten.
   *
   * @param key Field name to set on the current success object.
   * @param fn Result-producing function used to compute the field value.
   * @example
   * const result = await AsyncPipeline.of({ userId })
   *   .addField('profile', (ctx) => loadProfile(ctx.userId))
   *   .execute();
   */
  addField<
    T2 extends Record<PropertyKey, unknown>,
    const K extends PropertyKey,
    U,
    F
  >(
    this: AsyncPipeline<T2, E>,
    key: K,
    fn: (value: T2) => Awaitable<Result<U, F>>
  ) {
    type Updated = Prettify<Omit<T2, K & keyof T2> & Record<K, U>>;

    return this._andThen(async (value) => {
      const result = await fn(value);
      if (Result.isErr(result)) return result;

      return Result.ok({
        ...value,
        [key]: result.value,
      } as Updated);
    });
  }

  /**
   * Runs multiple result sources in parallel and merges successful values by key.
   *
   * The callback returns an object whose values are `Result` sources. All fields are
   * awaited concurrently. If any field resolves to `Err`, the pipeline fails with
   * that error. On success, all mapped values are merged into the current object,
   * overwriting existing keys when names collide.
   *
   * @param fn Factory that returns named result sources for concurrent execution.
   * @example
   * const result = await AsyncPipeline.of({ repository, userData })
   *   .addFieldsParallel(({ repository, userData }) => ({
   *     theme: repository.getTheme(userData.id),
   *     locale: repository.getLocale(userData.id),
   *   }))
   *   .execute();
   */
  addFieldsParallel<
    T2 extends Record<PropertyKey, unknown>,
    const R extends ResultRecord
  >(this: AsyncPipeline<T2, E>, fn: (value: T2) => Awaitable<R>) {
    return this._andThen(async (value) => {
      type Values = ResultRecordValues<R>;
      type Errors = UnwrapRecordErrors<R>;

      const resultRecord = await fn(value);
      const keys = Reflect.ownKeys(resultRecord) as (keyof R)[];
      const pairs = await Promise.all(
        keys.map(async (key) => [key, await resultRecord[key]] as const)
      );

      const merged = {} as Values;
      for (const [key, result] of pairs) {
        if (Result.isErr(result)) {
          return result as Result<never, Errors>;
        }

        (merged as Record<PropertyKey, unknown>)[key] = result.value;
      }

      return Result.ok({
        ...value,
        ...merged,
      } as Prettify<T2 & Values>);
    });
  }

  /**
   * Runs a side effect for a success value without changing that value.
   *
   * @param fn Side-effect function executed on success.
   * @example
   * const result = await AsyncPipeline.of('hello')
   *   .tap((value) => console.log(value))
   *   .execute();
   */
  tap(fn: (value: T) => Awaitable<void>) {
    return this._andThen(async (value) => {
      await fn(value);
      return Result.ok(value);
    });
  }

  /**
   * Runs a result-producing side effect without changing the success value.
   *
   * When `fn` returns `Ok`, the original value continues through the pipeline.
   * When `fn` returns `Err`, the pipeline switches to that error.
   *
   * @param fn Side-effect function that can fail with a `Result.err`.
   * @example
   * const result = await AsyncPipeline.of('hello')
   *   .flatTap((value) =>
   *     value.length > 3 ? Result.ok(undefined) : Result.err('Too short')
   *   )
   *   .execute();
   */
  flatTap<U, F>(fn: (value: T) => Awaitable<Result<U, F>>) {
    return this._andThen(async (value) => {
      const result = await fn(value);
      if (Result.isErr(result)) return result;
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
   * Traverses a success array by running a result-producing function per item.
   *
   * Iteration is sequential and stops at the first `Err`. If all items succeed,
   * returns an array of mapped values in the same order.
   *
   * @param fn Function executed for each item in the success array.
   * @example
   * const result = await AsyncPipeline.of(['a', 'bb'])
   *   .traverse((value) =>
   *     value.length > 0 ? Result.ok(value.length) : Result.err('Empty')
   *   )
   *   .execute();
   */
  traverse<Item, U, F>(
    this: AsyncPipeline<readonly Item[], E>,
    fn: (
      value: Item,
      index: number,
      items: readonly Item[]
    ) => Awaitable<Result<U, F>>
  ) {
    return this._andThen(async (items) => {
      const values: U[] = [];

      for (const [index, item] of items.entries()) {
        const result = await fn(item, index, items);
        if (Result.isErr(result)) return result;
        values.push(result.value);
      }

      return Result.ok(values);
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
   * Combines this pipeline with another result source into a tuple.
   *
   * The current pipeline is awaited first for its result, but note that `other`
   * (if provided as an existing AsyncPipeline or a Promise) may already be executing
   * or resolved in the background. Only after the current pipeline succeeds do we await
   * the result of `other` and return both success values as `[left, right]`.
   *
   * @param other Another pipeline or result source to combine with.
   * @example
   * const left = AsyncPipeline.of(2);
   * const right = AsyncPipeline.of(3);
   * const result = await left.zip(right).execute();
   */
  zip<U, F>(
    other: AsyncPipeline<U, F> | Awaitable<Result<U, F>>
  ): AsyncPipeline<[T, U], E | F | PipelineError> {
    const otherPromise =
      other instanceof AsyncPipeline ? other.promise : Promise.resolve(other);

    return this._andThen(async (left) => {
      const right = await otherPromise;
      if (Result.isErr(right)) return right;
      return Result.ok([left, right.value]);
    });
  }

  /**
   * Recovers from an error by mapping it to a fallback success value.
   *
   * @param fn Recovery function producing a replacement value.
   * @example
   * const result = await AsyncPipeline.from(Promise.reject('boom'))
   *   .recover(() => 'fallback')
   *   .execute();
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
   *   .orElse((error) => {
   *     if (error instanceof PipelineError) {
   *       return Result.ok(defaultConfig);
   *     }
   *     return Result.err(error);
   *   })
   *   .execute();
   */
  orElse<F>(fn: (error: E | PipelineError) => Awaitable<Result<T, F>>) {
    return this._orElse(fn);
  }

  /**
   * Runs an error side effect without changing the failure value.
   *
   * @param fn Side-effect function executed on error.
   * @example
   * const result = await AsyncPipeline.chain<string, string>(Result.err('Oops'))
   *   .tapError((error) => console.error(error))
   *   .execute();
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
   * @example
   * const result = await AsyncPipeline.chain<string, string>(Result.err('Oops'))
   *   .mapError((error) => ({ code: 'PIPELINE_ERROR', error }))
   *   .execute();
   */
  mapError<F>(fn: (error: E | PipelineError) => Awaitable<F>) {
    return this._orElse(async (error) => Result.err(await fn(error)));
  }

  /**
   * Converts any pipeline error into a predefined success fallback.
   *
   * @param fallback Value returned when an error occurs.
   * @example
   * const value = await AsyncPipeline.from(Promise.reject('offline'))
   *   .ignoreError('default')
   *   .getOrElse(() => 'unused');
   */
  ignoreError(fallback: T) {
    return this.recover(() => fallback);
  }

  /**
   * Resolves the pipeline into a value by providing a fallback for errors.
   *
   * @param onError Fallback factory called when the pipeline is in an error state.
   * @example
   * const value = await AsyncPipeline.chain<number, string>(Result.err('bad'))
   *   .getOrElse(() => 0);
   */
  async getOrElse(onError: (error: E | PipelineError) => Awaitable<T>) {
    const result = await this.execute();
    if (Result.isOk(result)) return result.value;
    return onError(result.error);
  }

  /**
   * Resolves the pipeline by mapping both success and error states to one value.
   *
   * @param onSuccess Mapper called when the pipeline succeeds.
   * @param onError Mapper called when the pipeline fails.
   * @example
   * const text = await AsyncPipeline.of(5).fold(
   *   (value) => `value=${value}`,
   *   (error) => `error=${String(error)}`
   * );
   */
  async fold<U>(
    onSuccess: (value: T) => Awaitable<U>,
    onError: (error: E | PipelineError) => Awaitable<U>
  ) {
    const result = await this.execute();
    if (Result.isOk(result)) return onSuccess(result.value);
    return onError(result.error);
  }

  /**
   * Resolves the pipeline and returns its final `Result`.
   *
   * Any thrown exception from internal execution is wrapped in `PipelineError`.
   *
   * @example
   * const result = await AsyncPipeline.of('done').execute();
   */
  async execute(): Promise<Result<T, E | PipelineError>> {
    try {
      return await this.promise;
    } catch (err) {
      return Result.err(new PipelineError(err));
    }
  }

  /**
   * Executes the pipeline and maps any {@link PipelineError} into a custom error type.
   *
   * This is useful if you want to intercept and transform unexpected exceptions
   * (wrapped in {@link PipelineError}) to a different error type, while preserving
   * any domain-specific error values.
   *
   * @template F The mapped error type for {@link PipelineError}.
   * @param mapError Function that maps a {@link PipelineError} to an error value of type F.
   * @returns A promise resolving to a {@link Result} containing:
   *   - On success: an `Ok<T>`.
   *   - On error: an `Err<E | F>` where domain errors remain as-is, and
   *     {@link PipelineError}s are mapped to F.
   *
   * @example
   * const pipeline = AsyncPipeline.from(fetchUser(userId));
   * const result = await pipeline.executeAs((err) => 'unexpected_error');
   * if (Result.isErr(result) && result.error === 'unexpected_error') {
   *   // handle unexpected system error
   * }
   */
  async executeAs<F>(
    mapError: (error: PipelineError) => F
  ): Promise<Result<T, E | F>> {
    const res = await this.execute();
    if (Result.isOk(res)) return res;
    if (res.error instanceof PipelineError) {
      return Result.err(mapError(res.error));
    }
    return Result.err(res.error);
  }

  private _andThen<U, F>(
    fn: (value: T) => Awaitable<Result<U, F>>
  ): AsyncPipeline<Prettify<U>, E | F | PipelineError> {
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

  private _orElse<F>(
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
