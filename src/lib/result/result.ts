/**
 * A result type that represents either a success (Ok) or failure (Err).
 *
 * @typeParam O - The type of the success value
 * @typeParam E - The type of the error value
 */
type Result<O, E> = Ok<O> | Err<E>;

/**
 * Represents a successful operation containing a value.
 *
 * @typeParam O - The type of the contained value
 *
 * @example
 * const success = Result.ok(42);
 * if (success.isOk()) {
 *    console.log(success.value); // 42
 * }
 */
class Ok<O> {
  /**
   * Creates a new Ok instance.
   *
   * @param value The successful value to wrap
   */
  constructor(public readonly value: O) {}

  // #region Type Guards

  /**
   * Checks if this result is an Ok variant.
   *
   * @returns Always returns `true` for Ok instances
   */
  isOk(): this is Ok<O> {
    return true;
  }
  /**
   * Checks if this result is an Err variant.
   *
   * @returns Always returns `false` for Ok instances
   */
  isErr(): this is Err<unknown> {
    return false;
  }

  // #endregion Type Guards

  // #region Transformations

  /**
   * Transforms the contained value using the provided function.
   * If this is an Ok, applies the function; otherwise returns itself unchanged.
   *
   * @typeParam R - The type of the transformed value
   * @param fn Function to transform the value
   * @returns A new OK containing the transformed value
   *
   * @example
   * const result = Result.ok(5);
   * const doubled = result.map((x) => x * 2); // Ok(10)
   */
  map<R>(fn: (v: O) => R): Ok<R> {
    return new Ok(fn(this.value));
  }

  /**
   * Asynchronously transforms the contained value using the provided function.
   *
   * @typeParam R - The type of the tranformed value
   * @param fn Async function to transform the value
   * @returns A Promise that resolves to a new Ok containing the transformed value
   *
   * @example
   * const result = Result.ok("user-id");
   * const user = await result.mapAsync((id) => fetchUser(id));
   */
  async mapAsync<R>(fn: (v: O) => Promise<R>): Promise<Ok<R>> {
    return new Ok(await fn(this.value));
  }

  /**
   * Chains operations that return Results. Also known as `flatMap` or `bind`.
   * If this is an Ok, applies the function; otherwise returns itself unchanged.
   *
   * @typeParam R - The type of the value in the returned Result
   * @typeParam E - The type of the error in the returned Result
   * @param fn Function that returns a Result
   * @returns The result returned by the function
   *
   * @example
   * const result = Result.ok(5);
   * const chained = result.andThen((x) => {
   *   if (x > 0) return Result.ok(x * 2);
   *   return Result.err("Negative number");
   * }); // Ok(10)
   */
  andThen<R, E>(fn: (v: O) => Result<R, E>): Result<R, E> {
    return fn(this.value);
  }

  /**
   * Chains async operations that return Results. Also known as `flatMapAsync` or `bindAsync`.
   * If this is an Ok, applies the async function; otherwise returns itself unchanged.
   *
   * @typeParam R - The type of the value in the returned Result
   * @typeParam E - The type of the error in the returned Result
   * @param fn Async function that returns a Result
   * @returns A Promise that resolves to the Result returned by the function
   *
   * @example
   * const result = Result.ok(5);
   * const chained = await result.andThenAsync(async (x) => {
   *   if (x > 0) return Result.ok(x * 2);
   *   return Result.err("Negative number");
   * }); // Ok(10)
   */
  async andThenAsync<R, E>(
    fn: (v: O) => Promise<Result<R, E>>
  ): Promise<Result<R, E>> {
    return fn(this.value);
  }

  /**
   * Transforms the error value using the provided function.
   * For Ok instances, this is a no-op and returns itself.
   *
   * @typeParam R - The type of the transformed error
   * @param _fn: Function to transform the error (unused for Ok)
   * @returns Returns itself unchanged
   */
  mapErr<R>(_fn: (e: never) => R): this {
    return this;
  }

  /**
   * Asynchronously transforms the error value using the procided function.
   * For Ok instances, this is a no-op and returns itself.
   *
   * @typeParam R - The type of the transformed error
   * @param _fn Async function to transform the error (unused for Ok)
   * @returns A Promise that resolves to itself unchanged
   */
  async mapErrAsync<R>(_fn: (e: never) => Promise<R>): Promise<this> {
    return this;
  }

  /**
   * Returns this Ok if it's Ok, otherwise returns the provided alternative.
   * For Ok instances, this is a no-op nad returns itself.
   *
   * @typeParam R - The type of the value in the alternative Result
   * @typeParam F - The type of the error in the alternative Result
   * @param _o Alternative Result (unused for Ok)
   * @returns Returns itself unchanged
   */
  or<R, F>(_o: Result<R, F>): this {
    return this;
  }

