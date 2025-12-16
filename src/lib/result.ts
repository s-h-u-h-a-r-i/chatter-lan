type Result<O, E> = Ok<O> | Err<E>;

class Ok<O> {
  #value: O;

  constructor(v: O) {
    this.#value = v;
  }

  ok() {
    return this.#value;
  }

  err() {
    return null;
  }

  map<R>(fn: (v: O) => R) {
    return Result.ok(fn(this.#value));
  }

  mapErr<R>(fn: (e: never) => R) {
    return this;
  }

  tap(fn: (v: O) => void) {
    fn(this.#value);
    return this;
  }

  tapErr(fn: (e: never) => void) {
    return this;
  }

  andThen<R, F>(fn: (v: O) => Result<R, F>) {
    return fn(this.#value);
  }

  andThenErr<R, F>(fn: (e: never) => Result<R, F>) {
    return this;
  }
}

class Err<E> {
  #error: E;

  constructor(e: E) {
    this.#error = e;
  }

  ok() {
    return null;
  }

  err() {
    return this.#error;
  }

  map<R>(fn: (v: never) => R) {
    return this;
  }

  mapErr<R>(fn: (e: E) => R) {
    return Result.err(fn(this.#error));
  }

  tap(fn: (v: never) => void) {
    return this;
  }

  tapErr(fn: (e: E) => void) {
    fn(this.#error);
    return this;
  }

  andThen<R, F>(fn: (v: never) => Result<R, F>) {
    return this;
  }

  andThenErr<R, F>(fn: (e: E) => Result<R, F>) {
    return fn(this.#error);
  }
}

const Result = {
  ok: <O>(v: O) => new Ok(v),
  err: <E>(e: E) => new Err(e),
  isOk: <O, E>(r: Result<O, E>) => r instanceof Ok,
  isErr: <O, E>(r: Result<O, E>) => r instanceof Err,
};

export { Result };