  /**
   * Returns this Ok if it's Ok, otherwise computes an alternative from the error.
   * For Ok instances, this is a no-op and returns itself.
   *
   * @typeParam R - The type of the value in the alternative Result
   * @typeParam F - The type of the error in the alternative Result
   * @param _fn Function to compute alternative from the error (unused for Ok)
   * @returns Returns itself unchanged
   */
  orElse<R, F>(_fn: (e: never) => Result<R, F>): this {
    return this;
  }

  // #endregion Transformations

  // #region Pattern Matching

  /**
   * Pattern matches on the Result, executing the appropriate handler.
   *
   * @typeParam U -  The return type of the match expression
   * @param onOk Handler function for Ok variant
   * @param _onErr  Handler function for Err variant (unused for Ok)
   * @returns The result of eexecuting the Ok handler
   *
   * @example
   * const result = Result.ok(42);
   * const message = result.match(
   *   (value) => `Success: ${value}`,
   *   (error) => `Error: ${error}`
   * ); // "Success: 42"
   */
  match<U>(onOk: (v: O) => U, _onErr: (e: never) => U): U {
    return onOk(this.value);
  }

  // #endregion Pattern Matching

  // #region Side Effects

  /**
   * Executes a side effect with the contained value and returns the Result unchanged.
   * Use for logging or debugging without breaking the chain.
   *
   * @param fn Function to execute with the value
   * @returns Returns itself unchanged
   *
   * @example
   * const result = Result.ok(42)
   *   .tap((value) => console.log("Value:", value))
   *   .map((x) => x * 2);
   */
  tap(fn: (v: O) => void): this {
    fn(this.value);
    return this;
  }

  /**
   * Excutes a side effect with the error and returns the Result unchanged.
   * For Ok instances, this is a no-op.
   *
   * @param _fnFunction to execute with the error (unused for Ok)
   * @returns Returns itself changed
   */
  tapErr(_fn: (e: never) => void): this {
    return this;
  }

  // #endregion Side Effects

  // #region Unwrapping

  /**
   * Returns the contained value for Ok instances.
   *
   * @returns The contained value.
   *
   * @example
   * const result = Result.ok(42);
   * const value = result.ok(); // 42
   */
  ok(): O {
    return this.value;
  }

  /**
   * Returns undefined for Ok instances, since there is no error.
   *
   * @returns Always undefined.
   *
   * @example
   * const result = Result.ok(42);
   * const error = result.err(); // undefined
   */
  err(): undefined {
    return undefined;
  }

  /**
   * Unwraps the contained value. Safe for Ok instances.
   *
   * @returns The contained value
   *
   * @example
   * const result = Result.ok(42);
   * const value = result.unwrap(); // 42
   */
  unwrap(): O {
    return this.value;
  }

  /**
   * Unwraps the contained value or returns the provided default.
   * For Ok instances, always returns the contained value.
   *
   * @param _dv Default value (unused for ok)
   * @returns The contained value
   */
  unwrapOr<R>(_dv: R): O | R {
    return this.value;
  }

  /**
   * Unwraps the contained value or computes a default from the error.
   * For Ok instances, always returns the contained value.
   *
   * @param _fn Function to compute default from error (unused for Ok)
   * @returns The contained value
   */
  unwrapOrElse<R>(_fn: (e: never) => R): O | R {
    return this.value;
  }

  /**
   * Unwraps the contained value. Safe for Ok instances.
   * The message parameter is ignored for Ok variants
   *
   * @param _msg Error message (unused for Ok)
   * @returns The contained value
   */
  expect(_msg: string): O {
    return this.value;
  }

  // #endregion Unwrapping
}

/**
 * Represents a failed operation containing an error.
 *
 * @typeParam E - The type of the contained error
 *
 * @example
 * const failure = Reuslt.err("Operation failed");
 * if (failure.isErr()) {
 *   console.log(failure.error); //"Operation failed"
 * }
 */
class Err<E> {
  /**
   * Creates a new Err instance.
   *
   * @param error The error value to wrap
   */
  constructor(public readonly error: E) {}

  // #region Type Guards

  /**
   * Checks if this Result it an Ok variant.
   *
   * @returns Always returns `false` for Err instances
   */
  isOk(): this is Ok<unknown> {
    return false;
  }

  /**
   * Checks if this Result it an Err variant.
   *
   * @returns Always returns `true` for Err instances
   */
  isErr(): this is Err<E> {
    return true;
  }

  // #endregion Type Guards

  // #region Transformations

  /**
   * Transforms the contained value using the provided function.
   * For Err instances, this is a no-op and returns itself unchanged.
   *
   * @typeParam R - The type of the transformed value
   * @param _fn Function to transform the value (unused for Err)
   * @returns Returns itself unchanged
   */
  map<R>(_fn: (v: never) => R): this {
    return this;
  }

  /**
   * Asynchronously transforms the contained value using the provided function.
   * For Err instances, this is a no-op and returns itself, unchanged.
   *
   * @typeParam R - The type of the transformed value
   * @param _fn Async function to transform the value (unused for Err)
   * @returns A Promise that resolves to itself unchanged
   */
  async mapAsync<R>(_fn: (v: never) => Promise<R>): Promise<this> {
    return this;
  }

  /**
   * Chains operations that return Results. Also known as `flatMap` or `bind`.
   * For Err instances, this is a no-op and returns itself unchanged.
   *
   * @typeParam R - The type of the value in the returned Result
   * @typeParam F - The type of the error in the returend Result
   * @param _fn Function that returns a Result (unused for Err)
   * @returns Returns itself unchanged
   */
  andThen<R, F>(_fn: (v: never) => Result<R, F>): this {
    return this;
  }

  /**
   * Chains async operations that return Results. Also known as `flatMapAsync` or `bindAsync`.
   * For Err instances, this method does not invoke the provided function and instead returns itself unchanged, wrapped in a Promise.
   *
   * @typeParam R - The type of the value in the returned Result
   * @typeParam F - The type of the error in the returned Result
   * @param _fn Async function that returns a Result (unused for Err instances)
   * @returns A Promise that resolves to itself unchanged
   */
  async andThenAsync<R, F>(
    _fn: (v: never) => Promise<Result<R, F>>
  ): Promise<this> {
    return this;
  }

  /**
   * Transforms the error value using the provided function.
   *
   * @typeParam R - The type of the transformed error
   * @param fn Function to transform the error
   * @returns A new Err containing the transformed error
   *
   * @example
   * const result = Result.err("not found");
   * const mapped = result.mapErr((err) => `Error: ${err}`); // Err("Error: not found")
   */
  mapErr<R>(fn: (e: E) => R): Err<R> {
    return new Err(fn(this.error));
  }

  /**
   * Asynchronously transforms the error value using the provided function.
   *
   * @typeParam R - The type of the transformed error
   * @param fn Async function to transform the error
   * @returns A Promise that resolves to a new Err containing the transformed error
   */
  async mapErrAsync<R>(fn: (e: E) => Promise<R>): Promise<Err<R>> {
    return new Err(await fn(this.error));
  }

  /**
   * Returns this Err if it's Err, otherwise returns the provided alternative.
   * for Err instances, returns the alternative
   *
   * @typeParam R - The type of the value in the alternative Result
   * @typeParam F - The type of the error in the alternative Result
   * @param o Alternative Result to return
   * @returns The alternative Result
   *
   * @example
   * const result = Result.err("failed");
   * const recovered = result.or(Result.ok(0)); // Ok(0)
   */
  or<R, F>(o: Result<R, F>): Result<R, F> {
    return o;
  }

  /**
   * Returns this Err if it's Err, otherwise computes an alternative from the error.
   *
   * @typeParam R - The type of the value in the alternative Result
   * @typeParam F - The type of the error in the alternative Result
   * @param fn Function to compute alternative from error
   * @returns The result returned by the function
   *
   * @example
   * const result = Result.err("not found");
   * const recovered = result.orElse((err) => {
   *   if (err === "not found") return Result.ok(0);
   *   return Result.err("unknown error")
   * }); // Ok(0)
   */
  orElse<R, F>(fn: (e: E) => Result<R, F>): Result<R, F> {
    return fn(this.error);
  }

  // #endregion Transformations

  // #region Pattern Matching

  /**
   * Pattern matches on the Result, executing the appropriate handler.
   *
   * @typeParam U - The return type of the match expression
   * @param _onOk Handler function for Ok variant (unused for Err)
   * @param onErr Handler function for Err variant
   * @returns The result of executing the Err handler
   *
   * @example
   * const result = Result.err("failed");
   * const message = result.match(
   *   (value) => `Success: ${value}`,
   *   (error) => `Error: ${error}`
   * ); // "Error: failed"
   */
  match<U>(_onOk: (v: never) => U, onErr: (e: E) => U): U {
    return onErr(this.error);
  }

  // #endregion Pattern Matching

  // #region Side Effects

  /**
   * Executes a side effect with the contained value and returns the Result unchanged.
   * For Err instances, this is a no-op.
   *
   * @param _fn Function to execute with the value (unused for Err)
   * @returns Returns itself unchanged
   */
  tap(_fn: (v: never) => void): this {
    return this;
  }

  /**
   * Executes a side effect with the error and returns the Result unchanged.
   * Useful for logging or debugging without breaking the chain.
   *
   * @param fn Function to execute with the error
   * @returns Returns itself unchanged
   *
   * @example
   * const result = Result.err("failed")
   *   .tap((err) => console.error("Error:", err))
   *   .or(Result.ok(0));
   */
  tapErr(fn: (e: E) => void): this {
    fn(this.error);
    return this;
  }

  // #endregion Side Effects

  // #region Unwrapping

  /**
   * Returns the contained Ok value, or undefined if this is an Err.
   *
   * @returns {undefined} Always returns undefined for Err instances.
   *
   * @example
   * const result = Result.err("error");
   * const value = result.ok(); // undefined
   */
  ok(): undefined {
    return undefined;
  }

  /**
   * Returns the contained error value.
   *
   * @returns {E} The error associated with this Err instance.
   *
   * @example
   * const result = Result.err("error");
   * const error = result.err(); // "error"
   */
  err(): E {
    return this.error;
  }

  /**
   * Unwraps the contained value. Throws an error for Err instances.
   *
   * @throws {Error} Always throws when called on an Err instances
   * @returns Never returns (always throws)
   *
   * @example
   * const result = Result.err("failed");
   * const value = result.unwrap(); // Throws Error
   */
  unwrap(): never {
    throw this.error instanceof Error
      ? this.error
      : new Error(String(this.error));
  }

  /**
   * Unwraps the contained value or returns the provided default.
   * For Err instances, always returns the default value.
   *
   * @typeParam R - The type of the default value
   * @param dv Default value to return
   * @returns The default value
   *
   * @example
   * const result = Result.err("failed");
   * const value = result.unwrapOr(0);
   */
  unwrapOr<R>(dv: R): R {
    return dv;
  }

  /**
   * Unwraps the contained value or computes a default from the error.
   *
   * @typeParam R - The type of the computed default
   * @param fn Function to compute default from error
   * @returns The computed default value
   *
   * @example
   * const result = Result.err("not found");
   * const value = result.unwrapOrElse((err) => {
   *   if (err === "not found") return 404;
   *   return 500;
   * }); // 404
   */
  unwrapOrElse<R>(fn: (e: E) => R): R {
    return fn(this.error);
  }

  /**
   * Unwraps the contained value. Throws an error with a custom message for Err instances.
   *
   * @param msg Custom error message prefix
   * @throws {Error} Always throws when called on an Err instances
   * @returns Never returns (always throws)
   *
   * @example
   * const result = Result.err("failed");
   * const value = result.expect("Operation failed"); // Throws Error: "Operation failed: failed"
   */
  expect(msg: string): never {
    throw new Error(`${msg}: ${this.error}`);
  }

  // #endregion Unwrapping
}

/**
 * Result utility namespace providing constructors and helper functions.
 */
const Result = {
  // #region Constructors

  /**
   * Creates a new Ok Result containing the provided value.
   *
   * @typeParam O - The type of the value
   * @param v The value to wrap in an Ok
   * @returns A new Ok instance
   */
  ok: <O>(v: O) => new Ok(v),

  /**
   * Creates a new Err Result containing the provided error.
   *
   * @typeParam E - The type of the error
   * @param e The error to wrap in an Err
   * @returns A new Err instance
   */
  err: <E>(e: E) => new Err(e),

  // #endregion Constructors

  // #region Utilities

  /**
   * Flattens a nested Result structure.
   * Converts `Result<Result<O, E>, E>` into `Result<O, E>`.
   *
   * @typeParam O - The type of the inner value
   * @typeParam E - The type of the error
   * @param res The nested Result to flatten
   * @returns A flattened Result
   *
   * @example
   * const nested = Result.ok(Result.ok(42));
   * const flattened = Result.flatten(nested); // Ok(42)
   */
  flatten: <O, E>(res: Result<Result<O, E>, E>): Result<O, E> => {
    return res.match(
      (inner) => inner,
      (err) => Result.err(err)
    );
  },

  // #endregion Utilities

  // #region Async

  /**
   * Converts a Promise into a Result, catching any errors.
   * Resolved promises become Ok, rejected promises become Err.
   *
   * @typeParam O -The type of the promise's resolved value
   * @typeParam E - The type of the error (defaults to `unknown`)
   * @param p The promise to convert
   * @returns A Promise that resolves to a Result
   *
   * @example
   * const result = await Result.fromPromise(fetch("/api/data"));
   * if (result.isOk()) {
   *   const data = result.value;
   * }
   */
  fromPromise: async <O, E = unknown>(p: Promise<O>): Promise<Result<O, E>> => {
    try {
      const value = await p;
      return Result.ok(value);
    } catch (error) {
      return Result.err(error as E);
    }
  },

  // #endregion Async
};

export { type Ok, type Err, Result };
