
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Funnel
 * 
 */
export type Funnel = $Result.DefaultSelection<Prisma.$FunnelPayload>
/**
 * Model Domain
 * 
 */
export type Domain = $Result.DefaultSelection<Prisma.$DomainPayload>
/**
 * Model FunnelDomain
 * 
 */
export type FunnelDomain = $Result.DefaultSelection<Prisma.$FunnelDomainPayload>
/**
 * Model Page
 * 
 */
export type Page = $Result.DefaultSelection<Prisma.$PagePayload>
/**
 * Model TemplateCategory
 * 
 */
export type TemplateCategory = $Result.DefaultSelection<Prisma.$TemplateCategoryPayload>
/**
 * Model Template
 * 
 */
export type Template = $Result.DefaultSelection<Prisma.$TemplatePayload>
/**
 * Model TemplateImage
 * 
 */
export type TemplateImage = $Result.DefaultSelection<Prisma.$TemplateImagePayload>
/**
 * Model TemplatePages
 * 
 */
export type TemplatePages = $Result.DefaultSelection<Prisma.$TemplatePagesPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const DomainType: {
  CUSTOM_DOMAIN: 'CUSTOM_DOMAIN',
  SUBDOMAIN: 'SUBDOMAIN'
};

export type DomainType = (typeof DomainType)[keyof typeof DomainType]


export const DomainStatus: {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  ACTIVE: 'ACTIVE',
  FAILED: 'FAILED',
  SUSPENDED: 'SUSPENDED'
};

export type DomainStatus = (typeof DomainStatus)[keyof typeof DomainStatus]


export const SslStatus: {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  ERROR: 'ERROR',
  EXPIRED: 'EXPIRED'
};

export type SslStatus = (typeof SslStatus)[keyof typeof SslStatus]

}

export type DomainType = $Enums.DomainType

export const DomainType: typeof $Enums.DomainType

export type DomainStatus = $Enums.DomainStatus

export const DomainStatus: typeof $Enums.DomainStatus

export type SslStatus = $Enums.SslStatus

export const SslStatus: typeof $Enums.SslStatus

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.funnel`: Exposes CRUD operations for the **Funnel** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Funnels
    * const funnels = await prisma.funnel.findMany()
    * ```
    */
  get funnel(): Prisma.FunnelDelegate<ExtArgs>;

  /**
   * `prisma.domain`: Exposes CRUD operations for the **Domain** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Domains
    * const domains = await prisma.domain.findMany()
    * ```
    */
  get domain(): Prisma.DomainDelegate<ExtArgs>;

  /**
   * `prisma.funnelDomain`: Exposes CRUD operations for the **FunnelDomain** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FunnelDomains
    * const funnelDomains = await prisma.funnelDomain.findMany()
    * ```
    */
  get funnelDomain(): Prisma.FunnelDomainDelegate<ExtArgs>;

  /**
   * `prisma.page`: Exposes CRUD operations for the **Page** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Pages
    * const pages = await prisma.page.findMany()
    * ```
    */
  get page(): Prisma.PageDelegate<ExtArgs>;

  /**
   * `prisma.templateCategory`: Exposes CRUD operations for the **TemplateCategory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TemplateCategories
    * const templateCategories = await prisma.templateCategory.findMany()
    * ```
    */
  get templateCategory(): Prisma.TemplateCategoryDelegate<ExtArgs>;

  /**
   * `prisma.template`: Exposes CRUD operations for the **Template** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Templates
    * const templates = await prisma.template.findMany()
    * ```
    */
  get template(): Prisma.TemplateDelegate<ExtArgs>;

  /**
   * `prisma.templateImage`: Exposes CRUD operations for the **TemplateImage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TemplateImages
    * const templateImages = await prisma.templateImage.findMany()
    * ```
    */
  get templateImage(): Prisma.TemplateImageDelegate<ExtArgs>;

  /**
   * `prisma.templatePages`: Exposes CRUD operations for the **TemplatePages** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TemplatePages
    * const templatePages = await prisma.templatePages.findMany()
    * ```
    */
  get templatePages(): Prisma.TemplatePagesDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Funnel: 'Funnel',
    Domain: 'Domain',
    FunnelDomain: 'FunnelDomain',
    Page: 'Page',
    TemplateCategory: 'TemplateCategory',
    Template: 'Template',
    TemplateImage: 'TemplateImage',
    TemplatePages: 'TemplatePages'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "user" | "funnel" | "domain" | "funnelDomain" | "page" | "templateCategory" | "template" | "templateImage" | "templatePages"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Funnel: {
        payload: Prisma.$FunnelPayload<ExtArgs>
        fields: Prisma.FunnelFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FunnelFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FunnelFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelPayload>
          }
          findFirst: {
            args: Prisma.FunnelFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FunnelFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelPayload>
          }
          findMany: {
            args: Prisma.FunnelFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelPayload>[]
          }
          create: {
            args: Prisma.FunnelCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelPayload>
          }
          createMany: {
            args: Prisma.FunnelCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FunnelCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelPayload>[]
          }
          delete: {
            args: Prisma.FunnelDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelPayload>
          }
          update: {
            args: Prisma.FunnelUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelPayload>
          }
          deleteMany: {
            args: Prisma.FunnelDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FunnelUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.FunnelUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelPayload>
          }
          aggregate: {
            args: Prisma.FunnelAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFunnel>
          }
          groupBy: {
            args: Prisma.FunnelGroupByArgs<ExtArgs>
            result: $Utils.Optional<FunnelGroupByOutputType>[]
          }
          count: {
            args: Prisma.FunnelCountArgs<ExtArgs>
            result: $Utils.Optional<FunnelCountAggregateOutputType> | number
          }
        }
      }
      Domain: {
        payload: Prisma.$DomainPayload<ExtArgs>
        fields: Prisma.DomainFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DomainFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DomainPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DomainFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DomainPayload>
          }
          findFirst: {
            args: Prisma.DomainFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DomainPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DomainFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DomainPayload>
          }
          findMany: {
            args: Prisma.DomainFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DomainPayload>[]
          }
          create: {
            args: Prisma.DomainCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DomainPayload>
          }
          createMany: {
            args: Prisma.DomainCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DomainCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DomainPayload>[]
          }
          delete: {
            args: Prisma.DomainDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DomainPayload>
          }
          update: {
            args: Prisma.DomainUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DomainPayload>
          }
          deleteMany: {
            args: Prisma.DomainDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DomainUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.DomainUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DomainPayload>
          }
          aggregate: {
            args: Prisma.DomainAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDomain>
          }
          groupBy: {
            args: Prisma.DomainGroupByArgs<ExtArgs>
            result: $Utils.Optional<DomainGroupByOutputType>[]
          }
          count: {
            args: Prisma.DomainCountArgs<ExtArgs>
            result: $Utils.Optional<DomainCountAggregateOutputType> | number
          }
        }
      }
      FunnelDomain: {
        payload: Prisma.$FunnelDomainPayload<ExtArgs>
        fields: Prisma.FunnelDomainFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FunnelDomainFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelDomainPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FunnelDomainFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelDomainPayload>
          }
          findFirst: {
            args: Prisma.FunnelDomainFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelDomainPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FunnelDomainFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelDomainPayload>
          }
          findMany: {
            args: Prisma.FunnelDomainFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelDomainPayload>[]
          }
          create: {
            args: Prisma.FunnelDomainCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelDomainPayload>
          }
          createMany: {
            args: Prisma.FunnelDomainCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FunnelDomainCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelDomainPayload>[]
          }
          delete: {
            args: Prisma.FunnelDomainDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelDomainPayload>
          }
          update: {
            args: Prisma.FunnelDomainUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelDomainPayload>
          }
          deleteMany: {
            args: Prisma.FunnelDomainDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FunnelDomainUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.FunnelDomainUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FunnelDomainPayload>
          }
          aggregate: {
            args: Prisma.FunnelDomainAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFunnelDomain>
          }
          groupBy: {
            args: Prisma.FunnelDomainGroupByArgs<ExtArgs>
            result: $Utils.Optional<FunnelDomainGroupByOutputType>[]
          }
          count: {
            args: Prisma.FunnelDomainCountArgs<ExtArgs>
            result: $Utils.Optional<FunnelDomainCountAggregateOutputType> | number
          }
        }
      }
      Page: {
        payload: Prisma.$PagePayload<ExtArgs>
        fields: Prisma.PageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PagePayload>
          }
          findFirst: {
            args: Prisma.PageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PagePayload>
          }
          findMany: {
            args: Prisma.PageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PagePayload>[]
          }
          create: {
            args: Prisma.PageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PagePayload>
          }
          createMany: {
            args: Prisma.PageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PagePayload>[]
          }
          delete: {
            args: Prisma.PageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PagePayload>
          }
          update: {
            args: Prisma.PageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PagePayload>
          }
          deleteMany: {
            args: Prisma.PageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PagePayload>
          }
          aggregate: {
            args: Prisma.PageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePage>
          }
          groupBy: {
            args: Prisma.PageGroupByArgs<ExtArgs>
            result: $Utils.Optional<PageGroupByOutputType>[]
          }
          count: {
            args: Prisma.PageCountArgs<ExtArgs>
            result: $Utils.Optional<PageCountAggregateOutputType> | number
          }
        }
      }
      TemplateCategory: {
        payload: Prisma.$TemplateCategoryPayload<ExtArgs>
        fields: Prisma.TemplateCategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TemplateCategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateCategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TemplateCategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateCategoryPayload>
          }
          findFirst: {
            args: Prisma.TemplateCategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateCategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TemplateCategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateCategoryPayload>
          }
          findMany: {
            args: Prisma.TemplateCategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateCategoryPayload>[]
          }
          create: {
            args: Prisma.TemplateCategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateCategoryPayload>
          }
          createMany: {
            args: Prisma.TemplateCategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TemplateCategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateCategoryPayload>[]
          }
          delete: {
            args: Prisma.TemplateCategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateCategoryPayload>
          }
          update: {
            args: Prisma.TemplateCategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateCategoryPayload>
          }
          deleteMany: {
            args: Prisma.TemplateCategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TemplateCategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TemplateCategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateCategoryPayload>
          }
          aggregate: {
            args: Prisma.TemplateCategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTemplateCategory>
          }
          groupBy: {
            args: Prisma.TemplateCategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<TemplateCategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.TemplateCategoryCountArgs<ExtArgs>
            result: $Utils.Optional<TemplateCategoryCountAggregateOutputType> | number
          }
        }
      }
      Template: {
        payload: Prisma.$TemplatePayload<ExtArgs>
        fields: Prisma.TemplateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TemplateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TemplateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>
          }
          findFirst: {
            args: Prisma.TemplateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TemplateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>
          }
          findMany: {
            args: Prisma.TemplateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>[]
          }
          create: {
            args: Prisma.TemplateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>
          }
          createMany: {
            args: Prisma.TemplateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TemplateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>[]
          }
          delete: {
            args: Prisma.TemplateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>
          }
          update: {
            args: Prisma.TemplateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>
          }
          deleteMany: {
            args: Prisma.TemplateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TemplateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TemplateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePayload>
          }
          aggregate: {
            args: Prisma.TemplateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTemplate>
          }
          groupBy: {
            args: Prisma.TemplateGroupByArgs<ExtArgs>
            result: $Utils.Optional<TemplateGroupByOutputType>[]
          }
          count: {
            args: Prisma.TemplateCountArgs<ExtArgs>
            result: $Utils.Optional<TemplateCountAggregateOutputType> | number
          }
        }
      }
      TemplateImage: {
        payload: Prisma.$TemplateImagePayload<ExtArgs>
        fields: Prisma.TemplateImageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TemplateImageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateImagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TemplateImageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateImagePayload>
          }
          findFirst: {
            args: Prisma.TemplateImageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateImagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TemplateImageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateImagePayload>
          }
          findMany: {
            args: Prisma.TemplateImageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateImagePayload>[]
          }
          create: {
            args: Prisma.TemplateImageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateImagePayload>
          }
          createMany: {
            args: Prisma.TemplateImageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TemplateImageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateImagePayload>[]
          }
          delete: {
            args: Prisma.TemplateImageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateImagePayload>
          }
          update: {
            args: Prisma.TemplateImageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateImagePayload>
          }
          deleteMany: {
            args: Prisma.TemplateImageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TemplateImageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TemplateImageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplateImagePayload>
          }
          aggregate: {
            args: Prisma.TemplateImageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTemplateImage>
          }
          groupBy: {
            args: Prisma.TemplateImageGroupByArgs<ExtArgs>
            result: $Utils.Optional<TemplateImageGroupByOutputType>[]
          }
          count: {
            args: Prisma.TemplateImageCountArgs<ExtArgs>
            result: $Utils.Optional<TemplateImageCountAggregateOutputType> | number
          }
        }
      }
      TemplatePages: {
        payload: Prisma.$TemplatePagesPayload<ExtArgs>
        fields: Prisma.TemplatePagesFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TemplatePagesFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePagesPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TemplatePagesFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePagesPayload>
          }
          findFirst: {
            args: Prisma.TemplatePagesFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePagesPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TemplatePagesFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePagesPayload>
          }
          findMany: {
            args: Prisma.TemplatePagesFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePagesPayload>[]
          }
          create: {
            args: Prisma.TemplatePagesCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePagesPayload>
          }
          createMany: {
            args: Prisma.TemplatePagesCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TemplatePagesCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePagesPayload>[]
          }
          delete: {
            args: Prisma.TemplatePagesDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePagesPayload>
          }
          update: {
            args: Prisma.TemplatePagesUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePagesPayload>
          }
          deleteMany: {
            args: Prisma.TemplatePagesDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TemplatePagesUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TemplatePagesUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TemplatePagesPayload>
          }
          aggregate: {
            args: Prisma.TemplatePagesAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTemplatePages>
          }
          groupBy: {
            args: Prisma.TemplatePagesGroupByArgs<ExtArgs>
            result: $Utils.Optional<TemplatePagesGroupByOutputType>[]
          }
          count: {
            args: Prisma.TemplatePagesCountArgs<ExtArgs>
            result: $Utils.Optional<TemplatePagesCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    funnels: number
    domains: number
    templates: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    funnels?: boolean | UserCountOutputTypeCountFunnelsArgs
    domains?: boolean | UserCountOutputTypeCountDomainsArgs
    templates?: boolean | UserCountOutputTypeCountTemplatesArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountFunnelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FunnelWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountDomainsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DomainWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountTemplatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TemplateWhereInput
  }


  /**
   * Count Type FunnelCountOutputType
   */

  export type FunnelCountOutputType = {
    pages: number
    domainConnections: number
  }

  export type FunnelCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pages?: boolean | FunnelCountOutputTypeCountPagesArgs
    domainConnections?: boolean | FunnelCountOutputTypeCountDomainConnectionsArgs
  }

  // Custom InputTypes
  /**
   * FunnelCountOutputType without action
   */
  export type FunnelCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelCountOutputType
     */
    select?: FunnelCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * FunnelCountOutputType without action
   */
  export type FunnelCountOutputTypeCountPagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PageWhereInput
  }

  /**
   * FunnelCountOutputType without action
   */
  export type FunnelCountOutputTypeCountDomainConnectionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FunnelDomainWhereInput
  }


  /**
   * Count Type DomainCountOutputType
   */

  export type DomainCountOutputType = {
    funnelConnections: number
  }

  export type DomainCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    funnelConnections?: boolean | DomainCountOutputTypeCountFunnelConnectionsArgs
  }

  // Custom InputTypes
  /**
   * DomainCountOutputType without action
   */
  export type DomainCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DomainCountOutputType
     */
    select?: DomainCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DomainCountOutputType without action
   */
  export type DomainCountOutputTypeCountFunnelConnectionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FunnelDomainWhereInput
  }


  /**
   * Count Type TemplateCategoryCountOutputType
   */

  export type TemplateCategoryCountOutputType = {
    templates: number
  }

  export type TemplateCategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    templates?: boolean | TemplateCategoryCountOutputTypeCountTemplatesArgs
  }

  // Custom InputTypes
  /**
   * TemplateCategoryCountOutputType without action
   */
  export type TemplateCategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCategoryCountOutputType
     */
    select?: TemplateCategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TemplateCategoryCountOutputType without action
   */
  export type TemplateCategoryCountOutputTypeCountTemplatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TemplateWhereInput
  }


  /**
   * Count Type TemplateCountOutputType
   */

  export type TemplateCountOutputType = {
    previewImages: number
    pages: number
    funnelsCreated: number
  }

  export type TemplateCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    previewImages?: boolean | TemplateCountOutputTypeCountPreviewImagesArgs
    pages?: boolean | TemplateCountOutputTypeCountPagesArgs
    funnelsCreated?: boolean | TemplateCountOutputTypeCountFunnelsCreatedArgs
  }

  // Custom InputTypes
  /**
   * TemplateCountOutputType without action
   */
  export type TemplateCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCountOutputType
     */
    select?: TemplateCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TemplateCountOutputType without action
   */
  export type TemplateCountOutputTypeCountPreviewImagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TemplateImageWhereInput
  }

  /**
   * TemplateCountOutputType without action
   */
  export type TemplateCountOutputTypeCountPagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TemplatePagesWhereInput
  }

  /**
   * TemplateCountOutputType without action
   */
  export type TemplateCountOutputTypeCountFunnelsCreatedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FunnelWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    email: string | null
    name: string | null
    password: string | null
    passwordResetToken: string | null
    passwordResetExpiresAt: Date | null
    isAdmin: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    email: string | null
    name: string | null
    password: string | null
    passwordResetToken: string | null
    passwordResetExpiresAt: Date | null
    isAdmin: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    name: number
    password: number
    passwordResetToken: number
    passwordResetExpiresAt: number
    isAdmin: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    name?: true
    password?: true
    passwordResetToken?: true
    passwordResetExpiresAt?: true
    isAdmin?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    name?: true
    password?: true
    passwordResetToken?: true
    passwordResetExpiresAt?: true
    isAdmin?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    name?: true
    password?: true
    passwordResetToken?: true
    passwordResetExpiresAt?: true
    isAdmin?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    email: string
    name: string | null
    password: string
    passwordResetToken: string | null
    passwordResetExpiresAt: Date | null
    isAdmin: boolean
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    password?: boolean
    passwordResetToken?: boolean
    passwordResetExpiresAt?: boolean
    isAdmin?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    funnels?: boolean | User$funnelsArgs<ExtArgs>
    domains?: boolean | User$domainsArgs<ExtArgs>
    templates?: boolean | User$templatesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    password?: boolean
    passwordResetToken?: boolean
    passwordResetExpiresAt?: boolean
    isAdmin?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    name?: boolean
    password?: boolean
    passwordResetToken?: boolean
    passwordResetExpiresAt?: boolean
    isAdmin?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    funnels?: boolean | User$funnelsArgs<ExtArgs>
    domains?: boolean | User$domainsArgs<ExtArgs>
    templates?: boolean | User$templatesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      funnels: Prisma.$FunnelPayload<ExtArgs>[]
      domains: Prisma.$DomainPayload<ExtArgs>[]
      templates: Prisma.$TemplatePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      email: string
      name: string | null
      password: string
      passwordResetToken: string | null
      passwordResetExpiresAt: Date | null
      isAdmin: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    funnels<T extends User$funnelsArgs<ExtArgs> = {}>(args?: Subset<T, User$funnelsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "findMany"> | Null>
    domains<T extends User$domainsArgs<ExtArgs> = {}>(args?: Subset<T, User$domainsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DomainPayload<ExtArgs>, T, "findMany"> | Null>
    templates<T extends User$templatesArgs<ExtArgs> = {}>(args?: Subset<T, User$templatesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly email: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly passwordResetToken: FieldRef<"User", 'String'>
    readonly passwordResetExpiresAt: FieldRef<"User", 'DateTime'>
    readonly isAdmin: FieldRef<"User", 'Boolean'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User.funnels
   */
  export type User$funnelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelInclude<ExtArgs> | null
    where?: FunnelWhereInput
    orderBy?: FunnelOrderByWithRelationInput | FunnelOrderByWithRelationInput[]
    cursor?: FunnelWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FunnelScalarFieldEnum | FunnelScalarFieldEnum[]
  }

  /**
   * User.domains
   */
  export type User$domainsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Domain
     */
    select?: DomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DomainInclude<ExtArgs> | null
    where?: DomainWhereInput
    orderBy?: DomainOrderByWithRelationInput | DomainOrderByWithRelationInput[]
    cursor?: DomainWhereUniqueInput
    take?: number
    skip?: number
    distinct?: DomainScalarFieldEnum | DomainScalarFieldEnum[]
  }

  /**
   * User.templates
   */
  export type User$templatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
    where?: TemplateWhereInput
    orderBy?: TemplateOrderByWithRelationInput | TemplateOrderByWithRelationInput[]
    cursor?: TemplateWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TemplateScalarFieldEnum | TemplateScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Funnel
   */

  export type AggregateFunnel = {
    _count: FunnelCountAggregateOutputType | null
    _avg: FunnelAvgAggregateOutputType | null
    _sum: FunnelSumAggregateOutputType | null
    _min: FunnelMinAggregateOutputType | null
    _max: FunnelMaxAggregateOutputType | null
  }

  export type FunnelAvgAggregateOutputType = {
    id: number | null
    userId: number | null
    templateId: number | null
  }

  export type FunnelSumAggregateOutputType = {
    id: number | null
    userId: number | null
    templateId: number | null
  }

  export type FunnelMinAggregateOutputType = {
    id: number | null
    name: string | null
    status: string | null
    userId: number | null
    templateId: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FunnelMaxAggregateOutputType = {
    id: number | null
    name: string | null
    status: string | null
    userId: number | null
    templateId: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FunnelCountAggregateOutputType = {
    id: number
    name: number
    status: number
    userId: number
    templateId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type FunnelAvgAggregateInputType = {
    id?: true
    userId?: true
    templateId?: true
  }

  export type FunnelSumAggregateInputType = {
    id?: true
    userId?: true
    templateId?: true
  }

  export type FunnelMinAggregateInputType = {
    id?: true
    name?: true
    status?: true
    userId?: true
    templateId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FunnelMaxAggregateInputType = {
    id?: true
    name?: true
    status?: true
    userId?: true
    templateId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FunnelCountAggregateInputType = {
    id?: true
    name?: true
    status?: true
    userId?: true
    templateId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type FunnelAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Funnel to aggregate.
     */
    where?: FunnelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Funnels to fetch.
     */
    orderBy?: FunnelOrderByWithRelationInput | FunnelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FunnelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Funnels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Funnels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Funnels
    **/
    _count?: true | FunnelCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FunnelAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FunnelSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FunnelMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FunnelMaxAggregateInputType
  }

  export type GetFunnelAggregateType<T extends FunnelAggregateArgs> = {
        [P in keyof T & keyof AggregateFunnel]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFunnel[P]>
      : GetScalarType<T[P], AggregateFunnel[P]>
  }




  export type FunnelGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FunnelWhereInput
    orderBy?: FunnelOrderByWithAggregationInput | FunnelOrderByWithAggregationInput[]
    by: FunnelScalarFieldEnum[] | FunnelScalarFieldEnum
    having?: FunnelScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FunnelCountAggregateInputType | true
    _avg?: FunnelAvgAggregateInputType
    _sum?: FunnelSumAggregateInputType
    _min?: FunnelMinAggregateInputType
    _max?: FunnelMaxAggregateInputType
  }

  export type FunnelGroupByOutputType = {
    id: number
    name: string
    status: string
    userId: number
    templateId: number | null
    createdAt: Date
    updatedAt: Date
    _count: FunnelCountAggregateOutputType | null
    _avg: FunnelAvgAggregateOutputType | null
    _sum: FunnelSumAggregateOutputType | null
    _min: FunnelMinAggregateOutputType | null
    _max: FunnelMaxAggregateOutputType | null
  }

  type GetFunnelGroupByPayload<T extends FunnelGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FunnelGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FunnelGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FunnelGroupByOutputType[P]>
            : GetScalarType<T[P], FunnelGroupByOutputType[P]>
        }
      >
    >


  export type FunnelSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    status?: boolean
    userId?: boolean
    templateId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    pages?: boolean | Funnel$pagesArgs<ExtArgs>
    domainConnections?: boolean | Funnel$domainConnectionsArgs<ExtArgs>
    template?: boolean | Funnel$templateArgs<ExtArgs>
    _count?: boolean | FunnelCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["funnel"]>

  export type FunnelSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    status?: boolean
    userId?: boolean
    templateId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    template?: boolean | Funnel$templateArgs<ExtArgs>
  }, ExtArgs["result"]["funnel"]>

  export type FunnelSelectScalar = {
    id?: boolean
    name?: boolean
    status?: boolean
    userId?: boolean
    templateId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type FunnelInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    pages?: boolean | Funnel$pagesArgs<ExtArgs>
    domainConnections?: boolean | Funnel$domainConnectionsArgs<ExtArgs>
    template?: boolean | Funnel$templateArgs<ExtArgs>
    _count?: boolean | FunnelCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type FunnelIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    template?: boolean | Funnel$templateArgs<ExtArgs>
  }

  export type $FunnelPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Funnel"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      pages: Prisma.$PagePayload<ExtArgs>[]
      domainConnections: Prisma.$FunnelDomainPayload<ExtArgs>[]
      template: Prisma.$TemplatePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      status: string
      userId: number
      templateId: number | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["funnel"]>
    composites: {}
  }

  type FunnelGetPayload<S extends boolean | null | undefined | FunnelDefaultArgs> = $Result.GetResult<Prisma.$FunnelPayload, S>

  type FunnelCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<FunnelFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: FunnelCountAggregateInputType | true
    }

  export interface FunnelDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Funnel'], meta: { name: 'Funnel' } }
    /**
     * Find zero or one Funnel that matches the filter.
     * @param {FunnelFindUniqueArgs} args - Arguments to find a Funnel
     * @example
     * // Get one Funnel
     * const funnel = await prisma.funnel.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FunnelFindUniqueArgs>(args: SelectSubset<T, FunnelFindUniqueArgs<ExtArgs>>): Prisma__FunnelClient<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Funnel that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {FunnelFindUniqueOrThrowArgs} args - Arguments to find a Funnel
     * @example
     * // Get one Funnel
     * const funnel = await prisma.funnel.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FunnelFindUniqueOrThrowArgs>(args: SelectSubset<T, FunnelFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FunnelClient<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Funnel that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelFindFirstArgs} args - Arguments to find a Funnel
     * @example
     * // Get one Funnel
     * const funnel = await prisma.funnel.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FunnelFindFirstArgs>(args?: SelectSubset<T, FunnelFindFirstArgs<ExtArgs>>): Prisma__FunnelClient<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Funnel that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelFindFirstOrThrowArgs} args - Arguments to find a Funnel
     * @example
     * // Get one Funnel
     * const funnel = await prisma.funnel.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FunnelFindFirstOrThrowArgs>(args?: SelectSubset<T, FunnelFindFirstOrThrowArgs<ExtArgs>>): Prisma__FunnelClient<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Funnels that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Funnels
     * const funnels = await prisma.funnel.findMany()
     * 
     * // Get first 10 Funnels
     * const funnels = await prisma.funnel.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const funnelWithIdOnly = await prisma.funnel.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FunnelFindManyArgs>(args?: SelectSubset<T, FunnelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Funnel.
     * @param {FunnelCreateArgs} args - Arguments to create a Funnel.
     * @example
     * // Create one Funnel
     * const Funnel = await prisma.funnel.create({
     *   data: {
     *     // ... data to create a Funnel
     *   }
     * })
     * 
     */
    create<T extends FunnelCreateArgs>(args: SelectSubset<T, FunnelCreateArgs<ExtArgs>>): Prisma__FunnelClient<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Funnels.
     * @param {FunnelCreateManyArgs} args - Arguments to create many Funnels.
     * @example
     * // Create many Funnels
     * const funnel = await prisma.funnel.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FunnelCreateManyArgs>(args?: SelectSubset<T, FunnelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Funnels and returns the data saved in the database.
     * @param {FunnelCreateManyAndReturnArgs} args - Arguments to create many Funnels.
     * @example
     * // Create many Funnels
     * const funnel = await prisma.funnel.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Funnels and only return the `id`
     * const funnelWithIdOnly = await prisma.funnel.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FunnelCreateManyAndReturnArgs>(args?: SelectSubset<T, FunnelCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Funnel.
     * @param {FunnelDeleteArgs} args - Arguments to delete one Funnel.
     * @example
     * // Delete one Funnel
     * const Funnel = await prisma.funnel.delete({
     *   where: {
     *     // ... filter to delete one Funnel
     *   }
     * })
     * 
     */
    delete<T extends FunnelDeleteArgs>(args: SelectSubset<T, FunnelDeleteArgs<ExtArgs>>): Prisma__FunnelClient<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Funnel.
     * @param {FunnelUpdateArgs} args - Arguments to update one Funnel.
     * @example
     * // Update one Funnel
     * const funnel = await prisma.funnel.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FunnelUpdateArgs>(args: SelectSubset<T, FunnelUpdateArgs<ExtArgs>>): Prisma__FunnelClient<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Funnels.
     * @param {FunnelDeleteManyArgs} args - Arguments to filter Funnels to delete.
     * @example
     * // Delete a few Funnels
     * const { count } = await prisma.funnel.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FunnelDeleteManyArgs>(args?: SelectSubset<T, FunnelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Funnels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Funnels
     * const funnel = await prisma.funnel.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FunnelUpdateManyArgs>(args: SelectSubset<T, FunnelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Funnel.
     * @param {FunnelUpsertArgs} args - Arguments to update or create a Funnel.
     * @example
     * // Update or create a Funnel
     * const funnel = await prisma.funnel.upsert({
     *   create: {
     *     // ... data to create a Funnel
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Funnel we want to update
     *   }
     * })
     */
    upsert<T extends FunnelUpsertArgs>(args: SelectSubset<T, FunnelUpsertArgs<ExtArgs>>): Prisma__FunnelClient<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Funnels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelCountArgs} args - Arguments to filter Funnels to count.
     * @example
     * // Count the number of Funnels
     * const count = await prisma.funnel.count({
     *   where: {
     *     // ... the filter for the Funnels we want to count
     *   }
     * })
    **/
    count<T extends FunnelCountArgs>(
      args?: Subset<T, FunnelCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FunnelCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Funnel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FunnelAggregateArgs>(args: Subset<T, FunnelAggregateArgs>): Prisma.PrismaPromise<GetFunnelAggregateType<T>>

    /**
     * Group by Funnel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FunnelGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FunnelGroupByArgs['orderBy'] }
        : { orderBy?: FunnelGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FunnelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFunnelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Funnel model
   */
  readonly fields: FunnelFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Funnel.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FunnelClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    pages<T extends Funnel$pagesArgs<ExtArgs> = {}>(args?: Subset<T, Funnel$pagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PagePayload<ExtArgs>, T, "findMany"> | Null>
    domainConnections<T extends Funnel$domainConnectionsArgs<ExtArgs> = {}>(args?: Subset<T, Funnel$domainConnectionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FunnelDomainPayload<ExtArgs>, T, "findMany"> | Null>
    template<T extends Funnel$templateArgs<ExtArgs> = {}>(args?: Subset<T, Funnel$templateArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Funnel model
   */ 
  interface FunnelFieldRefs {
    readonly id: FieldRef<"Funnel", 'Int'>
    readonly name: FieldRef<"Funnel", 'String'>
    readonly status: FieldRef<"Funnel", 'String'>
    readonly userId: FieldRef<"Funnel", 'Int'>
    readonly templateId: FieldRef<"Funnel", 'Int'>
    readonly createdAt: FieldRef<"Funnel", 'DateTime'>
    readonly updatedAt: FieldRef<"Funnel", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Funnel findUnique
   */
  export type FunnelFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelInclude<ExtArgs> | null
    /**
     * Filter, which Funnel to fetch.
     */
    where: FunnelWhereUniqueInput
  }

  /**
   * Funnel findUniqueOrThrow
   */
  export type FunnelFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelInclude<ExtArgs> | null
    /**
     * Filter, which Funnel to fetch.
     */
    where: FunnelWhereUniqueInput
  }

  /**
   * Funnel findFirst
   */
  export type FunnelFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelInclude<ExtArgs> | null
    /**
     * Filter, which Funnel to fetch.
     */
    where?: FunnelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Funnels to fetch.
     */
    orderBy?: FunnelOrderByWithRelationInput | FunnelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Funnels.
     */
    cursor?: FunnelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Funnels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Funnels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Funnels.
     */
    distinct?: FunnelScalarFieldEnum | FunnelScalarFieldEnum[]
  }

  /**
   * Funnel findFirstOrThrow
   */
  export type FunnelFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelInclude<ExtArgs> | null
    /**
     * Filter, which Funnel to fetch.
     */
    where?: FunnelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Funnels to fetch.
     */
    orderBy?: FunnelOrderByWithRelationInput | FunnelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Funnels.
     */
    cursor?: FunnelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Funnels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Funnels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Funnels.
     */
    distinct?: FunnelScalarFieldEnum | FunnelScalarFieldEnum[]
  }

  /**
   * Funnel findMany
   */
  export type FunnelFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelInclude<ExtArgs> | null
    /**
     * Filter, which Funnels to fetch.
     */
    where?: FunnelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Funnels to fetch.
     */
    orderBy?: FunnelOrderByWithRelationInput | FunnelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Funnels.
     */
    cursor?: FunnelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Funnels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Funnels.
     */
    skip?: number
    distinct?: FunnelScalarFieldEnum | FunnelScalarFieldEnum[]
  }

  /**
   * Funnel create
   */
  export type FunnelCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelInclude<ExtArgs> | null
    /**
     * The data needed to create a Funnel.
     */
    data: XOR<FunnelCreateInput, FunnelUncheckedCreateInput>
  }

  /**
   * Funnel createMany
   */
  export type FunnelCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Funnels.
     */
    data: FunnelCreateManyInput | FunnelCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Funnel createManyAndReturn
   */
  export type FunnelCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Funnels.
     */
    data: FunnelCreateManyInput | FunnelCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Funnel update
   */
  export type FunnelUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelInclude<ExtArgs> | null
    /**
     * The data needed to update a Funnel.
     */
    data: XOR<FunnelUpdateInput, FunnelUncheckedUpdateInput>
    /**
     * Choose, which Funnel to update.
     */
    where: FunnelWhereUniqueInput
  }

  /**
   * Funnel updateMany
   */
  export type FunnelUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Funnels.
     */
    data: XOR<FunnelUpdateManyMutationInput, FunnelUncheckedUpdateManyInput>
    /**
     * Filter which Funnels to update
     */
    where?: FunnelWhereInput
  }

  /**
   * Funnel upsert
   */
  export type FunnelUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelInclude<ExtArgs> | null
    /**
     * The filter to search for the Funnel to update in case it exists.
     */
    where: FunnelWhereUniqueInput
    /**
     * In case the Funnel found by the `where` argument doesn't exist, create a new Funnel with this data.
     */
    create: XOR<FunnelCreateInput, FunnelUncheckedCreateInput>
    /**
     * In case the Funnel was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FunnelUpdateInput, FunnelUncheckedUpdateInput>
  }

  /**
   * Funnel delete
   */
  export type FunnelDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelInclude<ExtArgs> | null
    /**
     * Filter which Funnel to delete.
     */
    where: FunnelWhereUniqueInput
  }

  /**
   * Funnel deleteMany
   */
  export type FunnelDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Funnels to delete
     */
    where?: FunnelWhereInput
  }

  /**
   * Funnel.pages
   */
  export type Funnel$pagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Page
     */
    select?: PageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PageInclude<ExtArgs> | null
    where?: PageWhereInput
    orderBy?: PageOrderByWithRelationInput | PageOrderByWithRelationInput[]
    cursor?: PageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PageScalarFieldEnum | PageScalarFieldEnum[]
  }

  /**
   * Funnel.domainConnections
   */
  export type Funnel$domainConnectionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainInclude<ExtArgs> | null
    where?: FunnelDomainWhereInput
    orderBy?: FunnelDomainOrderByWithRelationInput | FunnelDomainOrderByWithRelationInput[]
    cursor?: FunnelDomainWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FunnelDomainScalarFieldEnum | FunnelDomainScalarFieldEnum[]
  }

  /**
   * Funnel.template
   */
  export type Funnel$templateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
    where?: TemplateWhereInput
  }

  /**
   * Funnel without action
   */
  export type FunnelDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelInclude<ExtArgs> | null
  }


  /**
   * Model Domain
   */

  export type AggregateDomain = {
    _count: DomainCountAggregateOutputType | null
    _avg: DomainAvgAggregateOutputType | null
    _sum: DomainSumAggregateOutputType | null
    _min: DomainMinAggregateOutputType | null
    _max: DomainMaxAggregateOutputType | null
  }

  export type DomainAvgAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type DomainSumAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type DomainMinAggregateOutputType = {
    id: number | null
    hostname: string | null
    type: $Enums.DomainType | null
    status: $Enums.DomainStatus | null
    sslStatus: $Enums.SslStatus | null
    userId: number | null
    cloudflareHostnameId: string | null
    cloudflareZoneId: string | null
    cloudflareRecordId: string | null
    verificationToken: string | null
    sslCertificateId: string | null
    lastVerifiedAt: Date | null
    expiresAt: Date | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DomainMaxAggregateOutputType = {
    id: number | null
    hostname: string | null
    type: $Enums.DomainType | null
    status: $Enums.DomainStatus | null
    sslStatus: $Enums.SslStatus | null
    userId: number | null
    cloudflareHostnameId: string | null
    cloudflareZoneId: string | null
    cloudflareRecordId: string | null
    verificationToken: string | null
    sslCertificateId: string | null
    lastVerifiedAt: Date | null
    expiresAt: Date | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DomainCountAggregateOutputType = {
    id: number
    hostname: number
    type: number
    status: number
    sslStatus: number
    userId: number
    cloudflareHostnameId: number
    cloudflareZoneId: number
    cloudflareRecordId: number
    verificationToken: number
    ownershipVerification: number
    dnsInstructions: number
    sslCertificateId: number
    sslValidationRecords: number
    lastVerifiedAt: number
    expiresAt: number
    notes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type DomainAvgAggregateInputType = {
    id?: true
    userId?: true
  }

  export type DomainSumAggregateInputType = {
    id?: true
    userId?: true
  }

  export type DomainMinAggregateInputType = {
    id?: true
    hostname?: true
    type?: true
    status?: true
    sslStatus?: true
    userId?: true
    cloudflareHostnameId?: true
    cloudflareZoneId?: true
    cloudflareRecordId?: true
    verificationToken?: true
    sslCertificateId?: true
    lastVerifiedAt?: true
    expiresAt?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DomainMaxAggregateInputType = {
    id?: true
    hostname?: true
    type?: true
    status?: true
    sslStatus?: true
    userId?: true
    cloudflareHostnameId?: true
    cloudflareZoneId?: true
    cloudflareRecordId?: true
    verificationToken?: true
    sslCertificateId?: true
    lastVerifiedAt?: true
    expiresAt?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DomainCountAggregateInputType = {
    id?: true
    hostname?: true
    type?: true
    status?: true
    sslStatus?: true
    userId?: true
    cloudflareHostnameId?: true
    cloudflareZoneId?: true
    cloudflareRecordId?: true
    verificationToken?: true
    ownershipVerification?: true
    dnsInstructions?: true
    sslCertificateId?: true
    sslValidationRecords?: true
    lastVerifiedAt?: true
    expiresAt?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type DomainAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Domain to aggregate.
     */
    where?: DomainWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Domains to fetch.
     */
    orderBy?: DomainOrderByWithRelationInput | DomainOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DomainWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Domains from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Domains.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Domains
    **/
    _count?: true | DomainCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DomainAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DomainSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DomainMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DomainMaxAggregateInputType
  }

  export type GetDomainAggregateType<T extends DomainAggregateArgs> = {
        [P in keyof T & keyof AggregateDomain]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDomain[P]>
      : GetScalarType<T[P], AggregateDomain[P]>
  }




  export type DomainGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DomainWhereInput
    orderBy?: DomainOrderByWithAggregationInput | DomainOrderByWithAggregationInput[]
    by: DomainScalarFieldEnum[] | DomainScalarFieldEnum
    having?: DomainScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DomainCountAggregateInputType | true
    _avg?: DomainAvgAggregateInputType
    _sum?: DomainSumAggregateInputType
    _min?: DomainMinAggregateInputType
    _max?: DomainMaxAggregateInputType
  }

  export type DomainGroupByOutputType = {
    id: number
    hostname: string
    type: $Enums.DomainType
    status: $Enums.DomainStatus
    sslStatus: $Enums.SslStatus
    userId: number
    cloudflareHostnameId: string | null
    cloudflareZoneId: string | null
    cloudflareRecordId: string | null
    verificationToken: string | null
    ownershipVerification: JsonValue | null
    dnsInstructions: JsonValue | null
    sslCertificateId: string | null
    sslValidationRecords: JsonValue | null
    lastVerifiedAt: Date | null
    expiresAt: Date | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count: DomainCountAggregateOutputType | null
    _avg: DomainAvgAggregateOutputType | null
    _sum: DomainSumAggregateOutputType | null
    _min: DomainMinAggregateOutputType | null
    _max: DomainMaxAggregateOutputType | null
  }

  type GetDomainGroupByPayload<T extends DomainGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DomainGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DomainGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DomainGroupByOutputType[P]>
            : GetScalarType<T[P], DomainGroupByOutputType[P]>
        }
      >
    >


  export type DomainSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hostname?: boolean
    type?: boolean
    status?: boolean
    sslStatus?: boolean
    userId?: boolean
    cloudflareHostnameId?: boolean
    cloudflareZoneId?: boolean
    cloudflareRecordId?: boolean
    verificationToken?: boolean
    ownershipVerification?: boolean
    dnsInstructions?: boolean
    sslCertificateId?: boolean
    sslValidationRecords?: boolean
    lastVerifiedAt?: boolean
    expiresAt?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    funnelConnections?: boolean | Domain$funnelConnectionsArgs<ExtArgs>
    _count?: boolean | DomainCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["domain"]>

  export type DomainSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hostname?: boolean
    type?: boolean
    status?: boolean
    sslStatus?: boolean
    userId?: boolean
    cloudflareHostnameId?: boolean
    cloudflareZoneId?: boolean
    cloudflareRecordId?: boolean
    verificationToken?: boolean
    ownershipVerification?: boolean
    dnsInstructions?: boolean
    sslCertificateId?: boolean
    sslValidationRecords?: boolean
    lastVerifiedAt?: boolean
    expiresAt?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["domain"]>

  export type DomainSelectScalar = {
    id?: boolean
    hostname?: boolean
    type?: boolean
    status?: boolean
    sslStatus?: boolean
    userId?: boolean
    cloudflareHostnameId?: boolean
    cloudflareZoneId?: boolean
    cloudflareRecordId?: boolean
    verificationToken?: boolean
    ownershipVerification?: boolean
    dnsInstructions?: boolean
    sslCertificateId?: boolean
    sslValidationRecords?: boolean
    lastVerifiedAt?: boolean
    expiresAt?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type DomainInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    funnelConnections?: boolean | Domain$funnelConnectionsArgs<ExtArgs>
    _count?: boolean | DomainCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type DomainIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $DomainPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Domain"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      funnelConnections: Prisma.$FunnelDomainPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      hostname: string
      type: $Enums.DomainType
      status: $Enums.DomainStatus
      sslStatus: $Enums.SslStatus
      userId: number
      cloudflareHostnameId: string | null
      cloudflareZoneId: string | null
      cloudflareRecordId: string | null
      verificationToken: string | null
      ownershipVerification: Prisma.JsonValue | null
      dnsInstructions: Prisma.JsonValue | null
      sslCertificateId: string | null
      sslValidationRecords: Prisma.JsonValue | null
      lastVerifiedAt: Date | null
      expiresAt: Date | null
      notes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["domain"]>
    composites: {}
  }

  type DomainGetPayload<S extends boolean | null | undefined | DomainDefaultArgs> = $Result.GetResult<Prisma.$DomainPayload, S>

  type DomainCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<DomainFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: DomainCountAggregateInputType | true
    }

  export interface DomainDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Domain'], meta: { name: 'Domain' } }
    /**
     * Find zero or one Domain that matches the filter.
     * @param {DomainFindUniqueArgs} args - Arguments to find a Domain
     * @example
     * // Get one Domain
     * const domain = await prisma.domain.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DomainFindUniqueArgs>(args: SelectSubset<T, DomainFindUniqueArgs<ExtArgs>>): Prisma__DomainClient<$Result.GetResult<Prisma.$DomainPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Domain that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {DomainFindUniqueOrThrowArgs} args - Arguments to find a Domain
     * @example
     * // Get one Domain
     * const domain = await prisma.domain.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DomainFindUniqueOrThrowArgs>(args: SelectSubset<T, DomainFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DomainClient<$Result.GetResult<Prisma.$DomainPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Domain that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DomainFindFirstArgs} args - Arguments to find a Domain
     * @example
     * // Get one Domain
     * const domain = await prisma.domain.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DomainFindFirstArgs>(args?: SelectSubset<T, DomainFindFirstArgs<ExtArgs>>): Prisma__DomainClient<$Result.GetResult<Prisma.$DomainPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Domain that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DomainFindFirstOrThrowArgs} args - Arguments to find a Domain
     * @example
     * // Get one Domain
     * const domain = await prisma.domain.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DomainFindFirstOrThrowArgs>(args?: SelectSubset<T, DomainFindFirstOrThrowArgs<ExtArgs>>): Prisma__DomainClient<$Result.GetResult<Prisma.$DomainPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Domains that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DomainFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Domains
     * const domains = await prisma.domain.findMany()
     * 
     * // Get first 10 Domains
     * const domains = await prisma.domain.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const domainWithIdOnly = await prisma.domain.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DomainFindManyArgs>(args?: SelectSubset<T, DomainFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DomainPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Domain.
     * @param {DomainCreateArgs} args - Arguments to create a Domain.
     * @example
     * // Create one Domain
     * const Domain = await prisma.domain.create({
     *   data: {
     *     // ... data to create a Domain
     *   }
     * })
     * 
     */
    create<T extends DomainCreateArgs>(args: SelectSubset<T, DomainCreateArgs<ExtArgs>>): Prisma__DomainClient<$Result.GetResult<Prisma.$DomainPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Domains.
     * @param {DomainCreateManyArgs} args - Arguments to create many Domains.
     * @example
     * // Create many Domains
     * const domain = await prisma.domain.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DomainCreateManyArgs>(args?: SelectSubset<T, DomainCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Domains and returns the data saved in the database.
     * @param {DomainCreateManyAndReturnArgs} args - Arguments to create many Domains.
     * @example
     * // Create many Domains
     * const domain = await prisma.domain.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Domains and only return the `id`
     * const domainWithIdOnly = await prisma.domain.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DomainCreateManyAndReturnArgs>(args?: SelectSubset<T, DomainCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DomainPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Domain.
     * @param {DomainDeleteArgs} args - Arguments to delete one Domain.
     * @example
     * // Delete one Domain
     * const Domain = await prisma.domain.delete({
     *   where: {
     *     // ... filter to delete one Domain
     *   }
     * })
     * 
     */
    delete<T extends DomainDeleteArgs>(args: SelectSubset<T, DomainDeleteArgs<ExtArgs>>): Prisma__DomainClient<$Result.GetResult<Prisma.$DomainPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Domain.
     * @param {DomainUpdateArgs} args - Arguments to update one Domain.
     * @example
     * // Update one Domain
     * const domain = await prisma.domain.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DomainUpdateArgs>(args: SelectSubset<T, DomainUpdateArgs<ExtArgs>>): Prisma__DomainClient<$Result.GetResult<Prisma.$DomainPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Domains.
     * @param {DomainDeleteManyArgs} args - Arguments to filter Domains to delete.
     * @example
     * // Delete a few Domains
     * const { count } = await prisma.domain.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DomainDeleteManyArgs>(args?: SelectSubset<T, DomainDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Domains.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DomainUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Domains
     * const domain = await prisma.domain.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DomainUpdateManyArgs>(args: SelectSubset<T, DomainUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Domain.
     * @param {DomainUpsertArgs} args - Arguments to update or create a Domain.
     * @example
     * // Update or create a Domain
     * const domain = await prisma.domain.upsert({
     *   create: {
     *     // ... data to create a Domain
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Domain we want to update
     *   }
     * })
     */
    upsert<T extends DomainUpsertArgs>(args: SelectSubset<T, DomainUpsertArgs<ExtArgs>>): Prisma__DomainClient<$Result.GetResult<Prisma.$DomainPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Domains.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DomainCountArgs} args - Arguments to filter Domains to count.
     * @example
     * // Count the number of Domains
     * const count = await prisma.domain.count({
     *   where: {
     *     // ... the filter for the Domains we want to count
     *   }
     * })
    **/
    count<T extends DomainCountArgs>(
      args?: Subset<T, DomainCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DomainCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Domain.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DomainAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DomainAggregateArgs>(args: Subset<T, DomainAggregateArgs>): Prisma.PrismaPromise<GetDomainAggregateType<T>>

    /**
     * Group by Domain.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DomainGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DomainGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DomainGroupByArgs['orderBy'] }
        : { orderBy?: DomainGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DomainGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDomainGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Domain model
   */
  readonly fields: DomainFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Domain.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DomainClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    funnelConnections<T extends Domain$funnelConnectionsArgs<ExtArgs> = {}>(args?: Subset<T, Domain$funnelConnectionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FunnelDomainPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Domain model
   */ 
  interface DomainFieldRefs {
    readonly id: FieldRef<"Domain", 'Int'>
    readonly hostname: FieldRef<"Domain", 'String'>
    readonly type: FieldRef<"Domain", 'DomainType'>
    readonly status: FieldRef<"Domain", 'DomainStatus'>
    readonly sslStatus: FieldRef<"Domain", 'SslStatus'>
    readonly userId: FieldRef<"Domain", 'Int'>
    readonly cloudflareHostnameId: FieldRef<"Domain", 'String'>
    readonly cloudflareZoneId: FieldRef<"Domain", 'String'>
    readonly cloudflareRecordId: FieldRef<"Domain", 'String'>
    readonly verificationToken: FieldRef<"Domain", 'String'>
    readonly ownershipVerification: FieldRef<"Domain", 'Json'>
    readonly dnsInstructions: FieldRef<"Domain", 'Json'>
    readonly sslCertificateId: FieldRef<"Domain", 'String'>
    readonly sslValidationRecords: FieldRef<"Domain", 'Json'>
    readonly lastVerifiedAt: FieldRef<"Domain", 'DateTime'>
    readonly expiresAt: FieldRef<"Domain", 'DateTime'>
    readonly notes: FieldRef<"Domain", 'String'>
    readonly createdAt: FieldRef<"Domain", 'DateTime'>
    readonly updatedAt: FieldRef<"Domain", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Domain findUnique
   */
  export type DomainFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Domain
     */
    select?: DomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DomainInclude<ExtArgs> | null
    /**
     * Filter, which Domain to fetch.
     */
    where: DomainWhereUniqueInput
  }

  /**
   * Domain findUniqueOrThrow
   */
  export type DomainFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Domain
     */
    select?: DomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DomainInclude<ExtArgs> | null
    /**
     * Filter, which Domain to fetch.
     */
    where: DomainWhereUniqueInput
  }

  /**
   * Domain findFirst
   */
  export type DomainFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Domain
     */
    select?: DomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DomainInclude<ExtArgs> | null
    /**
     * Filter, which Domain to fetch.
     */
    where?: DomainWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Domains to fetch.
     */
    orderBy?: DomainOrderByWithRelationInput | DomainOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Domains.
     */
    cursor?: DomainWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Domains from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Domains.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Domains.
     */
    distinct?: DomainScalarFieldEnum | DomainScalarFieldEnum[]
  }

  /**
   * Domain findFirstOrThrow
   */
  export type DomainFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Domain
     */
    select?: DomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DomainInclude<ExtArgs> | null
    /**
     * Filter, which Domain to fetch.
     */
    where?: DomainWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Domains to fetch.
     */
    orderBy?: DomainOrderByWithRelationInput | DomainOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Domains.
     */
    cursor?: DomainWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Domains from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Domains.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Domains.
     */
    distinct?: DomainScalarFieldEnum | DomainScalarFieldEnum[]
  }

  /**
   * Domain findMany
   */
  export type DomainFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Domain
     */
    select?: DomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DomainInclude<ExtArgs> | null
    /**
     * Filter, which Domains to fetch.
     */
    where?: DomainWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Domains to fetch.
     */
    orderBy?: DomainOrderByWithRelationInput | DomainOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Domains.
     */
    cursor?: DomainWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Domains from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Domains.
     */
    skip?: number
    distinct?: DomainScalarFieldEnum | DomainScalarFieldEnum[]
  }

  /**
   * Domain create
   */
  export type DomainCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Domain
     */
    select?: DomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DomainInclude<ExtArgs> | null
    /**
     * The data needed to create a Domain.
     */
    data: XOR<DomainCreateInput, DomainUncheckedCreateInput>
  }

  /**
   * Domain createMany
   */
  export type DomainCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Domains.
     */
    data: DomainCreateManyInput | DomainCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Domain createManyAndReturn
   */
  export type DomainCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Domain
     */
    select?: DomainSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Domains.
     */
    data: DomainCreateManyInput | DomainCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DomainIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Domain update
   */
  export type DomainUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Domain
     */
    select?: DomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DomainInclude<ExtArgs> | null
    /**
     * The data needed to update a Domain.
     */
    data: XOR<DomainUpdateInput, DomainUncheckedUpdateInput>
    /**
     * Choose, which Domain to update.
     */
    where: DomainWhereUniqueInput
  }

  /**
   * Domain updateMany
   */
  export type DomainUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Domains.
     */
    data: XOR<DomainUpdateManyMutationInput, DomainUncheckedUpdateManyInput>
    /**
     * Filter which Domains to update
     */
    where?: DomainWhereInput
  }

  /**
   * Domain upsert
   */
  export type DomainUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Domain
     */
    select?: DomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DomainInclude<ExtArgs> | null
    /**
     * The filter to search for the Domain to update in case it exists.
     */
    where: DomainWhereUniqueInput
    /**
     * In case the Domain found by the `where` argument doesn't exist, create a new Domain with this data.
     */
    create: XOR<DomainCreateInput, DomainUncheckedCreateInput>
    /**
     * In case the Domain was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DomainUpdateInput, DomainUncheckedUpdateInput>
  }

  /**
   * Domain delete
   */
  export type DomainDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Domain
     */
    select?: DomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DomainInclude<ExtArgs> | null
    /**
     * Filter which Domain to delete.
     */
    where: DomainWhereUniqueInput
  }

  /**
   * Domain deleteMany
   */
  export type DomainDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Domains to delete
     */
    where?: DomainWhereInput
  }

  /**
   * Domain.funnelConnections
   */
  export type Domain$funnelConnectionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainInclude<ExtArgs> | null
    where?: FunnelDomainWhereInput
    orderBy?: FunnelDomainOrderByWithRelationInput | FunnelDomainOrderByWithRelationInput[]
    cursor?: FunnelDomainWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FunnelDomainScalarFieldEnum | FunnelDomainScalarFieldEnum[]
  }

  /**
   * Domain without action
   */
  export type DomainDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Domain
     */
    select?: DomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DomainInclude<ExtArgs> | null
  }


  /**
   * Model FunnelDomain
   */

  export type AggregateFunnelDomain = {
    _count: FunnelDomainCountAggregateOutputType | null
    _avg: FunnelDomainAvgAggregateOutputType | null
    _sum: FunnelDomainSumAggregateOutputType | null
    _min: FunnelDomainMinAggregateOutputType | null
    _max: FunnelDomainMaxAggregateOutputType | null
  }

  export type FunnelDomainAvgAggregateOutputType = {
    id: number | null
    funnelId: number | null
    domainId: number | null
  }

  export type FunnelDomainSumAggregateOutputType = {
    id: number | null
    funnelId: number | null
    domainId: number | null
  }

  export type FunnelDomainMinAggregateOutputType = {
    id: number | null
    funnelId: number | null
    domainId: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FunnelDomainMaxAggregateOutputType = {
    id: number | null
    funnelId: number | null
    domainId: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FunnelDomainCountAggregateOutputType = {
    id: number
    funnelId: number
    domainId: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type FunnelDomainAvgAggregateInputType = {
    id?: true
    funnelId?: true
    domainId?: true
  }

  export type FunnelDomainSumAggregateInputType = {
    id?: true
    funnelId?: true
    domainId?: true
  }

  export type FunnelDomainMinAggregateInputType = {
    id?: true
    funnelId?: true
    domainId?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FunnelDomainMaxAggregateInputType = {
    id?: true
    funnelId?: true
    domainId?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FunnelDomainCountAggregateInputType = {
    id?: true
    funnelId?: true
    domainId?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type FunnelDomainAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FunnelDomain to aggregate.
     */
    where?: FunnelDomainWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FunnelDomains to fetch.
     */
    orderBy?: FunnelDomainOrderByWithRelationInput | FunnelDomainOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FunnelDomainWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FunnelDomains from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FunnelDomains.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned FunnelDomains
    **/
    _count?: true | FunnelDomainCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FunnelDomainAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FunnelDomainSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FunnelDomainMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FunnelDomainMaxAggregateInputType
  }

  export type GetFunnelDomainAggregateType<T extends FunnelDomainAggregateArgs> = {
        [P in keyof T & keyof AggregateFunnelDomain]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFunnelDomain[P]>
      : GetScalarType<T[P], AggregateFunnelDomain[P]>
  }




  export type FunnelDomainGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FunnelDomainWhereInput
    orderBy?: FunnelDomainOrderByWithAggregationInput | FunnelDomainOrderByWithAggregationInput[]
    by: FunnelDomainScalarFieldEnum[] | FunnelDomainScalarFieldEnum
    having?: FunnelDomainScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FunnelDomainCountAggregateInputType | true
    _avg?: FunnelDomainAvgAggregateInputType
    _sum?: FunnelDomainSumAggregateInputType
    _min?: FunnelDomainMinAggregateInputType
    _max?: FunnelDomainMaxAggregateInputType
  }

  export type FunnelDomainGroupByOutputType = {
    id: number
    funnelId: number
    domainId: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: FunnelDomainCountAggregateOutputType | null
    _avg: FunnelDomainAvgAggregateOutputType | null
    _sum: FunnelDomainSumAggregateOutputType | null
    _min: FunnelDomainMinAggregateOutputType | null
    _max: FunnelDomainMaxAggregateOutputType | null
  }

  type GetFunnelDomainGroupByPayload<T extends FunnelDomainGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FunnelDomainGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FunnelDomainGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FunnelDomainGroupByOutputType[P]>
            : GetScalarType<T[P], FunnelDomainGroupByOutputType[P]>
        }
      >
    >


  export type FunnelDomainSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    funnelId?: boolean
    domainId?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    funnel?: boolean | FunnelDefaultArgs<ExtArgs>
    domain?: boolean | DomainDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["funnelDomain"]>

  export type FunnelDomainSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    funnelId?: boolean
    domainId?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    funnel?: boolean | FunnelDefaultArgs<ExtArgs>
    domain?: boolean | DomainDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["funnelDomain"]>

  export type FunnelDomainSelectScalar = {
    id?: boolean
    funnelId?: boolean
    domainId?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type FunnelDomainInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    funnel?: boolean | FunnelDefaultArgs<ExtArgs>
    domain?: boolean | DomainDefaultArgs<ExtArgs>
  }
  export type FunnelDomainIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    funnel?: boolean | FunnelDefaultArgs<ExtArgs>
    domain?: boolean | DomainDefaultArgs<ExtArgs>
  }

  export type $FunnelDomainPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "FunnelDomain"
    objects: {
      funnel: Prisma.$FunnelPayload<ExtArgs>
      domain: Prisma.$DomainPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      funnelId: number
      domainId: number
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["funnelDomain"]>
    composites: {}
  }

  type FunnelDomainGetPayload<S extends boolean | null | undefined | FunnelDomainDefaultArgs> = $Result.GetResult<Prisma.$FunnelDomainPayload, S>

  type FunnelDomainCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<FunnelDomainFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: FunnelDomainCountAggregateInputType | true
    }

  export interface FunnelDomainDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['FunnelDomain'], meta: { name: 'FunnelDomain' } }
    /**
     * Find zero or one FunnelDomain that matches the filter.
     * @param {FunnelDomainFindUniqueArgs} args - Arguments to find a FunnelDomain
     * @example
     * // Get one FunnelDomain
     * const funnelDomain = await prisma.funnelDomain.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FunnelDomainFindUniqueArgs>(args: SelectSubset<T, FunnelDomainFindUniqueArgs<ExtArgs>>): Prisma__FunnelDomainClient<$Result.GetResult<Prisma.$FunnelDomainPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one FunnelDomain that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {FunnelDomainFindUniqueOrThrowArgs} args - Arguments to find a FunnelDomain
     * @example
     * // Get one FunnelDomain
     * const funnelDomain = await prisma.funnelDomain.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FunnelDomainFindUniqueOrThrowArgs>(args: SelectSubset<T, FunnelDomainFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FunnelDomainClient<$Result.GetResult<Prisma.$FunnelDomainPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first FunnelDomain that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelDomainFindFirstArgs} args - Arguments to find a FunnelDomain
     * @example
     * // Get one FunnelDomain
     * const funnelDomain = await prisma.funnelDomain.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FunnelDomainFindFirstArgs>(args?: SelectSubset<T, FunnelDomainFindFirstArgs<ExtArgs>>): Prisma__FunnelDomainClient<$Result.GetResult<Prisma.$FunnelDomainPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first FunnelDomain that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelDomainFindFirstOrThrowArgs} args - Arguments to find a FunnelDomain
     * @example
     * // Get one FunnelDomain
     * const funnelDomain = await prisma.funnelDomain.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FunnelDomainFindFirstOrThrowArgs>(args?: SelectSubset<T, FunnelDomainFindFirstOrThrowArgs<ExtArgs>>): Prisma__FunnelDomainClient<$Result.GetResult<Prisma.$FunnelDomainPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more FunnelDomains that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelDomainFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FunnelDomains
     * const funnelDomains = await prisma.funnelDomain.findMany()
     * 
     * // Get first 10 FunnelDomains
     * const funnelDomains = await prisma.funnelDomain.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const funnelDomainWithIdOnly = await prisma.funnelDomain.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FunnelDomainFindManyArgs>(args?: SelectSubset<T, FunnelDomainFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FunnelDomainPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a FunnelDomain.
     * @param {FunnelDomainCreateArgs} args - Arguments to create a FunnelDomain.
     * @example
     * // Create one FunnelDomain
     * const FunnelDomain = await prisma.funnelDomain.create({
     *   data: {
     *     // ... data to create a FunnelDomain
     *   }
     * })
     * 
     */
    create<T extends FunnelDomainCreateArgs>(args: SelectSubset<T, FunnelDomainCreateArgs<ExtArgs>>): Prisma__FunnelDomainClient<$Result.GetResult<Prisma.$FunnelDomainPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many FunnelDomains.
     * @param {FunnelDomainCreateManyArgs} args - Arguments to create many FunnelDomains.
     * @example
     * // Create many FunnelDomains
     * const funnelDomain = await prisma.funnelDomain.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FunnelDomainCreateManyArgs>(args?: SelectSubset<T, FunnelDomainCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many FunnelDomains and returns the data saved in the database.
     * @param {FunnelDomainCreateManyAndReturnArgs} args - Arguments to create many FunnelDomains.
     * @example
     * // Create many FunnelDomains
     * const funnelDomain = await prisma.funnelDomain.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many FunnelDomains and only return the `id`
     * const funnelDomainWithIdOnly = await prisma.funnelDomain.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FunnelDomainCreateManyAndReturnArgs>(args?: SelectSubset<T, FunnelDomainCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FunnelDomainPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a FunnelDomain.
     * @param {FunnelDomainDeleteArgs} args - Arguments to delete one FunnelDomain.
     * @example
     * // Delete one FunnelDomain
     * const FunnelDomain = await prisma.funnelDomain.delete({
     *   where: {
     *     // ... filter to delete one FunnelDomain
     *   }
     * })
     * 
     */
    delete<T extends FunnelDomainDeleteArgs>(args: SelectSubset<T, FunnelDomainDeleteArgs<ExtArgs>>): Prisma__FunnelDomainClient<$Result.GetResult<Prisma.$FunnelDomainPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one FunnelDomain.
     * @param {FunnelDomainUpdateArgs} args - Arguments to update one FunnelDomain.
     * @example
     * // Update one FunnelDomain
     * const funnelDomain = await prisma.funnelDomain.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FunnelDomainUpdateArgs>(args: SelectSubset<T, FunnelDomainUpdateArgs<ExtArgs>>): Prisma__FunnelDomainClient<$Result.GetResult<Prisma.$FunnelDomainPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more FunnelDomains.
     * @param {FunnelDomainDeleteManyArgs} args - Arguments to filter FunnelDomains to delete.
     * @example
     * // Delete a few FunnelDomains
     * const { count } = await prisma.funnelDomain.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FunnelDomainDeleteManyArgs>(args?: SelectSubset<T, FunnelDomainDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FunnelDomains.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelDomainUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FunnelDomains
     * const funnelDomain = await prisma.funnelDomain.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FunnelDomainUpdateManyArgs>(args: SelectSubset<T, FunnelDomainUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one FunnelDomain.
     * @param {FunnelDomainUpsertArgs} args - Arguments to update or create a FunnelDomain.
     * @example
     * // Update or create a FunnelDomain
     * const funnelDomain = await prisma.funnelDomain.upsert({
     *   create: {
     *     // ... data to create a FunnelDomain
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FunnelDomain we want to update
     *   }
     * })
     */
    upsert<T extends FunnelDomainUpsertArgs>(args: SelectSubset<T, FunnelDomainUpsertArgs<ExtArgs>>): Prisma__FunnelDomainClient<$Result.GetResult<Prisma.$FunnelDomainPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of FunnelDomains.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelDomainCountArgs} args - Arguments to filter FunnelDomains to count.
     * @example
     * // Count the number of FunnelDomains
     * const count = await prisma.funnelDomain.count({
     *   where: {
     *     // ... the filter for the FunnelDomains we want to count
     *   }
     * })
    **/
    count<T extends FunnelDomainCountArgs>(
      args?: Subset<T, FunnelDomainCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FunnelDomainCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FunnelDomain.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelDomainAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FunnelDomainAggregateArgs>(args: Subset<T, FunnelDomainAggregateArgs>): Prisma.PrismaPromise<GetFunnelDomainAggregateType<T>>

    /**
     * Group by FunnelDomain.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FunnelDomainGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FunnelDomainGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FunnelDomainGroupByArgs['orderBy'] }
        : { orderBy?: FunnelDomainGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FunnelDomainGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFunnelDomainGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the FunnelDomain model
   */
  readonly fields: FunnelDomainFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for FunnelDomain.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FunnelDomainClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    funnel<T extends FunnelDefaultArgs<ExtArgs> = {}>(args?: Subset<T, FunnelDefaultArgs<ExtArgs>>): Prisma__FunnelClient<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    domain<T extends DomainDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DomainDefaultArgs<ExtArgs>>): Prisma__DomainClient<$Result.GetResult<Prisma.$DomainPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the FunnelDomain model
   */ 
  interface FunnelDomainFieldRefs {
    readonly id: FieldRef<"FunnelDomain", 'Int'>
    readonly funnelId: FieldRef<"FunnelDomain", 'Int'>
    readonly domainId: FieldRef<"FunnelDomain", 'Int'>
    readonly isActive: FieldRef<"FunnelDomain", 'Boolean'>
    readonly createdAt: FieldRef<"FunnelDomain", 'DateTime'>
    readonly updatedAt: FieldRef<"FunnelDomain", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * FunnelDomain findUnique
   */
  export type FunnelDomainFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainInclude<ExtArgs> | null
    /**
     * Filter, which FunnelDomain to fetch.
     */
    where: FunnelDomainWhereUniqueInput
  }

  /**
   * FunnelDomain findUniqueOrThrow
   */
  export type FunnelDomainFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainInclude<ExtArgs> | null
    /**
     * Filter, which FunnelDomain to fetch.
     */
    where: FunnelDomainWhereUniqueInput
  }

  /**
   * FunnelDomain findFirst
   */
  export type FunnelDomainFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainInclude<ExtArgs> | null
    /**
     * Filter, which FunnelDomain to fetch.
     */
    where?: FunnelDomainWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FunnelDomains to fetch.
     */
    orderBy?: FunnelDomainOrderByWithRelationInput | FunnelDomainOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FunnelDomains.
     */
    cursor?: FunnelDomainWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FunnelDomains from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FunnelDomains.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FunnelDomains.
     */
    distinct?: FunnelDomainScalarFieldEnum | FunnelDomainScalarFieldEnum[]
  }

  /**
   * FunnelDomain findFirstOrThrow
   */
  export type FunnelDomainFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainInclude<ExtArgs> | null
    /**
     * Filter, which FunnelDomain to fetch.
     */
    where?: FunnelDomainWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FunnelDomains to fetch.
     */
    orderBy?: FunnelDomainOrderByWithRelationInput | FunnelDomainOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FunnelDomains.
     */
    cursor?: FunnelDomainWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FunnelDomains from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FunnelDomains.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FunnelDomains.
     */
    distinct?: FunnelDomainScalarFieldEnum | FunnelDomainScalarFieldEnum[]
  }

  /**
   * FunnelDomain findMany
   */
  export type FunnelDomainFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainInclude<ExtArgs> | null
    /**
     * Filter, which FunnelDomains to fetch.
     */
    where?: FunnelDomainWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FunnelDomains to fetch.
     */
    orderBy?: FunnelDomainOrderByWithRelationInput | FunnelDomainOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing FunnelDomains.
     */
    cursor?: FunnelDomainWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FunnelDomains from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FunnelDomains.
     */
    skip?: number
    distinct?: FunnelDomainScalarFieldEnum | FunnelDomainScalarFieldEnum[]
  }

  /**
   * FunnelDomain create
   */
  export type FunnelDomainCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainInclude<ExtArgs> | null
    /**
     * The data needed to create a FunnelDomain.
     */
    data: XOR<FunnelDomainCreateInput, FunnelDomainUncheckedCreateInput>
  }

  /**
   * FunnelDomain createMany
   */
  export type FunnelDomainCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many FunnelDomains.
     */
    data: FunnelDomainCreateManyInput | FunnelDomainCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FunnelDomain createManyAndReturn
   */
  export type FunnelDomainCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many FunnelDomains.
     */
    data: FunnelDomainCreateManyInput | FunnelDomainCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * FunnelDomain update
   */
  export type FunnelDomainUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainInclude<ExtArgs> | null
    /**
     * The data needed to update a FunnelDomain.
     */
    data: XOR<FunnelDomainUpdateInput, FunnelDomainUncheckedUpdateInput>
    /**
     * Choose, which FunnelDomain to update.
     */
    where: FunnelDomainWhereUniqueInput
  }

  /**
   * FunnelDomain updateMany
   */
  export type FunnelDomainUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update FunnelDomains.
     */
    data: XOR<FunnelDomainUpdateManyMutationInput, FunnelDomainUncheckedUpdateManyInput>
    /**
     * Filter which FunnelDomains to update
     */
    where?: FunnelDomainWhereInput
  }

  /**
   * FunnelDomain upsert
   */
  export type FunnelDomainUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainInclude<ExtArgs> | null
    /**
     * The filter to search for the FunnelDomain to update in case it exists.
     */
    where: FunnelDomainWhereUniqueInput
    /**
     * In case the FunnelDomain found by the `where` argument doesn't exist, create a new FunnelDomain with this data.
     */
    create: XOR<FunnelDomainCreateInput, FunnelDomainUncheckedCreateInput>
    /**
     * In case the FunnelDomain was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FunnelDomainUpdateInput, FunnelDomainUncheckedUpdateInput>
  }

  /**
   * FunnelDomain delete
   */
  export type FunnelDomainDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainInclude<ExtArgs> | null
    /**
     * Filter which FunnelDomain to delete.
     */
    where: FunnelDomainWhereUniqueInput
  }

  /**
   * FunnelDomain deleteMany
   */
  export type FunnelDomainDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FunnelDomains to delete
     */
    where?: FunnelDomainWhereInput
  }

  /**
   * FunnelDomain without action
   */
  export type FunnelDomainDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FunnelDomain
     */
    select?: FunnelDomainSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelDomainInclude<ExtArgs> | null
  }


  /**
   * Model Page
   */

  export type AggregatePage = {
    _count: PageCountAggregateOutputType | null
    _avg: PageAvgAggregateOutputType | null
    _sum: PageSumAggregateOutputType | null
    _min: PageMinAggregateOutputType | null
    _max: PageMaxAggregateOutputType | null
  }

  export type PageAvgAggregateOutputType = {
    id: number | null
    order: number | null
    funnelId: number | null
  }

  export type PageSumAggregateOutputType = {
    id: number | null
    order: number | null
    funnelId: number | null
  }

  export type PageMinAggregateOutputType = {
    id: number | null
    name: string | null
    content: string | null
    order: number | null
    linkingId: string | null
    funnelId: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PageMaxAggregateOutputType = {
    id: number | null
    name: string | null
    content: string | null
    order: number | null
    linkingId: string | null
    funnelId: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PageCountAggregateOutputType = {
    id: number
    name: number
    content: number
    order: number
    linkingId: number
    funnelId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PageAvgAggregateInputType = {
    id?: true
    order?: true
    funnelId?: true
  }

  export type PageSumAggregateInputType = {
    id?: true
    order?: true
    funnelId?: true
  }

  export type PageMinAggregateInputType = {
    id?: true
    name?: true
    content?: true
    order?: true
    linkingId?: true
    funnelId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PageMaxAggregateInputType = {
    id?: true
    name?: true
    content?: true
    order?: true
    linkingId?: true
    funnelId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PageCountAggregateInputType = {
    id?: true
    name?: true
    content?: true
    order?: true
    linkingId?: true
    funnelId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Page to aggregate.
     */
    where?: PageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Pages to fetch.
     */
    orderBy?: PageOrderByWithRelationInput | PageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Pages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Pages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Pages
    **/
    _count?: true | PageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PageMaxAggregateInputType
  }

  export type GetPageAggregateType<T extends PageAggregateArgs> = {
        [P in keyof T & keyof AggregatePage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePage[P]>
      : GetScalarType<T[P], AggregatePage[P]>
  }




  export type PageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PageWhereInput
    orderBy?: PageOrderByWithAggregationInput | PageOrderByWithAggregationInput[]
    by: PageScalarFieldEnum[] | PageScalarFieldEnum
    having?: PageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PageCountAggregateInputType | true
    _avg?: PageAvgAggregateInputType
    _sum?: PageSumAggregateInputType
    _min?: PageMinAggregateInputType
    _max?: PageMaxAggregateInputType
  }

  export type PageGroupByOutputType = {
    id: number
    name: string
    content: string | null
    order: number
    linkingId: string | null
    funnelId: number
    createdAt: Date
    updatedAt: Date
    _count: PageCountAggregateOutputType | null
    _avg: PageAvgAggregateOutputType | null
    _sum: PageSumAggregateOutputType | null
    _min: PageMinAggregateOutputType | null
    _max: PageMaxAggregateOutputType | null
  }

  type GetPageGroupByPayload<T extends PageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PageGroupByOutputType[P]>
            : GetScalarType<T[P], PageGroupByOutputType[P]>
        }
      >
    >


  export type PageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    content?: boolean
    order?: boolean
    linkingId?: boolean
    funnelId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    funnel?: boolean | FunnelDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["page"]>

  export type PageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    content?: boolean
    order?: boolean
    linkingId?: boolean
    funnelId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    funnel?: boolean | FunnelDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["page"]>

  export type PageSelectScalar = {
    id?: boolean
    name?: boolean
    content?: boolean
    order?: boolean
    linkingId?: boolean
    funnelId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    funnel?: boolean | FunnelDefaultArgs<ExtArgs>
  }
  export type PageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    funnel?: boolean | FunnelDefaultArgs<ExtArgs>
  }

  export type $PagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Page"
    objects: {
      funnel: Prisma.$FunnelPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      content: string | null
      order: number
      linkingId: string | null
      funnelId: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["page"]>
    composites: {}
  }

  type PageGetPayload<S extends boolean | null | undefined | PageDefaultArgs> = $Result.GetResult<Prisma.$PagePayload, S>

  type PageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PageFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PageCountAggregateInputType | true
    }

  export interface PageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Page'], meta: { name: 'Page' } }
    /**
     * Find zero or one Page that matches the filter.
     * @param {PageFindUniqueArgs} args - Arguments to find a Page
     * @example
     * // Get one Page
     * const page = await prisma.page.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PageFindUniqueArgs>(args: SelectSubset<T, PageFindUniqueArgs<ExtArgs>>): Prisma__PageClient<$Result.GetResult<Prisma.$PagePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Page that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PageFindUniqueOrThrowArgs} args - Arguments to find a Page
     * @example
     * // Get one Page
     * const page = await prisma.page.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PageFindUniqueOrThrowArgs>(args: SelectSubset<T, PageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PageClient<$Result.GetResult<Prisma.$PagePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Page that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PageFindFirstArgs} args - Arguments to find a Page
     * @example
     * // Get one Page
     * const page = await prisma.page.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PageFindFirstArgs>(args?: SelectSubset<T, PageFindFirstArgs<ExtArgs>>): Prisma__PageClient<$Result.GetResult<Prisma.$PagePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Page that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PageFindFirstOrThrowArgs} args - Arguments to find a Page
     * @example
     * // Get one Page
     * const page = await prisma.page.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PageFindFirstOrThrowArgs>(args?: SelectSubset<T, PageFindFirstOrThrowArgs<ExtArgs>>): Prisma__PageClient<$Result.GetResult<Prisma.$PagePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Pages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Pages
     * const pages = await prisma.page.findMany()
     * 
     * // Get first 10 Pages
     * const pages = await prisma.page.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pageWithIdOnly = await prisma.page.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PageFindManyArgs>(args?: SelectSubset<T, PageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PagePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Page.
     * @param {PageCreateArgs} args - Arguments to create a Page.
     * @example
     * // Create one Page
     * const Page = await prisma.page.create({
     *   data: {
     *     // ... data to create a Page
     *   }
     * })
     * 
     */
    create<T extends PageCreateArgs>(args: SelectSubset<T, PageCreateArgs<ExtArgs>>): Prisma__PageClient<$Result.GetResult<Prisma.$PagePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Pages.
     * @param {PageCreateManyArgs} args - Arguments to create many Pages.
     * @example
     * // Create many Pages
     * const page = await prisma.page.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PageCreateManyArgs>(args?: SelectSubset<T, PageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Pages and returns the data saved in the database.
     * @param {PageCreateManyAndReturnArgs} args - Arguments to create many Pages.
     * @example
     * // Create many Pages
     * const page = await prisma.page.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Pages and only return the `id`
     * const pageWithIdOnly = await prisma.page.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PageCreateManyAndReturnArgs>(args?: SelectSubset<T, PageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PagePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Page.
     * @param {PageDeleteArgs} args - Arguments to delete one Page.
     * @example
     * // Delete one Page
     * const Page = await prisma.page.delete({
     *   where: {
     *     // ... filter to delete one Page
     *   }
     * })
     * 
     */
    delete<T extends PageDeleteArgs>(args: SelectSubset<T, PageDeleteArgs<ExtArgs>>): Prisma__PageClient<$Result.GetResult<Prisma.$PagePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Page.
     * @param {PageUpdateArgs} args - Arguments to update one Page.
     * @example
     * // Update one Page
     * const page = await prisma.page.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PageUpdateArgs>(args: SelectSubset<T, PageUpdateArgs<ExtArgs>>): Prisma__PageClient<$Result.GetResult<Prisma.$PagePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Pages.
     * @param {PageDeleteManyArgs} args - Arguments to filter Pages to delete.
     * @example
     * // Delete a few Pages
     * const { count } = await prisma.page.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PageDeleteManyArgs>(args?: SelectSubset<T, PageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Pages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Pages
     * const page = await prisma.page.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PageUpdateManyArgs>(args: SelectSubset<T, PageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Page.
     * @param {PageUpsertArgs} args - Arguments to update or create a Page.
     * @example
     * // Update or create a Page
     * const page = await prisma.page.upsert({
     *   create: {
     *     // ... data to create a Page
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Page we want to update
     *   }
     * })
     */
    upsert<T extends PageUpsertArgs>(args: SelectSubset<T, PageUpsertArgs<ExtArgs>>): Prisma__PageClient<$Result.GetResult<Prisma.$PagePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Pages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PageCountArgs} args - Arguments to filter Pages to count.
     * @example
     * // Count the number of Pages
     * const count = await prisma.page.count({
     *   where: {
     *     // ... the filter for the Pages we want to count
     *   }
     * })
    **/
    count<T extends PageCountArgs>(
      args?: Subset<T, PageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Page.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PageAggregateArgs>(args: Subset<T, PageAggregateArgs>): Prisma.PrismaPromise<GetPageAggregateType<T>>

    /**
     * Group by Page.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PageGroupByArgs['orderBy'] }
        : { orderBy?: PageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Page model
   */
  readonly fields: PageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Page.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    funnel<T extends FunnelDefaultArgs<ExtArgs> = {}>(args?: Subset<T, FunnelDefaultArgs<ExtArgs>>): Prisma__FunnelClient<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Page model
   */ 
  interface PageFieldRefs {
    readonly id: FieldRef<"Page", 'Int'>
    readonly name: FieldRef<"Page", 'String'>
    readonly content: FieldRef<"Page", 'String'>
    readonly order: FieldRef<"Page", 'Int'>
    readonly linkingId: FieldRef<"Page", 'String'>
    readonly funnelId: FieldRef<"Page", 'Int'>
    readonly createdAt: FieldRef<"Page", 'DateTime'>
    readonly updatedAt: FieldRef<"Page", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Page findUnique
   */
  export type PageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Page
     */
    select?: PageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PageInclude<ExtArgs> | null
    /**
     * Filter, which Page to fetch.
     */
    where: PageWhereUniqueInput
  }

  /**
   * Page findUniqueOrThrow
   */
  export type PageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Page
     */
    select?: PageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PageInclude<ExtArgs> | null
    /**
     * Filter, which Page to fetch.
     */
    where: PageWhereUniqueInput
  }

  /**
   * Page findFirst
   */
  export type PageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Page
     */
    select?: PageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PageInclude<ExtArgs> | null
    /**
     * Filter, which Page to fetch.
     */
    where?: PageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Pages to fetch.
     */
    orderBy?: PageOrderByWithRelationInput | PageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Pages.
     */
    cursor?: PageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Pages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Pages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Pages.
     */
    distinct?: PageScalarFieldEnum | PageScalarFieldEnum[]
  }

  /**
   * Page findFirstOrThrow
   */
  export type PageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Page
     */
    select?: PageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PageInclude<ExtArgs> | null
    /**
     * Filter, which Page to fetch.
     */
    where?: PageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Pages to fetch.
     */
    orderBy?: PageOrderByWithRelationInput | PageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Pages.
     */
    cursor?: PageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Pages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Pages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Pages.
     */
    distinct?: PageScalarFieldEnum | PageScalarFieldEnum[]
  }

  /**
   * Page findMany
   */
  export type PageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Page
     */
    select?: PageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PageInclude<ExtArgs> | null
    /**
     * Filter, which Pages to fetch.
     */
    where?: PageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Pages to fetch.
     */
    orderBy?: PageOrderByWithRelationInput | PageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Pages.
     */
    cursor?: PageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Pages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Pages.
     */
    skip?: number
    distinct?: PageScalarFieldEnum | PageScalarFieldEnum[]
  }

  /**
   * Page create
   */
  export type PageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Page
     */
    select?: PageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PageInclude<ExtArgs> | null
    /**
     * The data needed to create a Page.
     */
    data: XOR<PageCreateInput, PageUncheckedCreateInput>
  }

  /**
   * Page createMany
   */
  export type PageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Pages.
     */
    data: PageCreateManyInput | PageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Page createManyAndReturn
   */
  export type PageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Page
     */
    select?: PageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Pages.
     */
    data: PageCreateManyInput | PageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Page update
   */
  export type PageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Page
     */
    select?: PageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PageInclude<ExtArgs> | null
    /**
     * The data needed to update a Page.
     */
    data: XOR<PageUpdateInput, PageUncheckedUpdateInput>
    /**
     * Choose, which Page to update.
     */
    where: PageWhereUniqueInput
  }

  /**
   * Page updateMany
   */
  export type PageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Pages.
     */
    data: XOR<PageUpdateManyMutationInput, PageUncheckedUpdateManyInput>
    /**
     * Filter which Pages to update
     */
    where?: PageWhereInput
  }

  /**
   * Page upsert
   */
  export type PageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Page
     */
    select?: PageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PageInclude<ExtArgs> | null
    /**
     * The filter to search for the Page to update in case it exists.
     */
    where: PageWhereUniqueInput
    /**
     * In case the Page found by the `where` argument doesn't exist, create a new Page with this data.
     */
    create: XOR<PageCreateInput, PageUncheckedCreateInput>
    /**
     * In case the Page was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PageUpdateInput, PageUncheckedUpdateInput>
  }

  /**
   * Page delete
   */
  export type PageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Page
     */
    select?: PageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PageInclude<ExtArgs> | null
    /**
     * Filter which Page to delete.
     */
    where: PageWhereUniqueInput
  }

  /**
   * Page deleteMany
   */
  export type PageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Pages to delete
     */
    where?: PageWhereInput
  }

  /**
   * Page without action
   */
  export type PageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Page
     */
    select?: PageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PageInclude<ExtArgs> | null
  }


  /**
   * Model TemplateCategory
   */

  export type AggregateTemplateCategory = {
    _count: TemplateCategoryCountAggregateOutputType | null
    _avg: TemplateCategoryAvgAggregateOutputType | null
    _sum: TemplateCategorySumAggregateOutputType | null
    _min: TemplateCategoryMinAggregateOutputType | null
    _max: TemplateCategoryMaxAggregateOutputType | null
  }

  export type TemplateCategoryAvgAggregateOutputType = {
    id: number | null
    order: number | null
  }

  export type TemplateCategorySumAggregateOutputType = {
    id: number | null
    order: number | null
  }

  export type TemplateCategoryMinAggregateOutputType = {
    id: number | null
    name: string | null
    slug: string | null
    description: string | null
    icon: string | null
    order: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TemplateCategoryMaxAggregateOutputType = {
    id: number | null
    name: string | null
    slug: string | null
    description: string | null
    icon: string | null
    order: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TemplateCategoryCountAggregateOutputType = {
    id: number
    name: number
    slug: number
    description: number
    icon: number
    order: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TemplateCategoryAvgAggregateInputType = {
    id?: true
    order?: true
  }

  export type TemplateCategorySumAggregateInputType = {
    id?: true
    order?: true
  }

  export type TemplateCategoryMinAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    icon?: true
    order?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TemplateCategoryMaxAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    icon?: true
    order?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TemplateCategoryCountAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    icon?: true
    order?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TemplateCategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TemplateCategory to aggregate.
     */
    where?: TemplateCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplateCategories to fetch.
     */
    orderBy?: TemplateCategoryOrderByWithRelationInput | TemplateCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TemplateCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplateCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplateCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TemplateCategories
    **/
    _count?: true | TemplateCategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TemplateCategoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TemplateCategorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TemplateCategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TemplateCategoryMaxAggregateInputType
  }

  export type GetTemplateCategoryAggregateType<T extends TemplateCategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateTemplateCategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTemplateCategory[P]>
      : GetScalarType<T[P], AggregateTemplateCategory[P]>
  }




  export type TemplateCategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TemplateCategoryWhereInput
    orderBy?: TemplateCategoryOrderByWithAggregationInput | TemplateCategoryOrderByWithAggregationInput[]
    by: TemplateCategoryScalarFieldEnum[] | TemplateCategoryScalarFieldEnum
    having?: TemplateCategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TemplateCategoryCountAggregateInputType | true
    _avg?: TemplateCategoryAvgAggregateInputType
    _sum?: TemplateCategorySumAggregateInputType
    _min?: TemplateCategoryMinAggregateInputType
    _max?: TemplateCategoryMaxAggregateInputType
  }

  export type TemplateCategoryGroupByOutputType = {
    id: number
    name: string
    slug: string
    description: string | null
    icon: string | null
    order: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: TemplateCategoryCountAggregateOutputType | null
    _avg: TemplateCategoryAvgAggregateOutputType | null
    _sum: TemplateCategorySumAggregateOutputType | null
    _min: TemplateCategoryMinAggregateOutputType | null
    _max: TemplateCategoryMaxAggregateOutputType | null
  }

  type GetTemplateCategoryGroupByPayload<T extends TemplateCategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TemplateCategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TemplateCategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TemplateCategoryGroupByOutputType[P]>
            : GetScalarType<T[P], TemplateCategoryGroupByOutputType[P]>
        }
      >
    >


  export type TemplateCategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    icon?: boolean
    order?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    templates?: boolean | TemplateCategory$templatesArgs<ExtArgs>
    _count?: boolean | TemplateCategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["templateCategory"]>

  export type TemplateCategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    icon?: boolean
    order?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["templateCategory"]>

  export type TemplateCategorySelectScalar = {
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    icon?: boolean
    order?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TemplateCategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    templates?: boolean | TemplateCategory$templatesArgs<ExtArgs>
    _count?: boolean | TemplateCategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TemplateCategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $TemplateCategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TemplateCategory"
    objects: {
      templates: Prisma.$TemplatePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      slug: string
      description: string | null
      icon: string | null
      order: number
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["templateCategory"]>
    composites: {}
  }

  type TemplateCategoryGetPayload<S extends boolean | null | undefined | TemplateCategoryDefaultArgs> = $Result.GetResult<Prisma.$TemplateCategoryPayload, S>

  type TemplateCategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TemplateCategoryFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TemplateCategoryCountAggregateInputType | true
    }

  export interface TemplateCategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TemplateCategory'], meta: { name: 'TemplateCategory' } }
    /**
     * Find zero or one TemplateCategory that matches the filter.
     * @param {TemplateCategoryFindUniqueArgs} args - Arguments to find a TemplateCategory
     * @example
     * // Get one TemplateCategory
     * const templateCategory = await prisma.templateCategory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TemplateCategoryFindUniqueArgs>(args: SelectSubset<T, TemplateCategoryFindUniqueArgs<ExtArgs>>): Prisma__TemplateCategoryClient<$Result.GetResult<Prisma.$TemplateCategoryPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TemplateCategory that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TemplateCategoryFindUniqueOrThrowArgs} args - Arguments to find a TemplateCategory
     * @example
     * // Get one TemplateCategory
     * const templateCategory = await prisma.templateCategory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TemplateCategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, TemplateCategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TemplateCategoryClient<$Result.GetResult<Prisma.$TemplateCategoryPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TemplateCategory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateCategoryFindFirstArgs} args - Arguments to find a TemplateCategory
     * @example
     * // Get one TemplateCategory
     * const templateCategory = await prisma.templateCategory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TemplateCategoryFindFirstArgs>(args?: SelectSubset<T, TemplateCategoryFindFirstArgs<ExtArgs>>): Prisma__TemplateCategoryClient<$Result.GetResult<Prisma.$TemplateCategoryPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TemplateCategory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateCategoryFindFirstOrThrowArgs} args - Arguments to find a TemplateCategory
     * @example
     * // Get one TemplateCategory
     * const templateCategory = await prisma.templateCategory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TemplateCategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, TemplateCategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__TemplateCategoryClient<$Result.GetResult<Prisma.$TemplateCategoryPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TemplateCategories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateCategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TemplateCategories
     * const templateCategories = await prisma.templateCategory.findMany()
     * 
     * // Get first 10 TemplateCategories
     * const templateCategories = await prisma.templateCategory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const templateCategoryWithIdOnly = await prisma.templateCategory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TemplateCategoryFindManyArgs>(args?: SelectSubset<T, TemplateCategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplateCategoryPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TemplateCategory.
     * @param {TemplateCategoryCreateArgs} args - Arguments to create a TemplateCategory.
     * @example
     * // Create one TemplateCategory
     * const TemplateCategory = await prisma.templateCategory.create({
     *   data: {
     *     // ... data to create a TemplateCategory
     *   }
     * })
     * 
     */
    create<T extends TemplateCategoryCreateArgs>(args: SelectSubset<T, TemplateCategoryCreateArgs<ExtArgs>>): Prisma__TemplateCategoryClient<$Result.GetResult<Prisma.$TemplateCategoryPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TemplateCategories.
     * @param {TemplateCategoryCreateManyArgs} args - Arguments to create many TemplateCategories.
     * @example
     * // Create many TemplateCategories
     * const templateCategory = await prisma.templateCategory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TemplateCategoryCreateManyArgs>(args?: SelectSubset<T, TemplateCategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TemplateCategories and returns the data saved in the database.
     * @param {TemplateCategoryCreateManyAndReturnArgs} args - Arguments to create many TemplateCategories.
     * @example
     * // Create many TemplateCategories
     * const templateCategory = await prisma.templateCategory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TemplateCategories and only return the `id`
     * const templateCategoryWithIdOnly = await prisma.templateCategory.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TemplateCategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, TemplateCategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplateCategoryPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TemplateCategory.
     * @param {TemplateCategoryDeleteArgs} args - Arguments to delete one TemplateCategory.
     * @example
     * // Delete one TemplateCategory
     * const TemplateCategory = await prisma.templateCategory.delete({
     *   where: {
     *     // ... filter to delete one TemplateCategory
     *   }
     * })
     * 
     */
    delete<T extends TemplateCategoryDeleteArgs>(args: SelectSubset<T, TemplateCategoryDeleteArgs<ExtArgs>>): Prisma__TemplateCategoryClient<$Result.GetResult<Prisma.$TemplateCategoryPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TemplateCategory.
     * @param {TemplateCategoryUpdateArgs} args - Arguments to update one TemplateCategory.
     * @example
     * // Update one TemplateCategory
     * const templateCategory = await prisma.templateCategory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TemplateCategoryUpdateArgs>(args: SelectSubset<T, TemplateCategoryUpdateArgs<ExtArgs>>): Prisma__TemplateCategoryClient<$Result.GetResult<Prisma.$TemplateCategoryPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TemplateCategories.
     * @param {TemplateCategoryDeleteManyArgs} args - Arguments to filter TemplateCategories to delete.
     * @example
     * // Delete a few TemplateCategories
     * const { count } = await prisma.templateCategory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TemplateCategoryDeleteManyArgs>(args?: SelectSubset<T, TemplateCategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TemplateCategories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateCategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TemplateCategories
     * const templateCategory = await prisma.templateCategory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TemplateCategoryUpdateManyArgs>(args: SelectSubset<T, TemplateCategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TemplateCategory.
     * @param {TemplateCategoryUpsertArgs} args - Arguments to update or create a TemplateCategory.
     * @example
     * // Update or create a TemplateCategory
     * const templateCategory = await prisma.templateCategory.upsert({
     *   create: {
     *     // ... data to create a TemplateCategory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TemplateCategory we want to update
     *   }
     * })
     */
    upsert<T extends TemplateCategoryUpsertArgs>(args: SelectSubset<T, TemplateCategoryUpsertArgs<ExtArgs>>): Prisma__TemplateCategoryClient<$Result.GetResult<Prisma.$TemplateCategoryPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TemplateCategories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateCategoryCountArgs} args - Arguments to filter TemplateCategories to count.
     * @example
     * // Count the number of TemplateCategories
     * const count = await prisma.templateCategory.count({
     *   where: {
     *     // ... the filter for the TemplateCategories we want to count
     *   }
     * })
    **/
    count<T extends TemplateCategoryCountArgs>(
      args?: Subset<T, TemplateCategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TemplateCategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TemplateCategory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateCategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TemplateCategoryAggregateArgs>(args: Subset<T, TemplateCategoryAggregateArgs>): Prisma.PrismaPromise<GetTemplateCategoryAggregateType<T>>

    /**
     * Group by TemplateCategory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateCategoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TemplateCategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TemplateCategoryGroupByArgs['orderBy'] }
        : { orderBy?: TemplateCategoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TemplateCategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTemplateCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TemplateCategory model
   */
  readonly fields: TemplateCategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TemplateCategory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TemplateCategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    templates<T extends TemplateCategory$templatesArgs<ExtArgs> = {}>(args?: Subset<T, TemplateCategory$templatesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TemplateCategory model
   */ 
  interface TemplateCategoryFieldRefs {
    readonly id: FieldRef<"TemplateCategory", 'Int'>
    readonly name: FieldRef<"TemplateCategory", 'String'>
    readonly slug: FieldRef<"TemplateCategory", 'String'>
    readonly description: FieldRef<"TemplateCategory", 'String'>
    readonly icon: FieldRef<"TemplateCategory", 'String'>
    readonly order: FieldRef<"TemplateCategory", 'Int'>
    readonly isActive: FieldRef<"TemplateCategory", 'Boolean'>
    readonly createdAt: FieldRef<"TemplateCategory", 'DateTime'>
    readonly updatedAt: FieldRef<"TemplateCategory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TemplateCategory findUnique
   */
  export type TemplateCategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCategory
     */
    select?: TemplateCategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateCategoryInclude<ExtArgs> | null
    /**
     * Filter, which TemplateCategory to fetch.
     */
    where: TemplateCategoryWhereUniqueInput
  }

  /**
   * TemplateCategory findUniqueOrThrow
   */
  export type TemplateCategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCategory
     */
    select?: TemplateCategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateCategoryInclude<ExtArgs> | null
    /**
     * Filter, which TemplateCategory to fetch.
     */
    where: TemplateCategoryWhereUniqueInput
  }

  /**
   * TemplateCategory findFirst
   */
  export type TemplateCategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCategory
     */
    select?: TemplateCategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateCategoryInclude<ExtArgs> | null
    /**
     * Filter, which TemplateCategory to fetch.
     */
    where?: TemplateCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplateCategories to fetch.
     */
    orderBy?: TemplateCategoryOrderByWithRelationInput | TemplateCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TemplateCategories.
     */
    cursor?: TemplateCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplateCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplateCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TemplateCategories.
     */
    distinct?: TemplateCategoryScalarFieldEnum | TemplateCategoryScalarFieldEnum[]
  }

  /**
   * TemplateCategory findFirstOrThrow
   */
  export type TemplateCategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCategory
     */
    select?: TemplateCategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateCategoryInclude<ExtArgs> | null
    /**
     * Filter, which TemplateCategory to fetch.
     */
    where?: TemplateCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplateCategories to fetch.
     */
    orderBy?: TemplateCategoryOrderByWithRelationInput | TemplateCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TemplateCategories.
     */
    cursor?: TemplateCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplateCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplateCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TemplateCategories.
     */
    distinct?: TemplateCategoryScalarFieldEnum | TemplateCategoryScalarFieldEnum[]
  }

  /**
   * TemplateCategory findMany
   */
  export type TemplateCategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCategory
     */
    select?: TemplateCategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateCategoryInclude<ExtArgs> | null
    /**
     * Filter, which TemplateCategories to fetch.
     */
    where?: TemplateCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplateCategories to fetch.
     */
    orderBy?: TemplateCategoryOrderByWithRelationInput | TemplateCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TemplateCategories.
     */
    cursor?: TemplateCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplateCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplateCategories.
     */
    skip?: number
    distinct?: TemplateCategoryScalarFieldEnum | TemplateCategoryScalarFieldEnum[]
  }

  /**
   * TemplateCategory create
   */
  export type TemplateCategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCategory
     */
    select?: TemplateCategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateCategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a TemplateCategory.
     */
    data: XOR<TemplateCategoryCreateInput, TemplateCategoryUncheckedCreateInput>
  }

  /**
   * TemplateCategory createMany
   */
  export type TemplateCategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TemplateCategories.
     */
    data: TemplateCategoryCreateManyInput | TemplateCategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TemplateCategory createManyAndReturn
   */
  export type TemplateCategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCategory
     */
    select?: TemplateCategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TemplateCategories.
     */
    data: TemplateCategoryCreateManyInput | TemplateCategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TemplateCategory update
   */
  export type TemplateCategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCategory
     */
    select?: TemplateCategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateCategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a TemplateCategory.
     */
    data: XOR<TemplateCategoryUpdateInput, TemplateCategoryUncheckedUpdateInput>
    /**
     * Choose, which TemplateCategory to update.
     */
    where: TemplateCategoryWhereUniqueInput
  }

  /**
   * TemplateCategory updateMany
   */
  export type TemplateCategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TemplateCategories.
     */
    data: XOR<TemplateCategoryUpdateManyMutationInput, TemplateCategoryUncheckedUpdateManyInput>
    /**
     * Filter which TemplateCategories to update
     */
    where?: TemplateCategoryWhereInput
  }

  /**
   * TemplateCategory upsert
   */
  export type TemplateCategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCategory
     */
    select?: TemplateCategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateCategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the TemplateCategory to update in case it exists.
     */
    where: TemplateCategoryWhereUniqueInput
    /**
     * In case the TemplateCategory found by the `where` argument doesn't exist, create a new TemplateCategory with this data.
     */
    create: XOR<TemplateCategoryCreateInput, TemplateCategoryUncheckedCreateInput>
    /**
     * In case the TemplateCategory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TemplateCategoryUpdateInput, TemplateCategoryUncheckedUpdateInput>
  }

  /**
   * TemplateCategory delete
   */
  export type TemplateCategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCategory
     */
    select?: TemplateCategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateCategoryInclude<ExtArgs> | null
    /**
     * Filter which TemplateCategory to delete.
     */
    where: TemplateCategoryWhereUniqueInput
  }

  /**
   * TemplateCategory deleteMany
   */
  export type TemplateCategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TemplateCategories to delete
     */
    where?: TemplateCategoryWhereInput
  }

  /**
   * TemplateCategory.templates
   */
  export type TemplateCategory$templatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
    where?: TemplateWhereInput
    orderBy?: TemplateOrderByWithRelationInput | TemplateOrderByWithRelationInput[]
    cursor?: TemplateWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TemplateScalarFieldEnum | TemplateScalarFieldEnum[]
  }

  /**
   * TemplateCategory without action
   */
  export type TemplateCategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateCategory
     */
    select?: TemplateCategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateCategoryInclude<ExtArgs> | null
  }


  /**
   * Model Template
   */

  export type AggregateTemplate = {
    _count: TemplateCountAggregateOutputType | null
    _avg: TemplateAvgAggregateOutputType | null
    _sum: TemplateSumAggregateOutputType | null
    _min: TemplateMinAggregateOutputType | null
    _max: TemplateMaxAggregateOutputType | null
  }

  export type TemplateAvgAggregateOutputType = {
    id: number | null
    categoryId: number | null
    usageCount: number | null
    createdByUserId: number | null
  }

  export type TemplateSumAggregateOutputType = {
    id: number | null
    categoryId: number | null
    usageCount: number | null
    createdByUserId: number | null
  }

  export type TemplateMinAggregateOutputType = {
    id: number | null
    name: string | null
    slug: string | null
    description: string | null
    categoryId: number | null
    thumbnailImage: string | null
    usageCount: number | null
    isActive: boolean | null
    isPublic: boolean | null
    createdByUserId: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TemplateMaxAggregateOutputType = {
    id: number | null
    name: string | null
    slug: string | null
    description: string | null
    categoryId: number | null
    thumbnailImage: string | null
    usageCount: number | null
    isActive: boolean | null
    isPublic: boolean | null
    createdByUserId: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TemplateCountAggregateOutputType = {
    id: number
    name: number
    slug: number
    description: number
    categoryId: number
    thumbnailImage: number
    tags: number
    usageCount: number
    isActive: number
    isPublic: number
    createdByUserId: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TemplateAvgAggregateInputType = {
    id?: true
    categoryId?: true
    usageCount?: true
    createdByUserId?: true
  }

  export type TemplateSumAggregateInputType = {
    id?: true
    categoryId?: true
    usageCount?: true
    createdByUserId?: true
  }

  export type TemplateMinAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    categoryId?: true
    thumbnailImage?: true
    usageCount?: true
    isActive?: true
    isPublic?: true
    createdByUserId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TemplateMaxAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    categoryId?: true
    thumbnailImage?: true
    usageCount?: true
    isActive?: true
    isPublic?: true
    createdByUserId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TemplateCountAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    categoryId?: true
    thumbnailImage?: true
    tags?: true
    usageCount?: true
    isActive?: true
    isPublic?: true
    createdByUserId?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TemplateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Template to aggregate.
     */
    where?: TemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Templates to fetch.
     */
    orderBy?: TemplateOrderByWithRelationInput | TemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Templates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Templates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Templates
    **/
    _count?: true | TemplateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TemplateAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TemplateSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TemplateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TemplateMaxAggregateInputType
  }

  export type GetTemplateAggregateType<T extends TemplateAggregateArgs> = {
        [P in keyof T & keyof AggregateTemplate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTemplate[P]>
      : GetScalarType<T[P], AggregateTemplate[P]>
  }




  export type TemplateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TemplateWhereInput
    orderBy?: TemplateOrderByWithAggregationInput | TemplateOrderByWithAggregationInput[]
    by: TemplateScalarFieldEnum[] | TemplateScalarFieldEnum
    having?: TemplateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TemplateCountAggregateInputType | true
    _avg?: TemplateAvgAggregateInputType
    _sum?: TemplateSumAggregateInputType
    _min?: TemplateMinAggregateInputType
    _max?: TemplateMaxAggregateInputType
  }

  export type TemplateGroupByOutputType = {
    id: number
    name: string
    slug: string
    description: string | null
    categoryId: number
    thumbnailImage: string | null
    tags: string[]
    usageCount: number
    isActive: boolean
    isPublic: boolean
    createdByUserId: number
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: TemplateCountAggregateOutputType | null
    _avg: TemplateAvgAggregateOutputType | null
    _sum: TemplateSumAggregateOutputType | null
    _min: TemplateMinAggregateOutputType | null
    _max: TemplateMaxAggregateOutputType | null
  }

  type GetTemplateGroupByPayload<T extends TemplateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TemplateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TemplateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TemplateGroupByOutputType[P]>
            : GetScalarType<T[P], TemplateGroupByOutputType[P]>
        }
      >
    >


  export type TemplateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    categoryId?: boolean
    thumbnailImage?: boolean
    tags?: boolean
    usageCount?: boolean
    isActive?: boolean
    isPublic?: boolean
    createdByUserId?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    category?: boolean | TemplateCategoryDefaultArgs<ExtArgs>
    previewImages?: boolean | Template$previewImagesArgs<ExtArgs>
    pages?: boolean | Template$pagesArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
    funnelsCreated?: boolean | Template$funnelsCreatedArgs<ExtArgs>
    _count?: boolean | TemplateCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["template"]>

  export type TemplateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    categoryId?: boolean
    thumbnailImage?: boolean
    tags?: boolean
    usageCount?: boolean
    isActive?: boolean
    isPublic?: boolean
    createdByUserId?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    category?: boolean | TemplateCategoryDefaultArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["template"]>

  export type TemplateSelectScalar = {
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    categoryId?: boolean
    thumbnailImage?: boolean
    tags?: boolean
    usageCount?: boolean
    isActive?: boolean
    isPublic?: boolean
    createdByUserId?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TemplateInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | TemplateCategoryDefaultArgs<ExtArgs>
    previewImages?: boolean | Template$previewImagesArgs<ExtArgs>
    pages?: boolean | Template$pagesArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
    funnelsCreated?: boolean | Template$funnelsCreatedArgs<ExtArgs>
    _count?: boolean | TemplateCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TemplateIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | TemplateCategoryDefaultArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $TemplatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Template"
    objects: {
      category: Prisma.$TemplateCategoryPayload<ExtArgs>
      previewImages: Prisma.$TemplateImagePayload<ExtArgs>[]
      pages: Prisma.$TemplatePagesPayload<ExtArgs>[]
      createdBy: Prisma.$UserPayload<ExtArgs>
      funnelsCreated: Prisma.$FunnelPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      slug: string
      description: string | null
      categoryId: number
      thumbnailImage: string | null
      tags: string[]
      usageCount: number
      isActive: boolean
      isPublic: boolean
      createdByUserId: number
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["template"]>
    composites: {}
  }

  type TemplateGetPayload<S extends boolean | null | undefined | TemplateDefaultArgs> = $Result.GetResult<Prisma.$TemplatePayload, S>

  type TemplateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TemplateFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TemplateCountAggregateInputType | true
    }

  export interface TemplateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Template'], meta: { name: 'Template' } }
    /**
     * Find zero or one Template that matches the filter.
     * @param {TemplateFindUniqueArgs} args - Arguments to find a Template
     * @example
     * // Get one Template
     * const template = await prisma.template.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TemplateFindUniqueArgs>(args: SelectSubset<T, TemplateFindUniqueArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Template that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TemplateFindUniqueOrThrowArgs} args - Arguments to find a Template
     * @example
     * // Get one Template
     * const template = await prisma.template.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TemplateFindUniqueOrThrowArgs>(args: SelectSubset<T, TemplateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Template that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFindFirstArgs} args - Arguments to find a Template
     * @example
     * // Get one Template
     * const template = await prisma.template.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TemplateFindFirstArgs>(args?: SelectSubset<T, TemplateFindFirstArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Template that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFindFirstOrThrowArgs} args - Arguments to find a Template
     * @example
     * // Get one Template
     * const template = await prisma.template.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TemplateFindFirstOrThrowArgs>(args?: SelectSubset<T, TemplateFindFirstOrThrowArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Templates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Templates
     * const templates = await prisma.template.findMany()
     * 
     * // Get first 10 Templates
     * const templates = await prisma.template.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const templateWithIdOnly = await prisma.template.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TemplateFindManyArgs>(args?: SelectSubset<T, TemplateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Template.
     * @param {TemplateCreateArgs} args - Arguments to create a Template.
     * @example
     * // Create one Template
     * const Template = await prisma.template.create({
     *   data: {
     *     // ... data to create a Template
     *   }
     * })
     * 
     */
    create<T extends TemplateCreateArgs>(args: SelectSubset<T, TemplateCreateArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Templates.
     * @param {TemplateCreateManyArgs} args - Arguments to create many Templates.
     * @example
     * // Create many Templates
     * const template = await prisma.template.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TemplateCreateManyArgs>(args?: SelectSubset<T, TemplateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Templates and returns the data saved in the database.
     * @param {TemplateCreateManyAndReturnArgs} args - Arguments to create many Templates.
     * @example
     * // Create many Templates
     * const template = await prisma.template.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Templates and only return the `id`
     * const templateWithIdOnly = await prisma.template.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TemplateCreateManyAndReturnArgs>(args?: SelectSubset<T, TemplateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Template.
     * @param {TemplateDeleteArgs} args - Arguments to delete one Template.
     * @example
     * // Delete one Template
     * const Template = await prisma.template.delete({
     *   where: {
     *     // ... filter to delete one Template
     *   }
     * })
     * 
     */
    delete<T extends TemplateDeleteArgs>(args: SelectSubset<T, TemplateDeleteArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Template.
     * @param {TemplateUpdateArgs} args - Arguments to update one Template.
     * @example
     * // Update one Template
     * const template = await prisma.template.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TemplateUpdateArgs>(args: SelectSubset<T, TemplateUpdateArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Templates.
     * @param {TemplateDeleteManyArgs} args - Arguments to filter Templates to delete.
     * @example
     * // Delete a few Templates
     * const { count } = await prisma.template.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TemplateDeleteManyArgs>(args?: SelectSubset<T, TemplateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Templates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Templates
     * const template = await prisma.template.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TemplateUpdateManyArgs>(args: SelectSubset<T, TemplateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Template.
     * @param {TemplateUpsertArgs} args - Arguments to update or create a Template.
     * @example
     * // Update or create a Template
     * const template = await prisma.template.upsert({
     *   create: {
     *     // ... data to create a Template
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Template we want to update
     *   }
     * })
     */
    upsert<T extends TemplateUpsertArgs>(args: SelectSubset<T, TemplateUpsertArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Templates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateCountArgs} args - Arguments to filter Templates to count.
     * @example
     * // Count the number of Templates
     * const count = await prisma.template.count({
     *   where: {
     *     // ... the filter for the Templates we want to count
     *   }
     * })
    **/
    count<T extends TemplateCountArgs>(
      args?: Subset<T, TemplateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TemplateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Template.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TemplateAggregateArgs>(args: Subset<T, TemplateAggregateArgs>): Prisma.PrismaPromise<GetTemplateAggregateType<T>>

    /**
     * Group by Template.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TemplateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TemplateGroupByArgs['orderBy'] }
        : { orderBy?: TemplateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TemplateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTemplateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Template model
   */
  readonly fields: TemplateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Template.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TemplateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    category<T extends TemplateCategoryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TemplateCategoryDefaultArgs<ExtArgs>>): Prisma__TemplateCategoryClient<$Result.GetResult<Prisma.$TemplateCategoryPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    previewImages<T extends Template$previewImagesArgs<ExtArgs> = {}>(args?: Subset<T, Template$previewImagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplateImagePayload<ExtArgs>, T, "findMany"> | Null>
    pages<T extends Template$pagesArgs<ExtArgs> = {}>(args?: Subset<T, Template$pagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplatePagesPayload<ExtArgs>, T, "findMany"> | Null>
    createdBy<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    funnelsCreated<T extends Template$funnelsCreatedArgs<ExtArgs> = {}>(args?: Subset<T, Template$funnelsCreatedArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FunnelPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Template model
   */ 
  interface TemplateFieldRefs {
    readonly id: FieldRef<"Template", 'Int'>
    readonly name: FieldRef<"Template", 'String'>
    readonly slug: FieldRef<"Template", 'String'>
    readonly description: FieldRef<"Template", 'String'>
    readonly categoryId: FieldRef<"Template", 'Int'>
    readonly thumbnailImage: FieldRef<"Template", 'String'>
    readonly tags: FieldRef<"Template", 'String[]'>
    readonly usageCount: FieldRef<"Template", 'Int'>
    readonly isActive: FieldRef<"Template", 'Boolean'>
    readonly isPublic: FieldRef<"Template", 'Boolean'>
    readonly createdByUserId: FieldRef<"Template", 'Int'>
    readonly metadata: FieldRef<"Template", 'Json'>
    readonly createdAt: FieldRef<"Template", 'DateTime'>
    readonly updatedAt: FieldRef<"Template", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Template findUnique
   */
  export type TemplateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
    /**
     * Filter, which Template to fetch.
     */
    where: TemplateWhereUniqueInput
  }

  /**
   * Template findUniqueOrThrow
   */
  export type TemplateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
    /**
     * Filter, which Template to fetch.
     */
    where: TemplateWhereUniqueInput
  }

  /**
   * Template findFirst
   */
  export type TemplateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
    /**
     * Filter, which Template to fetch.
     */
    where?: TemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Templates to fetch.
     */
    orderBy?: TemplateOrderByWithRelationInput | TemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Templates.
     */
    cursor?: TemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Templates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Templates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Templates.
     */
    distinct?: TemplateScalarFieldEnum | TemplateScalarFieldEnum[]
  }

  /**
   * Template findFirstOrThrow
   */
  export type TemplateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
    /**
     * Filter, which Template to fetch.
     */
    where?: TemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Templates to fetch.
     */
    orderBy?: TemplateOrderByWithRelationInput | TemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Templates.
     */
    cursor?: TemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Templates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Templates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Templates.
     */
    distinct?: TemplateScalarFieldEnum | TemplateScalarFieldEnum[]
  }

  /**
   * Template findMany
   */
  export type TemplateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
    /**
     * Filter, which Templates to fetch.
     */
    where?: TemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Templates to fetch.
     */
    orderBy?: TemplateOrderByWithRelationInput | TemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Templates.
     */
    cursor?: TemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Templates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Templates.
     */
    skip?: number
    distinct?: TemplateScalarFieldEnum | TemplateScalarFieldEnum[]
  }

  /**
   * Template create
   */
  export type TemplateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
    /**
     * The data needed to create a Template.
     */
    data: XOR<TemplateCreateInput, TemplateUncheckedCreateInput>
  }

  /**
   * Template createMany
   */
  export type TemplateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Templates.
     */
    data: TemplateCreateManyInput | TemplateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Template createManyAndReturn
   */
  export type TemplateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Templates.
     */
    data: TemplateCreateManyInput | TemplateCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Template update
   */
  export type TemplateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
    /**
     * The data needed to update a Template.
     */
    data: XOR<TemplateUpdateInput, TemplateUncheckedUpdateInput>
    /**
     * Choose, which Template to update.
     */
    where: TemplateWhereUniqueInput
  }

  /**
   * Template updateMany
   */
  export type TemplateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Templates.
     */
    data: XOR<TemplateUpdateManyMutationInput, TemplateUncheckedUpdateManyInput>
    /**
     * Filter which Templates to update
     */
    where?: TemplateWhereInput
  }

  /**
   * Template upsert
   */
  export type TemplateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
    /**
     * The filter to search for the Template to update in case it exists.
     */
    where: TemplateWhereUniqueInput
    /**
     * In case the Template found by the `where` argument doesn't exist, create a new Template with this data.
     */
    create: XOR<TemplateCreateInput, TemplateUncheckedCreateInput>
    /**
     * In case the Template was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TemplateUpdateInput, TemplateUncheckedUpdateInput>
  }

  /**
   * Template delete
   */
  export type TemplateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
    /**
     * Filter which Template to delete.
     */
    where: TemplateWhereUniqueInput
  }

  /**
   * Template deleteMany
   */
  export type TemplateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Templates to delete
     */
    where?: TemplateWhereInput
  }

  /**
   * Template.previewImages
   */
  export type Template$previewImagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateImage
     */
    select?: TemplateImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateImageInclude<ExtArgs> | null
    where?: TemplateImageWhereInput
    orderBy?: TemplateImageOrderByWithRelationInput | TemplateImageOrderByWithRelationInput[]
    cursor?: TemplateImageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TemplateImageScalarFieldEnum | TemplateImageScalarFieldEnum[]
  }

  /**
   * Template.pages
   */
  export type Template$pagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplatePages
     */
    select?: TemplatePagesSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplatePagesInclude<ExtArgs> | null
    where?: TemplatePagesWhereInput
    orderBy?: TemplatePagesOrderByWithRelationInput | TemplatePagesOrderByWithRelationInput[]
    cursor?: TemplatePagesWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TemplatePagesScalarFieldEnum | TemplatePagesScalarFieldEnum[]
  }

  /**
   * Template.funnelsCreated
   */
  export type Template$funnelsCreatedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Funnel
     */
    select?: FunnelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FunnelInclude<ExtArgs> | null
    where?: FunnelWhereInput
    orderBy?: FunnelOrderByWithRelationInput | FunnelOrderByWithRelationInput[]
    cursor?: FunnelWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FunnelScalarFieldEnum | FunnelScalarFieldEnum[]
  }

  /**
   * Template without action
   */
  export type TemplateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Template
     */
    select?: TemplateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateInclude<ExtArgs> | null
  }


  /**
   * Model TemplateImage
   */

  export type AggregateTemplateImage = {
    _count: TemplateImageCountAggregateOutputType | null
    _avg: TemplateImageAvgAggregateOutputType | null
    _sum: TemplateImageSumAggregateOutputType | null
    _min: TemplateImageMinAggregateOutputType | null
    _max: TemplateImageMaxAggregateOutputType | null
  }

  export type TemplateImageAvgAggregateOutputType = {
    id: number | null
    templateId: number | null
    order: number | null
  }

  export type TemplateImageSumAggregateOutputType = {
    id: number | null
    templateId: number | null
    order: number | null
  }

  export type TemplateImageMinAggregateOutputType = {
    id: number | null
    templateId: number | null
    imageUrl: string | null
    imageType: string | null
    order: number | null
    caption: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TemplateImageMaxAggregateOutputType = {
    id: number | null
    templateId: number | null
    imageUrl: string | null
    imageType: string | null
    order: number | null
    caption: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TemplateImageCountAggregateOutputType = {
    id: number
    templateId: number
    imageUrl: number
    imageType: number
    order: number
    caption: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TemplateImageAvgAggregateInputType = {
    id?: true
    templateId?: true
    order?: true
  }

  export type TemplateImageSumAggregateInputType = {
    id?: true
    templateId?: true
    order?: true
  }

  export type TemplateImageMinAggregateInputType = {
    id?: true
    templateId?: true
    imageUrl?: true
    imageType?: true
    order?: true
    caption?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TemplateImageMaxAggregateInputType = {
    id?: true
    templateId?: true
    imageUrl?: true
    imageType?: true
    order?: true
    caption?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TemplateImageCountAggregateInputType = {
    id?: true
    templateId?: true
    imageUrl?: true
    imageType?: true
    order?: true
    caption?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TemplateImageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TemplateImage to aggregate.
     */
    where?: TemplateImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplateImages to fetch.
     */
    orderBy?: TemplateImageOrderByWithRelationInput | TemplateImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TemplateImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplateImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplateImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TemplateImages
    **/
    _count?: true | TemplateImageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TemplateImageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TemplateImageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TemplateImageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TemplateImageMaxAggregateInputType
  }

  export type GetTemplateImageAggregateType<T extends TemplateImageAggregateArgs> = {
        [P in keyof T & keyof AggregateTemplateImage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTemplateImage[P]>
      : GetScalarType<T[P], AggregateTemplateImage[P]>
  }




  export type TemplateImageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TemplateImageWhereInput
    orderBy?: TemplateImageOrderByWithAggregationInput | TemplateImageOrderByWithAggregationInput[]
    by: TemplateImageScalarFieldEnum[] | TemplateImageScalarFieldEnum
    having?: TemplateImageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TemplateImageCountAggregateInputType | true
    _avg?: TemplateImageAvgAggregateInputType
    _sum?: TemplateImageSumAggregateInputType
    _min?: TemplateImageMinAggregateInputType
    _max?: TemplateImageMaxAggregateInputType
  }

  export type TemplateImageGroupByOutputType = {
    id: number
    templateId: number
    imageUrl: string
    imageType: string
    order: number
    caption: string | null
    createdAt: Date
    updatedAt: Date
    _count: TemplateImageCountAggregateOutputType | null
    _avg: TemplateImageAvgAggregateOutputType | null
    _sum: TemplateImageSumAggregateOutputType | null
    _min: TemplateImageMinAggregateOutputType | null
    _max: TemplateImageMaxAggregateOutputType | null
  }

  type GetTemplateImageGroupByPayload<T extends TemplateImageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TemplateImageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TemplateImageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TemplateImageGroupByOutputType[P]>
            : GetScalarType<T[P], TemplateImageGroupByOutputType[P]>
        }
      >
    >


  export type TemplateImageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    templateId?: boolean
    imageUrl?: boolean
    imageType?: boolean
    order?: boolean
    caption?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    template?: boolean | TemplateDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["templateImage"]>

  export type TemplateImageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    templateId?: boolean
    imageUrl?: boolean
    imageType?: boolean
    order?: boolean
    caption?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    template?: boolean | TemplateDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["templateImage"]>

  export type TemplateImageSelectScalar = {
    id?: boolean
    templateId?: boolean
    imageUrl?: boolean
    imageType?: boolean
    order?: boolean
    caption?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TemplateImageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    template?: boolean | TemplateDefaultArgs<ExtArgs>
  }
  export type TemplateImageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    template?: boolean | TemplateDefaultArgs<ExtArgs>
  }

  export type $TemplateImagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TemplateImage"
    objects: {
      template: Prisma.$TemplatePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      templateId: number
      imageUrl: string
      imageType: string
      order: number
      caption: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["templateImage"]>
    composites: {}
  }

  type TemplateImageGetPayload<S extends boolean | null | undefined | TemplateImageDefaultArgs> = $Result.GetResult<Prisma.$TemplateImagePayload, S>

  type TemplateImageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TemplateImageFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TemplateImageCountAggregateInputType | true
    }

  export interface TemplateImageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TemplateImage'], meta: { name: 'TemplateImage' } }
    /**
     * Find zero or one TemplateImage that matches the filter.
     * @param {TemplateImageFindUniqueArgs} args - Arguments to find a TemplateImage
     * @example
     * // Get one TemplateImage
     * const templateImage = await prisma.templateImage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TemplateImageFindUniqueArgs>(args: SelectSubset<T, TemplateImageFindUniqueArgs<ExtArgs>>): Prisma__TemplateImageClient<$Result.GetResult<Prisma.$TemplateImagePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TemplateImage that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TemplateImageFindUniqueOrThrowArgs} args - Arguments to find a TemplateImage
     * @example
     * // Get one TemplateImage
     * const templateImage = await prisma.templateImage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TemplateImageFindUniqueOrThrowArgs>(args: SelectSubset<T, TemplateImageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TemplateImageClient<$Result.GetResult<Prisma.$TemplateImagePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TemplateImage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateImageFindFirstArgs} args - Arguments to find a TemplateImage
     * @example
     * // Get one TemplateImage
     * const templateImage = await prisma.templateImage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TemplateImageFindFirstArgs>(args?: SelectSubset<T, TemplateImageFindFirstArgs<ExtArgs>>): Prisma__TemplateImageClient<$Result.GetResult<Prisma.$TemplateImagePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TemplateImage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateImageFindFirstOrThrowArgs} args - Arguments to find a TemplateImage
     * @example
     * // Get one TemplateImage
     * const templateImage = await prisma.templateImage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TemplateImageFindFirstOrThrowArgs>(args?: SelectSubset<T, TemplateImageFindFirstOrThrowArgs<ExtArgs>>): Prisma__TemplateImageClient<$Result.GetResult<Prisma.$TemplateImagePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TemplateImages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateImageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TemplateImages
     * const templateImages = await prisma.templateImage.findMany()
     * 
     * // Get first 10 TemplateImages
     * const templateImages = await prisma.templateImage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const templateImageWithIdOnly = await prisma.templateImage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TemplateImageFindManyArgs>(args?: SelectSubset<T, TemplateImageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplateImagePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TemplateImage.
     * @param {TemplateImageCreateArgs} args - Arguments to create a TemplateImage.
     * @example
     * // Create one TemplateImage
     * const TemplateImage = await prisma.templateImage.create({
     *   data: {
     *     // ... data to create a TemplateImage
     *   }
     * })
     * 
     */
    create<T extends TemplateImageCreateArgs>(args: SelectSubset<T, TemplateImageCreateArgs<ExtArgs>>): Prisma__TemplateImageClient<$Result.GetResult<Prisma.$TemplateImagePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TemplateImages.
     * @param {TemplateImageCreateManyArgs} args - Arguments to create many TemplateImages.
     * @example
     * // Create many TemplateImages
     * const templateImage = await prisma.templateImage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TemplateImageCreateManyArgs>(args?: SelectSubset<T, TemplateImageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TemplateImages and returns the data saved in the database.
     * @param {TemplateImageCreateManyAndReturnArgs} args - Arguments to create many TemplateImages.
     * @example
     * // Create many TemplateImages
     * const templateImage = await prisma.templateImage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TemplateImages and only return the `id`
     * const templateImageWithIdOnly = await prisma.templateImage.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TemplateImageCreateManyAndReturnArgs>(args?: SelectSubset<T, TemplateImageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplateImagePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TemplateImage.
     * @param {TemplateImageDeleteArgs} args - Arguments to delete one TemplateImage.
     * @example
     * // Delete one TemplateImage
     * const TemplateImage = await prisma.templateImage.delete({
     *   where: {
     *     // ... filter to delete one TemplateImage
     *   }
     * })
     * 
     */
    delete<T extends TemplateImageDeleteArgs>(args: SelectSubset<T, TemplateImageDeleteArgs<ExtArgs>>): Prisma__TemplateImageClient<$Result.GetResult<Prisma.$TemplateImagePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TemplateImage.
     * @param {TemplateImageUpdateArgs} args - Arguments to update one TemplateImage.
     * @example
     * // Update one TemplateImage
     * const templateImage = await prisma.templateImage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TemplateImageUpdateArgs>(args: SelectSubset<T, TemplateImageUpdateArgs<ExtArgs>>): Prisma__TemplateImageClient<$Result.GetResult<Prisma.$TemplateImagePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TemplateImages.
     * @param {TemplateImageDeleteManyArgs} args - Arguments to filter TemplateImages to delete.
     * @example
     * // Delete a few TemplateImages
     * const { count } = await prisma.templateImage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TemplateImageDeleteManyArgs>(args?: SelectSubset<T, TemplateImageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TemplateImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateImageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TemplateImages
     * const templateImage = await prisma.templateImage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TemplateImageUpdateManyArgs>(args: SelectSubset<T, TemplateImageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TemplateImage.
     * @param {TemplateImageUpsertArgs} args - Arguments to update or create a TemplateImage.
     * @example
     * // Update or create a TemplateImage
     * const templateImage = await prisma.templateImage.upsert({
     *   create: {
     *     // ... data to create a TemplateImage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TemplateImage we want to update
     *   }
     * })
     */
    upsert<T extends TemplateImageUpsertArgs>(args: SelectSubset<T, TemplateImageUpsertArgs<ExtArgs>>): Prisma__TemplateImageClient<$Result.GetResult<Prisma.$TemplateImagePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TemplateImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateImageCountArgs} args - Arguments to filter TemplateImages to count.
     * @example
     * // Count the number of TemplateImages
     * const count = await prisma.templateImage.count({
     *   where: {
     *     // ... the filter for the TemplateImages we want to count
     *   }
     * })
    **/
    count<T extends TemplateImageCountArgs>(
      args?: Subset<T, TemplateImageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TemplateImageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TemplateImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateImageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TemplateImageAggregateArgs>(args: Subset<T, TemplateImageAggregateArgs>): Prisma.PrismaPromise<GetTemplateImageAggregateType<T>>

    /**
     * Group by TemplateImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplateImageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TemplateImageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TemplateImageGroupByArgs['orderBy'] }
        : { orderBy?: TemplateImageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TemplateImageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTemplateImageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TemplateImage model
   */
  readonly fields: TemplateImageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TemplateImage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TemplateImageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    template<T extends TemplateDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TemplateDefaultArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TemplateImage model
   */ 
  interface TemplateImageFieldRefs {
    readonly id: FieldRef<"TemplateImage", 'Int'>
    readonly templateId: FieldRef<"TemplateImage", 'Int'>
    readonly imageUrl: FieldRef<"TemplateImage", 'String'>
    readonly imageType: FieldRef<"TemplateImage", 'String'>
    readonly order: FieldRef<"TemplateImage", 'Int'>
    readonly caption: FieldRef<"TemplateImage", 'String'>
    readonly createdAt: FieldRef<"TemplateImage", 'DateTime'>
    readonly updatedAt: FieldRef<"TemplateImage", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TemplateImage findUnique
   */
  export type TemplateImageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateImage
     */
    select?: TemplateImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateImageInclude<ExtArgs> | null
    /**
     * Filter, which TemplateImage to fetch.
     */
    where: TemplateImageWhereUniqueInput
  }

  /**
   * TemplateImage findUniqueOrThrow
   */
  export type TemplateImageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateImage
     */
    select?: TemplateImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateImageInclude<ExtArgs> | null
    /**
     * Filter, which TemplateImage to fetch.
     */
    where: TemplateImageWhereUniqueInput
  }

  /**
   * TemplateImage findFirst
   */
  export type TemplateImageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateImage
     */
    select?: TemplateImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateImageInclude<ExtArgs> | null
    /**
     * Filter, which TemplateImage to fetch.
     */
    where?: TemplateImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplateImages to fetch.
     */
    orderBy?: TemplateImageOrderByWithRelationInput | TemplateImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TemplateImages.
     */
    cursor?: TemplateImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplateImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplateImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TemplateImages.
     */
    distinct?: TemplateImageScalarFieldEnum | TemplateImageScalarFieldEnum[]
  }

  /**
   * TemplateImage findFirstOrThrow
   */
  export type TemplateImageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateImage
     */
    select?: TemplateImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateImageInclude<ExtArgs> | null
    /**
     * Filter, which TemplateImage to fetch.
     */
    where?: TemplateImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplateImages to fetch.
     */
    orderBy?: TemplateImageOrderByWithRelationInput | TemplateImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TemplateImages.
     */
    cursor?: TemplateImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplateImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplateImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TemplateImages.
     */
    distinct?: TemplateImageScalarFieldEnum | TemplateImageScalarFieldEnum[]
  }

  /**
   * TemplateImage findMany
   */
  export type TemplateImageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateImage
     */
    select?: TemplateImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateImageInclude<ExtArgs> | null
    /**
     * Filter, which TemplateImages to fetch.
     */
    where?: TemplateImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplateImages to fetch.
     */
    orderBy?: TemplateImageOrderByWithRelationInput | TemplateImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TemplateImages.
     */
    cursor?: TemplateImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplateImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplateImages.
     */
    skip?: number
    distinct?: TemplateImageScalarFieldEnum | TemplateImageScalarFieldEnum[]
  }

  /**
   * TemplateImage create
   */
  export type TemplateImageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateImage
     */
    select?: TemplateImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateImageInclude<ExtArgs> | null
    /**
     * The data needed to create a TemplateImage.
     */
    data: XOR<TemplateImageCreateInput, TemplateImageUncheckedCreateInput>
  }

  /**
   * TemplateImage createMany
   */
  export type TemplateImageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TemplateImages.
     */
    data: TemplateImageCreateManyInput | TemplateImageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TemplateImage createManyAndReturn
   */
  export type TemplateImageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateImage
     */
    select?: TemplateImageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TemplateImages.
     */
    data: TemplateImageCreateManyInput | TemplateImageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateImageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TemplateImage update
   */
  export type TemplateImageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateImage
     */
    select?: TemplateImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateImageInclude<ExtArgs> | null
    /**
     * The data needed to update a TemplateImage.
     */
    data: XOR<TemplateImageUpdateInput, TemplateImageUncheckedUpdateInput>
    /**
     * Choose, which TemplateImage to update.
     */
    where: TemplateImageWhereUniqueInput
  }

  /**
   * TemplateImage updateMany
   */
  export type TemplateImageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TemplateImages.
     */
    data: XOR<TemplateImageUpdateManyMutationInput, TemplateImageUncheckedUpdateManyInput>
    /**
     * Filter which TemplateImages to update
     */
    where?: TemplateImageWhereInput
  }

  /**
   * TemplateImage upsert
   */
  export type TemplateImageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateImage
     */
    select?: TemplateImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateImageInclude<ExtArgs> | null
    /**
     * The filter to search for the TemplateImage to update in case it exists.
     */
    where: TemplateImageWhereUniqueInput
    /**
     * In case the TemplateImage found by the `where` argument doesn't exist, create a new TemplateImage with this data.
     */
    create: XOR<TemplateImageCreateInput, TemplateImageUncheckedCreateInput>
    /**
     * In case the TemplateImage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TemplateImageUpdateInput, TemplateImageUncheckedUpdateInput>
  }

  /**
   * TemplateImage delete
   */
  export type TemplateImageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateImage
     */
    select?: TemplateImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateImageInclude<ExtArgs> | null
    /**
     * Filter which TemplateImage to delete.
     */
    where: TemplateImageWhereUniqueInput
  }

  /**
   * TemplateImage deleteMany
   */
  export type TemplateImageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TemplateImages to delete
     */
    where?: TemplateImageWhereInput
  }

  /**
   * TemplateImage without action
   */
  export type TemplateImageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplateImage
     */
    select?: TemplateImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplateImageInclude<ExtArgs> | null
  }


  /**
   * Model TemplatePages
   */

  export type AggregateTemplatePages = {
    _count: TemplatePagesCountAggregateOutputType | null
    _avg: TemplatePagesAvgAggregateOutputType | null
    _sum: TemplatePagesSumAggregateOutputType | null
    _min: TemplatePagesMinAggregateOutputType | null
    _max: TemplatePagesMaxAggregateOutputType | null
  }

  export type TemplatePagesAvgAggregateOutputType = {
    id: number | null
    templateId: number | null
    order: number | null
  }

  export type TemplatePagesSumAggregateOutputType = {
    id: number | null
    templateId: number | null
    order: number | null
  }

  export type TemplatePagesMinAggregateOutputType = {
    id: number | null
    templateId: number | null
    name: string | null
    content: string | null
    order: number | null
    linkingIdPrefix: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TemplatePagesMaxAggregateOutputType = {
    id: number | null
    templateId: number | null
    name: string | null
    content: string | null
    order: number | null
    linkingIdPrefix: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TemplatePagesCountAggregateOutputType = {
    id: number
    templateId: number
    name: number
    content: number
    order: number
    settings: number
    linkingIdPrefix: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TemplatePagesAvgAggregateInputType = {
    id?: true
    templateId?: true
    order?: true
  }

  export type TemplatePagesSumAggregateInputType = {
    id?: true
    templateId?: true
    order?: true
  }

  export type TemplatePagesMinAggregateInputType = {
    id?: true
    templateId?: true
    name?: true
    content?: true
    order?: true
    linkingIdPrefix?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TemplatePagesMaxAggregateInputType = {
    id?: true
    templateId?: true
    name?: true
    content?: true
    order?: true
    linkingIdPrefix?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TemplatePagesCountAggregateInputType = {
    id?: true
    templateId?: true
    name?: true
    content?: true
    order?: true
    settings?: true
    linkingIdPrefix?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TemplatePagesAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TemplatePages to aggregate.
     */
    where?: TemplatePagesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplatePages to fetch.
     */
    orderBy?: TemplatePagesOrderByWithRelationInput | TemplatePagesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TemplatePagesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplatePages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplatePages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TemplatePages
    **/
    _count?: true | TemplatePagesCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TemplatePagesAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TemplatePagesSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TemplatePagesMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TemplatePagesMaxAggregateInputType
  }

  export type GetTemplatePagesAggregateType<T extends TemplatePagesAggregateArgs> = {
        [P in keyof T & keyof AggregateTemplatePages]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTemplatePages[P]>
      : GetScalarType<T[P], AggregateTemplatePages[P]>
  }




  export type TemplatePagesGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TemplatePagesWhereInput
    orderBy?: TemplatePagesOrderByWithAggregationInput | TemplatePagesOrderByWithAggregationInput[]
    by: TemplatePagesScalarFieldEnum[] | TemplatePagesScalarFieldEnum
    having?: TemplatePagesScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TemplatePagesCountAggregateInputType | true
    _avg?: TemplatePagesAvgAggregateInputType
    _sum?: TemplatePagesSumAggregateInputType
    _min?: TemplatePagesMinAggregateInputType
    _max?: TemplatePagesMaxAggregateInputType
  }

  export type TemplatePagesGroupByOutputType = {
    id: number
    templateId: number
    name: string
    content: string | null
    order: number
    settings: JsonValue | null
    linkingIdPrefix: string | null
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: TemplatePagesCountAggregateOutputType | null
    _avg: TemplatePagesAvgAggregateOutputType | null
    _sum: TemplatePagesSumAggregateOutputType | null
    _min: TemplatePagesMinAggregateOutputType | null
    _max: TemplatePagesMaxAggregateOutputType | null
  }

  type GetTemplatePagesGroupByPayload<T extends TemplatePagesGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TemplatePagesGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TemplatePagesGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TemplatePagesGroupByOutputType[P]>
            : GetScalarType<T[P], TemplatePagesGroupByOutputType[P]>
        }
      >
    >


  export type TemplatePagesSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    templateId?: boolean
    name?: boolean
    content?: boolean
    order?: boolean
    settings?: boolean
    linkingIdPrefix?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    template?: boolean | TemplateDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["templatePages"]>

  export type TemplatePagesSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    templateId?: boolean
    name?: boolean
    content?: boolean
    order?: boolean
    settings?: boolean
    linkingIdPrefix?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    template?: boolean | TemplateDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["templatePages"]>

  export type TemplatePagesSelectScalar = {
    id?: boolean
    templateId?: boolean
    name?: boolean
    content?: boolean
    order?: boolean
    settings?: boolean
    linkingIdPrefix?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TemplatePagesInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    template?: boolean | TemplateDefaultArgs<ExtArgs>
  }
  export type TemplatePagesIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    template?: boolean | TemplateDefaultArgs<ExtArgs>
  }

  export type $TemplatePagesPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TemplatePages"
    objects: {
      template: Prisma.$TemplatePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      templateId: number
      name: string
      content: string | null
      order: number
      settings: Prisma.JsonValue | null
      linkingIdPrefix: string | null
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["templatePages"]>
    composites: {}
  }

  type TemplatePagesGetPayload<S extends boolean | null | undefined | TemplatePagesDefaultArgs> = $Result.GetResult<Prisma.$TemplatePagesPayload, S>

  type TemplatePagesCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TemplatePagesFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TemplatePagesCountAggregateInputType | true
    }

  export interface TemplatePagesDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TemplatePages'], meta: { name: 'TemplatePages' } }
    /**
     * Find zero or one TemplatePages that matches the filter.
     * @param {TemplatePagesFindUniqueArgs} args - Arguments to find a TemplatePages
     * @example
     * // Get one TemplatePages
     * const templatePages = await prisma.templatePages.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TemplatePagesFindUniqueArgs>(args: SelectSubset<T, TemplatePagesFindUniqueArgs<ExtArgs>>): Prisma__TemplatePagesClient<$Result.GetResult<Prisma.$TemplatePagesPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TemplatePages that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TemplatePagesFindUniqueOrThrowArgs} args - Arguments to find a TemplatePages
     * @example
     * // Get one TemplatePages
     * const templatePages = await prisma.templatePages.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TemplatePagesFindUniqueOrThrowArgs>(args: SelectSubset<T, TemplatePagesFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TemplatePagesClient<$Result.GetResult<Prisma.$TemplatePagesPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TemplatePages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplatePagesFindFirstArgs} args - Arguments to find a TemplatePages
     * @example
     * // Get one TemplatePages
     * const templatePages = await prisma.templatePages.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TemplatePagesFindFirstArgs>(args?: SelectSubset<T, TemplatePagesFindFirstArgs<ExtArgs>>): Prisma__TemplatePagesClient<$Result.GetResult<Prisma.$TemplatePagesPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TemplatePages that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplatePagesFindFirstOrThrowArgs} args - Arguments to find a TemplatePages
     * @example
     * // Get one TemplatePages
     * const templatePages = await prisma.templatePages.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TemplatePagesFindFirstOrThrowArgs>(args?: SelectSubset<T, TemplatePagesFindFirstOrThrowArgs<ExtArgs>>): Prisma__TemplatePagesClient<$Result.GetResult<Prisma.$TemplatePagesPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TemplatePages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplatePagesFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TemplatePages
     * const templatePages = await prisma.templatePages.findMany()
     * 
     * // Get first 10 TemplatePages
     * const templatePages = await prisma.templatePages.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const templatePagesWithIdOnly = await prisma.templatePages.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TemplatePagesFindManyArgs>(args?: SelectSubset<T, TemplatePagesFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplatePagesPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TemplatePages.
     * @param {TemplatePagesCreateArgs} args - Arguments to create a TemplatePages.
     * @example
     * // Create one TemplatePages
     * const TemplatePages = await prisma.templatePages.create({
     *   data: {
     *     // ... data to create a TemplatePages
     *   }
     * })
     * 
     */
    create<T extends TemplatePagesCreateArgs>(args: SelectSubset<T, TemplatePagesCreateArgs<ExtArgs>>): Prisma__TemplatePagesClient<$Result.GetResult<Prisma.$TemplatePagesPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TemplatePages.
     * @param {TemplatePagesCreateManyArgs} args - Arguments to create many TemplatePages.
     * @example
     * // Create many TemplatePages
     * const templatePages = await prisma.templatePages.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TemplatePagesCreateManyArgs>(args?: SelectSubset<T, TemplatePagesCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TemplatePages and returns the data saved in the database.
     * @param {TemplatePagesCreateManyAndReturnArgs} args - Arguments to create many TemplatePages.
     * @example
     * // Create many TemplatePages
     * const templatePages = await prisma.templatePages.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TemplatePages and only return the `id`
     * const templatePagesWithIdOnly = await prisma.templatePages.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TemplatePagesCreateManyAndReturnArgs>(args?: SelectSubset<T, TemplatePagesCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TemplatePagesPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TemplatePages.
     * @param {TemplatePagesDeleteArgs} args - Arguments to delete one TemplatePages.
     * @example
     * // Delete one TemplatePages
     * const TemplatePages = await prisma.templatePages.delete({
     *   where: {
     *     // ... filter to delete one TemplatePages
     *   }
     * })
     * 
     */
    delete<T extends TemplatePagesDeleteArgs>(args: SelectSubset<T, TemplatePagesDeleteArgs<ExtArgs>>): Prisma__TemplatePagesClient<$Result.GetResult<Prisma.$TemplatePagesPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TemplatePages.
     * @param {TemplatePagesUpdateArgs} args - Arguments to update one TemplatePages.
     * @example
     * // Update one TemplatePages
     * const templatePages = await prisma.templatePages.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TemplatePagesUpdateArgs>(args: SelectSubset<T, TemplatePagesUpdateArgs<ExtArgs>>): Prisma__TemplatePagesClient<$Result.GetResult<Prisma.$TemplatePagesPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TemplatePages.
     * @param {TemplatePagesDeleteManyArgs} args - Arguments to filter TemplatePages to delete.
     * @example
     * // Delete a few TemplatePages
     * const { count } = await prisma.templatePages.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TemplatePagesDeleteManyArgs>(args?: SelectSubset<T, TemplatePagesDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TemplatePages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplatePagesUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TemplatePages
     * const templatePages = await prisma.templatePages.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TemplatePagesUpdateManyArgs>(args: SelectSubset<T, TemplatePagesUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TemplatePages.
     * @param {TemplatePagesUpsertArgs} args - Arguments to update or create a TemplatePages.
     * @example
     * // Update or create a TemplatePages
     * const templatePages = await prisma.templatePages.upsert({
     *   create: {
     *     // ... data to create a TemplatePages
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TemplatePages we want to update
     *   }
     * })
     */
    upsert<T extends TemplatePagesUpsertArgs>(args: SelectSubset<T, TemplatePagesUpsertArgs<ExtArgs>>): Prisma__TemplatePagesClient<$Result.GetResult<Prisma.$TemplatePagesPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TemplatePages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplatePagesCountArgs} args - Arguments to filter TemplatePages to count.
     * @example
     * // Count the number of TemplatePages
     * const count = await prisma.templatePages.count({
     *   where: {
     *     // ... the filter for the TemplatePages we want to count
     *   }
     * })
    **/
    count<T extends TemplatePagesCountArgs>(
      args?: Subset<T, TemplatePagesCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TemplatePagesCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TemplatePages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplatePagesAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TemplatePagesAggregateArgs>(args: Subset<T, TemplatePagesAggregateArgs>): Prisma.PrismaPromise<GetTemplatePagesAggregateType<T>>

    /**
     * Group by TemplatePages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TemplatePagesGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TemplatePagesGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TemplatePagesGroupByArgs['orderBy'] }
        : { orderBy?: TemplatePagesGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TemplatePagesGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTemplatePagesGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TemplatePages model
   */
  readonly fields: TemplatePagesFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TemplatePages.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TemplatePagesClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    template<T extends TemplateDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TemplateDefaultArgs<ExtArgs>>): Prisma__TemplateClient<$Result.GetResult<Prisma.$TemplatePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TemplatePages model
   */ 
  interface TemplatePagesFieldRefs {
    readonly id: FieldRef<"TemplatePages", 'Int'>
    readonly templateId: FieldRef<"TemplatePages", 'Int'>
    readonly name: FieldRef<"TemplatePages", 'String'>
    readonly content: FieldRef<"TemplatePages", 'String'>
    readonly order: FieldRef<"TemplatePages", 'Int'>
    readonly settings: FieldRef<"TemplatePages", 'Json'>
    readonly linkingIdPrefix: FieldRef<"TemplatePages", 'String'>
    readonly metadata: FieldRef<"TemplatePages", 'Json'>
    readonly createdAt: FieldRef<"TemplatePages", 'DateTime'>
    readonly updatedAt: FieldRef<"TemplatePages", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TemplatePages findUnique
   */
  export type TemplatePagesFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplatePages
     */
    select?: TemplatePagesSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplatePagesInclude<ExtArgs> | null
    /**
     * Filter, which TemplatePages to fetch.
     */
    where: TemplatePagesWhereUniqueInput
  }

  /**
   * TemplatePages findUniqueOrThrow
   */
  export type TemplatePagesFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplatePages
     */
    select?: TemplatePagesSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplatePagesInclude<ExtArgs> | null
    /**
     * Filter, which TemplatePages to fetch.
     */
    where: TemplatePagesWhereUniqueInput
  }

  /**
   * TemplatePages findFirst
   */
  export type TemplatePagesFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplatePages
     */
    select?: TemplatePagesSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplatePagesInclude<ExtArgs> | null
    /**
     * Filter, which TemplatePages to fetch.
     */
    where?: TemplatePagesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplatePages to fetch.
     */
    orderBy?: TemplatePagesOrderByWithRelationInput | TemplatePagesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TemplatePages.
     */
    cursor?: TemplatePagesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplatePages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplatePages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TemplatePages.
     */
    distinct?: TemplatePagesScalarFieldEnum | TemplatePagesScalarFieldEnum[]
  }

  /**
   * TemplatePages findFirstOrThrow
   */
  export type TemplatePagesFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplatePages
     */
    select?: TemplatePagesSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplatePagesInclude<ExtArgs> | null
    /**
     * Filter, which TemplatePages to fetch.
     */
    where?: TemplatePagesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplatePages to fetch.
     */
    orderBy?: TemplatePagesOrderByWithRelationInput | TemplatePagesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TemplatePages.
     */
    cursor?: TemplatePagesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplatePages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplatePages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TemplatePages.
     */
    distinct?: TemplatePagesScalarFieldEnum | TemplatePagesScalarFieldEnum[]
  }

  /**
   * TemplatePages findMany
   */
  export type TemplatePagesFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplatePages
     */
    select?: TemplatePagesSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplatePagesInclude<ExtArgs> | null
    /**
     * Filter, which TemplatePages to fetch.
     */
    where?: TemplatePagesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TemplatePages to fetch.
     */
    orderBy?: TemplatePagesOrderByWithRelationInput | TemplatePagesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TemplatePages.
     */
    cursor?: TemplatePagesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TemplatePages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TemplatePages.
     */
    skip?: number
    distinct?: TemplatePagesScalarFieldEnum | TemplatePagesScalarFieldEnum[]
  }

  /**
   * TemplatePages create
   */
  export type TemplatePagesCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplatePages
     */
    select?: TemplatePagesSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplatePagesInclude<ExtArgs> | null
    /**
     * The data needed to create a TemplatePages.
     */
    data: XOR<TemplatePagesCreateInput, TemplatePagesUncheckedCreateInput>
  }

  /**
   * TemplatePages createMany
   */
  export type TemplatePagesCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TemplatePages.
     */
    data: TemplatePagesCreateManyInput | TemplatePagesCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TemplatePages createManyAndReturn
   */
  export type TemplatePagesCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplatePages
     */
    select?: TemplatePagesSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TemplatePages.
     */
    data: TemplatePagesCreateManyInput | TemplatePagesCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplatePagesIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TemplatePages update
   */
  export type TemplatePagesUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplatePages
     */
    select?: TemplatePagesSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplatePagesInclude<ExtArgs> | null
    /**
     * The data needed to update a TemplatePages.
     */
    data: XOR<TemplatePagesUpdateInput, TemplatePagesUncheckedUpdateInput>
    /**
     * Choose, which TemplatePages to update.
     */
    where: TemplatePagesWhereUniqueInput
  }

  /**
   * TemplatePages updateMany
   */
  export type TemplatePagesUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TemplatePages.
     */
    data: XOR<TemplatePagesUpdateManyMutationInput, TemplatePagesUncheckedUpdateManyInput>
    /**
     * Filter which TemplatePages to update
     */
    where?: TemplatePagesWhereInput
  }

  /**
   * TemplatePages upsert
   */
  export type TemplatePagesUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplatePages
     */
    select?: TemplatePagesSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplatePagesInclude<ExtArgs> | null
    /**
     * The filter to search for the TemplatePages to update in case it exists.
     */
    where: TemplatePagesWhereUniqueInput
    /**
     * In case the TemplatePages found by the `where` argument doesn't exist, create a new TemplatePages with this data.
     */
    create: XOR<TemplatePagesCreateInput, TemplatePagesUncheckedCreateInput>
    /**
     * In case the TemplatePages was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TemplatePagesUpdateInput, TemplatePagesUncheckedUpdateInput>
  }

  /**
   * TemplatePages delete
   */
  export type TemplatePagesDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplatePages
     */
    select?: TemplatePagesSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplatePagesInclude<ExtArgs> | null
    /**
     * Filter which TemplatePages to delete.
     */
    where: TemplatePagesWhereUniqueInput
  }

  /**
   * TemplatePages deleteMany
   */
  export type TemplatePagesDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TemplatePages to delete
     */
    where?: TemplatePagesWhereInput
  }

  /**
   * TemplatePages without action
   */
  export type TemplatePagesDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TemplatePages
     */
    select?: TemplatePagesSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TemplatePagesInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    name: 'name',
    password: 'password',
    passwordResetToken: 'passwordResetToken',
    passwordResetExpiresAt: 'passwordResetExpiresAt',
    isAdmin: 'isAdmin',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const FunnelScalarFieldEnum: {
    id: 'id',
    name: 'name',
    status: 'status',
    userId: 'userId',
    templateId: 'templateId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type FunnelScalarFieldEnum = (typeof FunnelScalarFieldEnum)[keyof typeof FunnelScalarFieldEnum]


  export const DomainScalarFieldEnum: {
    id: 'id',
    hostname: 'hostname',
    type: 'type',
    status: 'status',
    sslStatus: 'sslStatus',
    userId: 'userId',
    cloudflareHostnameId: 'cloudflareHostnameId',
    cloudflareZoneId: 'cloudflareZoneId',
    cloudflareRecordId: 'cloudflareRecordId',
    verificationToken: 'verificationToken',
    ownershipVerification: 'ownershipVerification',
    dnsInstructions: 'dnsInstructions',
    sslCertificateId: 'sslCertificateId',
    sslValidationRecords: 'sslValidationRecords',
    lastVerifiedAt: 'lastVerifiedAt',
    expiresAt: 'expiresAt',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type DomainScalarFieldEnum = (typeof DomainScalarFieldEnum)[keyof typeof DomainScalarFieldEnum]


  export const FunnelDomainScalarFieldEnum: {
    id: 'id',
    funnelId: 'funnelId',
    domainId: 'domainId',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type FunnelDomainScalarFieldEnum = (typeof FunnelDomainScalarFieldEnum)[keyof typeof FunnelDomainScalarFieldEnum]


  export const PageScalarFieldEnum: {
    id: 'id',
    name: 'name',
    content: 'content',
    order: 'order',
    linkingId: 'linkingId',
    funnelId: 'funnelId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PageScalarFieldEnum = (typeof PageScalarFieldEnum)[keyof typeof PageScalarFieldEnum]


  export const TemplateCategoryScalarFieldEnum: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    description: 'description',
    icon: 'icon',
    order: 'order',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TemplateCategoryScalarFieldEnum = (typeof TemplateCategoryScalarFieldEnum)[keyof typeof TemplateCategoryScalarFieldEnum]


  export const TemplateScalarFieldEnum: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    description: 'description',
    categoryId: 'categoryId',
    thumbnailImage: 'thumbnailImage',
    tags: 'tags',
    usageCount: 'usageCount',
    isActive: 'isActive',
    isPublic: 'isPublic',
    createdByUserId: 'createdByUserId',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TemplateScalarFieldEnum = (typeof TemplateScalarFieldEnum)[keyof typeof TemplateScalarFieldEnum]


  export const TemplateImageScalarFieldEnum: {
    id: 'id',
    templateId: 'templateId',
    imageUrl: 'imageUrl',
    imageType: 'imageType',
    order: 'order',
    caption: 'caption',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TemplateImageScalarFieldEnum = (typeof TemplateImageScalarFieldEnum)[keyof typeof TemplateImageScalarFieldEnum]


  export const TemplatePagesScalarFieldEnum: {
    id: 'id',
    templateId: 'templateId',
    name: 'name',
    content: 'content',
    order: 'order',
    settings: 'settings',
    linkingIdPrefix: 'linkingIdPrefix',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TemplatePagesScalarFieldEnum = (typeof TemplatePagesScalarFieldEnum)[keyof typeof TemplatePagesScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DomainType'
   */
  export type EnumDomainTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DomainType'>
    


  /**
   * Reference to a field of type 'DomainType[]'
   */
  export type ListEnumDomainTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DomainType[]'>
    


  /**
   * Reference to a field of type 'DomainStatus'
   */
  export type EnumDomainStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DomainStatus'>
    


  /**
   * Reference to a field of type 'DomainStatus[]'
   */
  export type ListEnumDomainStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DomainStatus[]'>
    


  /**
   * Reference to a field of type 'SslStatus'
   */
  export type EnumSslStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SslStatus'>
    


  /**
   * Reference to a field of type 'SslStatus[]'
   */
  export type ListEnumSslStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SslStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    email?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    password?: StringFilter<"User"> | string
    passwordResetToken?: StringNullableFilter<"User"> | string | null
    passwordResetExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    isAdmin?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    funnels?: FunnelListRelationFilter
    domains?: DomainListRelationFilter
    templates?: TemplateListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrderInput | SortOrder
    password?: SortOrder
    passwordResetToken?: SortOrderInput | SortOrder
    passwordResetExpiresAt?: SortOrderInput | SortOrder
    isAdmin?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    funnels?: FunnelOrderByRelationAggregateInput
    domains?: DomainOrderByRelationAggregateInput
    templates?: TemplateOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    email?: string
    passwordResetToken?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    password?: StringFilter<"User"> | string
    passwordResetExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    isAdmin?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    funnels?: FunnelListRelationFilter
    domains?: DomainListRelationFilter
    templates?: TemplateListRelationFilter
  }, "id" | "email" | "passwordResetToken">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrderInput | SortOrder
    password?: SortOrder
    passwordResetToken?: SortOrderInput | SortOrder
    passwordResetExpiresAt?: SortOrderInput | SortOrder
    isAdmin?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    email?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    password?: StringWithAggregatesFilter<"User"> | string
    passwordResetToken?: StringNullableWithAggregatesFilter<"User"> | string | null
    passwordResetExpiresAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    isAdmin?: BoolWithAggregatesFilter<"User"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type FunnelWhereInput = {
    AND?: FunnelWhereInput | FunnelWhereInput[]
    OR?: FunnelWhereInput[]
    NOT?: FunnelWhereInput | FunnelWhereInput[]
    id?: IntFilter<"Funnel"> | number
    name?: StringFilter<"Funnel"> | string
    status?: StringFilter<"Funnel"> | string
    userId?: IntFilter<"Funnel"> | number
    templateId?: IntNullableFilter<"Funnel"> | number | null
    createdAt?: DateTimeFilter<"Funnel"> | Date | string
    updatedAt?: DateTimeFilter<"Funnel"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    pages?: PageListRelationFilter
    domainConnections?: FunnelDomainListRelationFilter
    template?: XOR<TemplateNullableRelationFilter, TemplateWhereInput> | null
  }

  export type FunnelOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    status?: SortOrder
    userId?: SortOrder
    templateId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    pages?: PageOrderByRelationAggregateInput
    domainConnections?: FunnelDomainOrderByRelationAggregateInput
    template?: TemplateOrderByWithRelationInput
  }

  export type FunnelWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: FunnelWhereInput | FunnelWhereInput[]
    OR?: FunnelWhereInput[]
    NOT?: FunnelWhereInput | FunnelWhereInput[]
    name?: StringFilter<"Funnel"> | string
    status?: StringFilter<"Funnel"> | string
    userId?: IntFilter<"Funnel"> | number
    templateId?: IntNullableFilter<"Funnel"> | number | null
    createdAt?: DateTimeFilter<"Funnel"> | Date | string
    updatedAt?: DateTimeFilter<"Funnel"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    pages?: PageListRelationFilter
    domainConnections?: FunnelDomainListRelationFilter
    template?: XOR<TemplateNullableRelationFilter, TemplateWhereInput> | null
  }, "id">

  export type FunnelOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    status?: SortOrder
    userId?: SortOrder
    templateId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: FunnelCountOrderByAggregateInput
    _avg?: FunnelAvgOrderByAggregateInput
    _max?: FunnelMaxOrderByAggregateInput
    _min?: FunnelMinOrderByAggregateInput
    _sum?: FunnelSumOrderByAggregateInput
  }

  export type FunnelScalarWhereWithAggregatesInput = {
    AND?: FunnelScalarWhereWithAggregatesInput | FunnelScalarWhereWithAggregatesInput[]
    OR?: FunnelScalarWhereWithAggregatesInput[]
    NOT?: FunnelScalarWhereWithAggregatesInput | FunnelScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Funnel"> | number
    name?: StringWithAggregatesFilter<"Funnel"> | string
    status?: StringWithAggregatesFilter<"Funnel"> | string
    userId?: IntWithAggregatesFilter<"Funnel"> | number
    templateId?: IntNullableWithAggregatesFilter<"Funnel"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"Funnel"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Funnel"> | Date | string
  }

  export type DomainWhereInput = {
    AND?: DomainWhereInput | DomainWhereInput[]
    OR?: DomainWhereInput[]
    NOT?: DomainWhereInput | DomainWhereInput[]
    id?: IntFilter<"Domain"> | number
    hostname?: StringFilter<"Domain"> | string
    type?: EnumDomainTypeFilter<"Domain"> | $Enums.DomainType
    status?: EnumDomainStatusFilter<"Domain"> | $Enums.DomainStatus
    sslStatus?: EnumSslStatusFilter<"Domain"> | $Enums.SslStatus
    userId?: IntFilter<"Domain"> | number
    cloudflareHostnameId?: StringNullableFilter<"Domain"> | string | null
    cloudflareZoneId?: StringNullableFilter<"Domain"> | string | null
    cloudflareRecordId?: StringNullableFilter<"Domain"> | string | null
    verificationToken?: StringNullableFilter<"Domain"> | string | null
    ownershipVerification?: JsonNullableFilter<"Domain">
    dnsInstructions?: JsonNullableFilter<"Domain">
    sslCertificateId?: StringNullableFilter<"Domain"> | string | null
    sslValidationRecords?: JsonNullableFilter<"Domain">
    lastVerifiedAt?: DateTimeNullableFilter<"Domain"> | Date | string | null
    expiresAt?: DateTimeNullableFilter<"Domain"> | Date | string | null
    notes?: StringNullableFilter<"Domain"> | string | null
    createdAt?: DateTimeFilter<"Domain"> | Date | string
    updatedAt?: DateTimeFilter<"Domain"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    funnelConnections?: FunnelDomainListRelationFilter
  }

  export type DomainOrderByWithRelationInput = {
    id?: SortOrder
    hostname?: SortOrder
    type?: SortOrder
    status?: SortOrder
    sslStatus?: SortOrder
    userId?: SortOrder
    cloudflareHostnameId?: SortOrderInput | SortOrder
    cloudflareZoneId?: SortOrderInput | SortOrder
    cloudflareRecordId?: SortOrderInput | SortOrder
    verificationToken?: SortOrderInput | SortOrder
    ownershipVerification?: SortOrderInput | SortOrder
    dnsInstructions?: SortOrderInput | SortOrder
    sslCertificateId?: SortOrderInput | SortOrder
    sslValidationRecords?: SortOrderInput | SortOrder
    lastVerifiedAt?: SortOrderInput | SortOrder
    expiresAt?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    funnelConnections?: FunnelDomainOrderByRelationAggregateInput
  }

  export type DomainWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    hostname?: string
    cloudflareHostnameId?: string
    AND?: DomainWhereInput | DomainWhereInput[]
    OR?: DomainWhereInput[]
    NOT?: DomainWhereInput | DomainWhereInput[]
    type?: EnumDomainTypeFilter<"Domain"> | $Enums.DomainType
    status?: EnumDomainStatusFilter<"Domain"> | $Enums.DomainStatus
    sslStatus?: EnumSslStatusFilter<"Domain"> | $Enums.SslStatus
    userId?: IntFilter<"Domain"> | number
    cloudflareZoneId?: StringNullableFilter<"Domain"> | string | null
    cloudflareRecordId?: StringNullableFilter<"Domain"> | string | null
    verificationToken?: StringNullableFilter<"Domain"> | string | null
    ownershipVerification?: JsonNullableFilter<"Domain">
    dnsInstructions?: JsonNullableFilter<"Domain">
    sslCertificateId?: StringNullableFilter<"Domain"> | string | null
    sslValidationRecords?: JsonNullableFilter<"Domain">
    lastVerifiedAt?: DateTimeNullableFilter<"Domain"> | Date | string | null
    expiresAt?: DateTimeNullableFilter<"Domain"> | Date | string | null
    notes?: StringNullableFilter<"Domain"> | string | null
    createdAt?: DateTimeFilter<"Domain"> | Date | string
    updatedAt?: DateTimeFilter<"Domain"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    funnelConnections?: FunnelDomainListRelationFilter
  }, "id" | "hostname" | "cloudflareHostnameId">

  export type DomainOrderByWithAggregationInput = {
    id?: SortOrder
    hostname?: SortOrder
    type?: SortOrder
    status?: SortOrder
    sslStatus?: SortOrder
    userId?: SortOrder
    cloudflareHostnameId?: SortOrderInput | SortOrder
    cloudflareZoneId?: SortOrderInput | SortOrder
    cloudflareRecordId?: SortOrderInput | SortOrder
    verificationToken?: SortOrderInput | SortOrder
    ownershipVerification?: SortOrderInput | SortOrder
    dnsInstructions?: SortOrderInput | SortOrder
    sslCertificateId?: SortOrderInput | SortOrder
    sslValidationRecords?: SortOrderInput | SortOrder
    lastVerifiedAt?: SortOrderInput | SortOrder
    expiresAt?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: DomainCountOrderByAggregateInput
    _avg?: DomainAvgOrderByAggregateInput
    _max?: DomainMaxOrderByAggregateInput
    _min?: DomainMinOrderByAggregateInput
    _sum?: DomainSumOrderByAggregateInput
  }

  export type DomainScalarWhereWithAggregatesInput = {
    AND?: DomainScalarWhereWithAggregatesInput | DomainScalarWhereWithAggregatesInput[]
    OR?: DomainScalarWhereWithAggregatesInput[]
    NOT?: DomainScalarWhereWithAggregatesInput | DomainScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Domain"> | number
    hostname?: StringWithAggregatesFilter<"Domain"> | string
    type?: EnumDomainTypeWithAggregatesFilter<"Domain"> | $Enums.DomainType
    status?: EnumDomainStatusWithAggregatesFilter<"Domain"> | $Enums.DomainStatus
    sslStatus?: EnumSslStatusWithAggregatesFilter<"Domain"> | $Enums.SslStatus
    userId?: IntWithAggregatesFilter<"Domain"> | number
    cloudflareHostnameId?: StringNullableWithAggregatesFilter<"Domain"> | string | null
    cloudflareZoneId?: StringNullableWithAggregatesFilter<"Domain"> | string | null
    cloudflareRecordId?: StringNullableWithAggregatesFilter<"Domain"> | string | null
    verificationToken?: StringNullableWithAggregatesFilter<"Domain"> | string | null
    ownershipVerification?: JsonNullableWithAggregatesFilter<"Domain">
    dnsInstructions?: JsonNullableWithAggregatesFilter<"Domain">
    sslCertificateId?: StringNullableWithAggregatesFilter<"Domain"> | string | null
    sslValidationRecords?: JsonNullableWithAggregatesFilter<"Domain">
    lastVerifiedAt?: DateTimeNullableWithAggregatesFilter<"Domain"> | Date | string | null
    expiresAt?: DateTimeNullableWithAggregatesFilter<"Domain"> | Date | string | null
    notes?: StringNullableWithAggregatesFilter<"Domain"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Domain"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Domain"> | Date | string
  }

  export type FunnelDomainWhereInput = {
    AND?: FunnelDomainWhereInput | FunnelDomainWhereInput[]
    OR?: FunnelDomainWhereInput[]
    NOT?: FunnelDomainWhereInput | FunnelDomainWhereInput[]
    id?: IntFilter<"FunnelDomain"> | number
    funnelId?: IntFilter<"FunnelDomain"> | number
    domainId?: IntFilter<"FunnelDomain"> | number
    isActive?: BoolFilter<"FunnelDomain"> | boolean
    createdAt?: DateTimeFilter<"FunnelDomain"> | Date | string
    updatedAt?: DateTimeFilter<"FunnelDomain"> | Date | string
    funnel?: XOR<FunnelRelationFilter, FunnelWhereInput>
    domain?: XOR<DomainRelationFilter, DomainWhereInput>
  }

  export type FunnelDomainOrderByWithRelationInput = {
    id?: SortOrder
    funnelId?: SortOrder
    domainId?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    funnel?: FunnelOrderByWithRelationInput
    domain?: DomainOrderByWithRelationInput
  }

  export type FunnelDomainWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    funnelId_domainId?: FunnelDomainFunnelIdDomainIdCompoundUniqueInput
    AND?: FunnelDomainWhereInput | FunnelDomainWhereInput[]
    OR?: FunnelDomainWhereInput[]
    NOT?: FunnelDomainWhereInput | FunnelDomainWhereInput[]
    funnelId?: IntFilter<"FunnelDomain"> | number
    domainId?: IntFilter<"FunnelDomain"> | number
    isActive?: BoolFilter<"FunnelDomain"> | boolean
    createdAt?: DateTimeFilter<"FunnelDomain"> | Date | string
    updatedAt?: DateTimeFilter<"FunnelDomain"> | Date | string
    funnel?: XOR<FunnelRelationFilter, FunnelWhereInput>
    domain?: XOR<DomainRelationFilter, DomainWhereInput>
  }, "id" | "funnelId_domainId">

  export type FunnelDomainOrderByWithAggregationInput = {
    id?: SortOrder
    funnelId?: SortOrder
    domainId?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: FunnelDomainCountOrderByAggregateInput
    _avg?: FunnelDomainAvgOrderByAggregateInput
    _max?: FunnelDomainMaxOrderByAggregateInput
    _min?: FunnelDomainMinOrderByAggregateInput
    _sum?: FunnelDomainSumOrderByAggregateInput
  }

  export type FunnelDomainScalarWhereWithAggregatesInput = {
    AND?: FunnelDomainScalarWhereWithAggregatesInput | FunnelDomainScalarWhereWithAggregatesInput[]
    OR?: FunnelDomainScalarWhereWithAggregatesInput[]
    NOT?: FunnelDomainScalarWhereWithAggregatesInput | FunnelDomainScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"FunnelDomain"> | number
    funnelId?: IntWithAggregatesFilter<"FunnelDomain"> | number
    domainId?: IntWithAggregatesFilter<"FunnelDomain"> | number
    isActive?: BoolWithAggregatesFilter<"FunnelDomain"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"FunnelDomain"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"FunnelDomain"> | Date | string
  }

  export type PageWhereInput = {
    AND?: PageWhereInput | PageWhereInput[]
    OR?: PageWhereInput[]
    NOT?: PageWhereInput | PageWhereInput[]
    id?: IntFilter<"Page"> | number
    name?: StringFilter<"Page"> | string
    content?: StringNullableFilter<"Page"> | string | null
    order?: IntFilter<"Page"> | number
    linkingId?: StringNullableFilter<"Page"> | string | null
    funnelId?: IntFilter<"Page"> | number
    createdAt?: DateTimeFilter<"Page"> | Date | string
    updatedAt?: DateTimeFilter<"Page"> | Date | string
    funnel?: XOR<FunnelRelationFilter, FunnelWhereInput>
  }

  export type PageOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    content?: SortOrderInput | SortOrder
    order?: SortOrder
    linkingId?: SortOrderInput | SortOrder
    funnelId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    funnel?: FunnelOrderByWithRelationInput
  }

  export type PageWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    linkingId?: string
    AND?: PageWhereInput | PageWhereInput[]
    OR?: PageWhereInput[]
    NOT?: PageWhereInput | PageWhereInput[]
    name?: StringFilter<"Page"> | string
    content?: StringNullableFilter<"Page"> | string | null
    order?: IntFilter<"Page"> | number
    funnelId?: IntFilter<"Page"> | number
    createdAt?: DateTimeFilter<"Page"> | Date | string
    updatedAt?: DateTimeFilter<"Page"> | Date | string
    funnel?: XOR<FunnelRelationFilter, FunnelWhereInput>
  }, "id" | "linkingId">

  export type PageOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    content?: SortOrderInput | SortOrder
    order?: SortOrder
    linkingId?: SortOrderInput | SortOrder
    funnelId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PageCountOrderByAggregateInput
    _avg?: PageAvgOrderByAggregateInput
    _max?: PageMaxOrderByAggregateInput
    _min?: PageMinOrderByAggregateInput
    _sum?: PageSumOrderByAggregateInput
  }

  export type PageScalarWhereWithAggregatesInput = {
    AND?: PageScalarWhereWithAggregatesInput | PageScalarWhereWithAggregatesInput[]
    OR?: PageScalarWhereWithAggregatesInput[]
    NOT?: PageScalarWhereWithAggregatesInput | PageScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Page"> | number
    name?: StringWithAggregatesFilter<"Page"> | string
    content?: StringNullableWithAggregatesFilter<"Page"> | string | null
    order?: IntWithAggregatesFilter<"Page"> | number
    linkingId?: StringNullableWithAggregatesFilter<"Page"> | string | null
    funnelId?: IntWithAggregatesFilter<"Page"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Page"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Page"> | Date | string
  }

  export type TemplateCategoryWhereInput = {
    AND?: TemplateCategoryWhereInput | TemplateCategoryWhereInput[]
    OR?: TemplateCategoryWhereInput[]
    NOT?: TemplateCategoryWhereInput | TemplateCategoryWhereInput[]
    id?: IntFilter<"TemplateCategory"> | number
    name?: StringFilter<"TemplateCategory"> | string
    slug?: StringFilter<"TemplateCategory"> | string
    description?: StringNullableFilter<"TemplateCategory"> | string | null
    icon?: StringNullableFilter<"TemplateCategory"> | string | null
    order?: IntFilter<"TemplateCategory"> | number
    isActive?: BoolFilter<"TemplateCategory"> | boolean
    createdAt?: DateTimeFilter<"TemplateCategory"> | Date | string
    updatedAt?: DateTimeFilter<"TemplateCategory"> | Date | string
    templates?: TemplateListRelationFilter
  }

  export type TemplateCategoryOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    order?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    templates?: TemplateOrderByRelationAggregateInput
  }

  export type TemplateCategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    name?: string
    slug?: string
    AND?: TemplateCategoryWhereInput | TemplateCategoryWhereInput[]
    OR?: TemplateCategoryWhereInput[]
    NOT?: TemplateCategoryWhereInput | TemplateCategoryWhereInput[]
    description?: StringNullableFilter<"TemplateCategory"> | string | null
    icon?: StringNullableFilter<"TemplateCategory"> | string | null
    order?: IntFilter<"TemplateCategory"> | number
    isActive?: BoolFilter<"TemplateCategory"> | boolean
    createdAt?: DateTimeFilter<"TemplateCategory"> | Date | string
    updatedAt?: DateTimeFilter<"TemplateCategory"> | Date | string
    templates?: TemplateListRelationFilter
  }, "id" | "name" | "slug">

  export type TemplateCategoryOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    order?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TemplateCategoryCountOrderByAggregateInput
    _avg?: TemplateCategoryAvgOrderByAggregateInput
    _max?: TemplateCategoryMaxOrderByAggregateInput
    _min?: TemplateCategoryMinOrderByAggregateInput
    _sum?: TemplateCategorySumOrderByAggregateInput
  }

  export type TemplateCategoryScalarWhereWithAggregatesInput = {
    AND?: TemplateCategoryScalarWhereWithAggregatesInput | TemplateCategoryScalarWhereWithAggregatesInput[]
    OR?: TemplateCategoryScalarWhereWithAggregatesInput[]
    NOT?: TemplateCategoryScalarWhereWithAggregatesInput | TemplateCategoryScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"TemplateCategory"> | number
    name?: StringWithAggregatesFilter<"TemplateCategory"> | string
    slug?: StringWithAggregatesFilter<"TemplateCategory"> | string
    description?: StringNullableWithAggregatesFilter<"TemplateCategory"> | string | null
    icon?: StringNullableWithAggregatesFilter<"TemplateCategory"> | string | null
    order?: IntWithAggregatesFilter<"TemplateCategory"> | number
    isActive?: BoolWithAggregatesFilter<"TemplateCategory"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"TemplateCategory"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TemplateCategory"> | Date | string
  }

  export type TemplateWhereInput = {
    AND?: TemplateWhereInput | TemplateWhereInput[]
    OR?: TemplateWhereInput[]
    NOT?: TemplateWhereInput | TemplateWhereInput[]
    id?: IntFilter<"Template"> | number
    name?: StringFilter<"Template"> | string
    slug?: StringFilter<"Template"> | string
    description?: StringNullableFilter<"Template"> | string | null
    categoryId?: IntFilter<"Template"> | number
    thumbnailImage?: StringNullableFilter<"Template"> | string | null
    tags?: StringNullableListFilter<"Template">
    usageCount?: IntFilter<"Template"> | number
    isActive?: BoolFilter<"Template"> | boolean
    isPublic?: BoolFilter<"Template"> | boolean
    createdByUserId?: IntFilter<"Template"> | number
    metadata?: JsonNullableFilter<"Template">
    createdAt?: DateTimeFilter<"Template"> | Date | string
    updatedAt?: DateTimeFilter<"Template"> | Date | string
    category?: XOR<TemplateCategoryRelationFilter, TemplateCategoryWhereInput>
    previewImages?: TemplateImageListRelationFilter
    pages?: TemplatePagesListRelationFilter
    createdBy?: XOR<UserRelationFilter, UserWhereInput>
    funnelsCreated?: FunnelListRelationFilter
  }

  export type TemplateOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    categoryId?: SortOrder
    thumbnailImage?: SortOrderInput | SortOrder
    tags?: SortOrder
    usageCount?: SortOrder
    isActive?: SortOrder
    isPublic?: SortOrder
    createdByUserId?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    category?: TemplateCategoryOrderByWithRelationInput
    previewImages?: TemplateImageOrderByRelationAggregateInput
    pages?: TemplatePagesOrderByRelationAggregateInput
    createdBy?: UserOrderByWithRelationInput
    funnelsCreated?: FunnelOrderByRelationAggregateInput
  }

  export type TemplateWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    slug?: string
    AND?: TemplateWhereInput | TemplateWhereInput[]
    OR?: TemplateWhereInput[]
    NOT?: TemplateWhereInput | TemplateWhereInput[]
    name?: StringFilter<"Template"> | string
    description?: StringNullableFilter<"Template"> | string | null
    categoryId?: IntFilter<"Template"> | number
    thumbnailImage?: StringNullableFilter<"Template"> | string | null
    tags?: StringNullableListFilter<"Template">
    usageCount?: IntFilter<"Template"> | number
    isActive?: BoolFilter<"Template"> | boolean
    isPublic?: BoolFilter<"Template"> | boolean
    createdByUserId?: IntFilter<"Template"> | number
    metadata?: JsonNullableFilter<"Template">
    createdAt?: DateTimeFilter<"Template"> | Date | string
    updatedAt?: DateTimeFilter<"Template"> | Date | string
    category?: XOR<TemplateCategoryRelationFilter, TemplateCategoryWhereInput>
    previewImages?: TemplateImageListRelationFilter
    pages?: TemplatePagesListRelationFilter
    createdBy?: XOR<UserRelationFilter, UserWhereInput>
    funnelsCreated?: FunnelListRelationFilter
  }, "id" | "slug">

  export type TemplateOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    categoryId?: SortOrder
    thumbnailImage?: SortOrderInput | SortOrder
    tags?: SortOrder
    usageCount?: SortOrder
    isActive?: SortOrder
    isPublic?: SortOrder
    createdByUserId?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TemplateCountOrderByAggregateInput
    _avg?: TemplateAvgOrderByAggregateInput
    _max?: TemplateMaxOrderByAggregateInput
    _min?: TemplateMinOrderByAggregateInput
    _sum?: TemplateSumOrderByAggregateInput
  }

  export type TemplateScalarWhereWithAggregatesInput = {
    AND?: TemplateScalarWhereWithAggregatesInput | TemplateScalarWhereWithAggregatesInput[]
    OR?: TemplateScalarWhereWithAggregatesInput[]
    NOT?: TemplateScalarWhereWithAggregatesInput | TemplateScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Template"> | number
    name?: StringWithAggregatesFilter<"Template"> | string
    slug?: StringWithAggregatesFilter<"Template"> | string
    description?: StringNullableWithAggregatesFilter<"Template"> | string | null
    categoryId?: IntWithAggregatesFilter<"Template"> | number
    thumbnailImage?: StringNullableWithAggregatesFilter<"Template"> | string | null
    tags?: StringNullableListFilter<"Template">
    usageCount?: IntWithAggregatesFilter<"Template"> | number
    isActive?: BoolWithAggregatesFilter<"Template"> | boolean
    isPublic?: BoolWithAggregatesFilter<"Template"> | boolean
    createdByUserId?: IntWithAggregatesFilter<"Template"> | number
    metadata?: JsonNullableWithAggregatesFilter<"Template">
    createdAt?: DateTimeWithAggregatesFilter<"Template"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Template"> | Date | string
  }

  export type TemplateImageWhereInput = {
    AND?: TemplateImageWhereInput | TemplateImageWhereInput[]
    OR?: TemplateImageWhereInput[]
    NOT?: TemplateImageWhereInput | TemplateImageWhereInput[]
    id?: IntFilter<"TemplateImage"> | number
    templateId?: IntFilter<"TemplateImage"> | number
    imageUrl?: StringFilter<"TemplateImage"> | string
    imageType?: StringFilter<"TemplateImage"> | string
    order?: IntFilter<"TemplateImage"> | number
    caption?: StringNullableFilter<"TemplateImage"> | string | null
    createdAt?: DateTimeFilter<"TemplateImage"> | Date | string
    updatedAt?: DateTimeFilter<"TemplateImage"> | Date | string
    template?: XOR<TemplateRelationFilter, TemplateWhereInput>
  }

  export type TemplateImageOrderByWithRelationInput = {
    id?: SortOrder
    templateId?: SortOrder
    imageUrl?: SortOrder
    imageType?: SortOrder
    order?: SortOrder
    caption?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    template?: TemplateOrderByWithRelationInput
  }

  export type TemplateImageWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: TemplateImageWhereInput | TemplateImageWhereInput[]
    OR?: TemplateImageWhereInput[]
    NOT?: TemplateImageWhereInput | TemplateImageWhereInput[]
    templateId?: IntFilter<"TemplateImage"> | number
    imageUrl?: StringFilter<"TemplateImage"> | string
    imageType?: StringFilter<"TemplateImage"> | string
    order?: IntFilter<"TemplateImage"> | number
    caption?: StringNullableFilter<"TemplateImage"> | string | null
    createdAt?: DateTimeFilter<"TemplateImage"> | Date | string
    updatedAt?: DateTimeFilter<"TemplateImage"> | Date | string
    template?: XOR<TemplateRelationFilter, TemplateWhereInput>
  }, "id">

  export type TemplateImageOrderByWithAggregationInput = {
    id?: SortOrder
    templateId?: SortOrder
    imageUrl?: SortOrder
    imageType?: SortOrder
    order?: SortOrder
    caption?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TemplateImageCountOrderByAggregateInput
    _avg?: TemplateImageAvgOrderByAggregateInput
    _max?: TemplateImageMaxOrderByAggregateInput
    _min?: TemplateImageMinOrderByAggregateInput
    _sum?: TemplateImageSumOrderByAggregateInput
  }

  export type TemplateImageScalarWhereWithAggregatesInput = {
    AND?: TemplateImageScalarWhereWithAggregatesInput | TemplateImageScalarWhereWithAggregatesInput[]
    OR?: TemplateImageScalarWhereWithAggregatesInput[]
    NOT?: TemplateImageScalarWhereWithAggregatesInput | TemplateImageScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"TemplateImage"> | number
    templateId?: IntWithAggregatesFilter<"TemplateImage"> | number
    imageUrl?: StringWithAggregatesFilter<"TemplateImage"> | string
    imageType?: StringWithAggregatesFilter<"TemplateImage"> | string
    order?: IntWithAggregatesFilter<"TemplateImage"> | number
    caption?: StringNullableWithAggregatesFilter<"TemplateImage"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"TemplateImage"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TemplateImage"> | Date | string
  }

  export type TemplatePagesWhereInput = {
    AND?: TemplatePagesWhereInput | TemplatePagesWhereInput[]
    OR?: TemplatePagesWhereInput[]
    NOT?: TemplatePagesWhereInput | TemplatePagesWhereInput[]
    id?: IntFilter<"TemplatePages"> | number
    templateId?: IntFilter<"TemplatePages"> | number
    name?: StringFilter<"TemplatePages"> | string
    content?: StringNullableFilter<"TemplatePages"> | string | null
    order?: IntFilter<"TemplatePages"> | number
    settings?: JsonNullableFilter<"TemplatePages">
    linkingIdPrefix?: StringNullableFilter<"TemplatePages"> | string | null
    metadata?: JsonNullableFilter<"TemplatePages">
    createdAt?: DateTimeFilter<"TemplatePages"> | Date | string
    updatedAt?: DateTimeFilter<"TemplatePages"> | Date | string
    template?: XOR<TemplateRelationFilter, TemplateWhereInput>
  }

  export type TemplatePagesOrderByWithRelationInput = {
    id?: SortOrder
    templateId?: SortOrder
    name?: SortOrder
    content?: SortOrderInput | SortOrder
    order?: SortOrder
    settings?: SortOrderInput | SortOrder
    linkingIdPrefix?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    template?: TemplateOrderByWithRelationInput
  }

  export type TemplatePagesWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: TemplatePagesWhereInput | TemplatePagesWhereInput[]
    OR?: TemplatePagesWhereInput[]
    NOT?: TemplatePagesWhereInput | TemplatePagesWhereInput[]
    templateId?: IntFilter<"TemplatePages"> | number
    name?: StringFilter<"TemplatePages"> | string
    content?: StringNullableFilter<"TemplatePages"> | string | null
    order?: IntFilter<"TemplatePages"> | number
    settings?: JsonNullableFilter<"TemplatePages">
    linkingIdPrefix?: StringNullableFilter<"TemplatePages"> | string | null
    metadata?: JsonNullableFilter<"TemplatePages">
    createdAt?: DateTimeFilter<"TemplatePages"> | Date | string
    updatedAt?: DateTimeFilter<"TemplatePages"> | Date | string
    template?: XOR<TemplateRelationFilter, TemplateWhereInput>
  }, "id">

  export type TemplatePagesOrderByWithAggregationInput = {
    id?: SortOrder
    templateId?: SortOrder
    name?: SortOrder
    content?: SortOrderInput | SortOrder
    order?: SortOrder
    settings?: SortOrderInput | SortOrder
    linkingIdPrefix?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TemplatePagesCountOrderByAggregateInput
    _avg?: TemplatePagesAvgOrderByAggregateInput
    _max?: TemplatePagesMaxOrderByAggregateInput
    _min?: TemplatePagesMinOrderByAggregateInput
    _sum?: TemplatePagesSumOrderByAggregateInput
  }

  export type TemplatePagesScalarWhereWithAggregatesInput = {
    AND?: TemplatePagesScalarWhereWithAggregatesInput | TemplatePagesScalarWhereWithAggregatesInput[]
    OR?: TemplatePagesScalarWhereWithAggregatesInput[]
    NOT?: TemplatePagesScalarWhereWithAggregatesInput | TemplatePagesScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"TemplatePages"> | number
    templateId?: IntWithAggregatesFilter<"TemplatePages"> | number
    name?: StringWithAggregatesFilter<"TemplatePages"> | string
    content?: StringNullableWithAggregatesFilter<"TemplatePages"> | string | null
    order?: IntWithAggregatesFilter<"TemplatePages"> | number
    settings?: JsonNullableWithAggregatesFilter<"TemplatePages">
    linkingIdPrefix?: StringNullableWithAggregatesFilter<"TemplatePages"> | string | null
    metadata?: JsonNullableWithAggregatesFilter<"TemplatePages">
    createdAt?: DateTimeWithAggregatesFilter<"TemplatePages"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TemplatePages"> | Date | string
  }

  export type UserCreateInput = {
    email: string
    name?: string | null
    password: string
    passwordResetToken?: string | null
    passwordResetExpiresAt?: Date | string | null
    isAdmin?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    funnels?: FunnelCreateNestedManyWithoutUserInput
    domains?: DomainCreateNestedManyWithoutUserInput
    templates?: TemplateCreateNestedManyWithoutCreatedByInput
  }

  export type UserUncheckedCreateInput = {
    id?: number
    email: string
    name?: string | null
    password: string
    passwordResetToken?: string | null
    passwordResetExpiresAt?: Date | string | null
    isAdmin?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    funnels?: FunnelUncheckedCreateNestedManyWithoutUserInput
    domains?: DomainUncheckedCreateNestedManyWithoutUserInput
    templates?: TemplateUncheckedCreateNestedManyWithoutCreatedByInput
  }

  export type UserUpdateInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    passwordResetToken?: NullableStringFieldUpdateOperationsInput | string | null
    passwordResetExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    funnels?: FunnelUpdateManyWithoutUserNestedInput
    domains?: DomainUpdateManyWithoutUserNestedInput
    templates?: TemplateUpdateManyWithoutCreatedByNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    passwordResetToken?: NullableStringFieldUpdateOperationsInput | string | null
    passwordResetExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    funnels?: FunnelUncheckedUpdateManyWithoutUserNestedInput
    domains?: DomainUncheckedUpdateManyWithoutUserNestedInput
    templates?: TemplateUncheckedUpdateManyWithoutCreatedByNestedInput
  }

  export type UserCreateManyInput = {
    id?: number
    email: string
    name?: string | null
    password: string
    passwordResetToken?: string | null
    passwordResetExpiresAt?: Date | string | null
    isAdmin?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    passwordResetToken?: NullableStringFieldUpdateOperationsInput | string | null
    passwordResetExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    passwordResetToken?: NullableStringFieldUpdateOperationsInput | string | null
    passwordResetExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FunnelCreateInput = {
    name: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutFunnelsInput
    pages?: PageCreateNestedManyWithoutFunnelInput
    domainConnections?: FunnelDomainCreateNestedManyWithoutFunnelInput
    template?: TemplateCreateNestedOneWithoutFunnelsCreatedInput
  }

  export type FunnelUncheckedCreateInput = {
    id?: number
    name: string
    status?: string
    userId: number
    templateId?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pages?: PageUncheckedCreateNestedManyWithoutFunnelInput
    domainConnections?: FunnelDomainUncheckedCreateNestedManyWithoutFunnelInput
  }

  export type FunnelUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutFunnelsNestedInput
    pages?: PageUpdateManyWithoutFunnelNestedInput
    domainConnections?: FunnelDomainUpdateManyWithoutFunnelNestedInput
    template?: TemplateUpdateOneWithoutFunnelsCreatedNestedInput
  }

  export type FunnelUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    userId?: IntFieldUpdateOperationsInput | number
    templateId?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pages?: PageUncheckedUpdateManyWithoutFunnelNestedInput
    domainConnections?: FunnelDomainUncheckedUpdateManyWithoutFunnelNestedInput
  }

  export type FunnelCreateManyInput = {
    id?: number
    name: string
    status?: string
    userId: number
    templateId?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FunnelUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FunnelUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    userId?: IntFieldUpdateOperationsInput | number
    templateId?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DomainCreateInput = {
    hostname: string
    type: $Enums.DomainType
    status?: $Enums.DomainStatus
    sslStatus?: $Enums.SslStatus
    cloudflareHostnameId?: string | null
    cloudflareZoneId?: string | null
    cloudflareRecordId?: string | null
    verificationToken?: string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutDomainsInput
    funnelConnections?: FunnelDomainCreateNestedManyWithoutDomainInput
  }

  export type DomainUncheckedCreateInput = {
    id?: number
    hostname: string
    type: $Enums.DomainType
    status?: $Enums.DomainStatus
    sslStatus?: $Enums.SslStatus
    userId: number
    cloudflareHostnameId?: string | null
    cloudflareZoneId?: string | null
    cloudflareRecordId?: string | null
    verificationToken?: string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    funnelConnections?: FunnelDomainUncheckedCreateNestedManyWithoutDomainInput
  }

  export type DomainUpdateInput = {
    hostname?: StringFieldUpdateOperationsInput | string
    type?: EnumDomainTypeFieldUpdateOperationsInput | $Enums.DomainType
    status?: EnumDomainStatusFieldUpdateOperationsInput | $Enums.DomainStatus
    sslStatus?: EnumSslStatusFieldUpdateOperationsInput | $Enums.SslStatus
    cloudflareHostnameId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareZoneId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareRecordId?: NullableStringFieldUpdateOperationsInput | string | null
    verificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: NullableStringFieldUpdateOperationsInput | string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutDomainsNestedInput
    funnelConnections?: FunnelDomainUpdateManyWithoutDomainNestedInput
  }

  export type DomainUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    hostname?: StringFieldUpdateOperationsInput | string
    type?: EnumDomainTypeFieldUpdateOperationsInput | $Enums.DomainType
    status?: EnumDomainStatusFieldUpdateOperationsInput | $Enums.DomainStatus
    sslStatus?: EnumSslStatusFieldUpdateOperationsInput | $Enums.SslStatus
    userId?: IntFieldUpdateOperationsInput | number
    cloudflareHostnameId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareZoneId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareRecordId?: NullableStringFieldUpdateOperationsInput | string | null
    verificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: NullableStringFieldUpdateOperationsInput | string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    funnelConnections?: FunnelDomainUncheckedUpdateManyWithoutDomainNestedInput
  }

  export type DomainCreateManyInput = {
    id?: number
    hostname: string
    type: $Enums.DomainType
    status?: $Enums.DomainStatus
    sslStatus?: $Enums.SslStatus
    userId: number
    cloudflareHostnameId?: string | null
    cloudflareZoneId?: string | null
    cloudflareRecordId?: string | null
    verificationToken?: string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DomainUpdateManyMutationInput = {
    hostname?: StringFieldUpdateOperationsInput | string
    type?: EnumDomainTypeFieldUpdateOperationsInput | $Enums.DomainType
    status?: EnumDomainStatusFieldUpdateOperationsInput | $Enums.DomainStatus
    sslStatus?: EnumSslStatusFieldUpdateOperationsInput | $Enums.SslStatus
    cloudflareHostnameId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareZoneId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareRecordId?: NullableStringFieldUpdateOperationsInput | string | null
    verificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: NullableStringFieldUpdateOperationsInput | string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DomainUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    hostname?: StringFieldUpdateOperationsInput | string
    type?: EnumDomainTypeFieldUpdateOperationsInput | $Enums.DomainType
    status?: EnumDomainStatusFieldUpdateOperationsInput | $Enums.DomainStatus
    sslStatus?: EnumSslStatusFieldUpdateOperationsInput | $Enums.SslStatus
    userId?: IntFieldUpdateOperationsInput | number
    cloudflareHostnameId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareZoneId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareRecordId?: NullableStringFieldUpdateOperationsInput | string | null
    verificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: NullableStringFieldUpdateOperationsInput | string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FunnelDomainCreateInput = {
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    funnel: FunnelCreateNestedOneWithoutDomainConnectionsInput
    domain: DomainCreateNestedOneWithoutFunnelConnectionsInput
  }

  export type FunnelDomainUncheckedCreateInput = {
    id?: number
    funnelId: number
    domainId: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FunnelDomainUpdateInput = {
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    funnel?: FunnelUpdateOneRequiredWithoutDomainConnectionsNestedInput
    domain?: DomainUpdateOneRequiredWithoutFunnelConnectionsNestedInput
  }

  export type FunnelDomainUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    funnelId?: IntFieldUpdateOperationsInput | number
    domainId?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FunnelDomainCreateManyInput = {
    id?: number
    funnelId: number
    domainId: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FunnelDomainUpdateManyMutationInput = {
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FunnelDomainUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    funnelId?: IntFieldUpdateOperationsInput | number
    domainId?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PageCreateInput = {
    name: string
    content?: string | null
    order: number
    linkingId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    funnel: FunnelCreateNestedOneWithoutPagesInput
  }

  export type PageUncheckedCreateInput = {
    id?: number
    name: string
    content?: string | null
    order: number
    linkingId?: string | null
    funnelId: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PageUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    linkingId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    funnel?: FunnelUpdateOneRequiredWithoutPagesNestedInput
  }

  export type PageUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    linkingId?: NullableStringFieldUpdateOperationsInput | string | null
    funnelId?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PageCreateManyInput = {
    id?: number
    name: string
    content?: string | null
    order: number
    linkingId?: string | null
    funnelId: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PageUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    linkingId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PageUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    linkingId?: NullableStringFieldUpdateOperationsInput | string | null
    funnelId?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateCategoryCreateInput = {
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    order?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    templates?: TemplateCreateNestedManyWithoutCategoryInput
  }

  export type TemplateCategoryUncheckedCreateInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    order?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    templates?: TemplateUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type TemplateCategoryUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    templates?: TemplateUpdateManyWithoutCategoryNestedInput
  }

  export type TemplateCategoryUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    templates?: TemplateUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type TemplateCategoryCreateManyInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    order?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateCategoryUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateCategoryUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateCreateInput = {
    name: string
    slug: string
    description?: string | null
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    category: TemplateCategoryCreateNestedOneWithoutTemplatesInput
    previewImages?: TemplateImageCreateNestedManyWithoutTemplateInput
    pages?: TemplatePagesCreateNestedManyWithoutTemplateInput
    createdBy: UserCreateNestedOneWithoutTemplatesInput
    funnelsCreated?: FunnelCreateNestedManyWithoutTemplateInput
  }

  export type TemplateUncheckedCreateInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    categoryId: number
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    createdByUserId: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    previewImages?: TemplateImageUncheckedCreateNestedManyWithoutTemplateInput
    pages?: TemplatePagesUncheckedCreateNestedManyWithoutTemplateInput
    funnelsCreated?: FunnelUncheckedCreateNestedManyWithoutTemplateInput
  }

  export type TemplateUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: TemplateCategoryUpdateOneRequiredWithoutTemplatesNestedInput
    previewImages?: TemplateImageUpdateManyWithoutTemplateNestedInput
    pages?: TemplatePagesUpdateManyWithoutTemplateNestedInput
    createdBy?: UserUpdateOneRequiredWithoutTemplatesNestedInput
    funnelsCreated?: FunnelUpdateManyWithoutTemplateNestedInput
  }

  export type TemplateUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: IntFieldUpdateOperationsInput | number
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    createdByUserId?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    previewImages?: TemplateImageUncheckedUpdateManyWithoutTemplateNestedInput
    pages?: TemplatePagesUncheckedUpdateManyWithoutTemplateNestedInput
    funnelsCreated?: FunnelUncheckedUpdateManyWithoutTemplateNestedInput
  }

  export type TemplateCreateManyInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    categoryId: number
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    createdByUserId: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: IntFieldUpdateOperationsInput | number
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    createdByUserId?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateImageCreateInput = {
    imageUrl: string
    imageType: string
    order?: number
    caption?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    template: TemplateCreateNestedOneWithoutPreviewImagesInput
  }

  export type TemplateImageUncheckedCreateInput = {
    id?: number
    templateId: number
    imageUrl: string
    imageType: string
    order?: number
    caption?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateImageUpdateInput = {
    imageUrl?: StringFieldUpdateOperationsInput | string
    imageType?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    template?: TemplateUpdateOneRequiredWithoutPreviewImagesNestedInput
  }

  export type TemplateImageUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    templateId?: IntFieldUpdateOperationsInput | number
    imageUrl?: StringFieldUpdateOperationsInput | string
    imageType?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateImageCreateManyInput = {
    id?: number
    templateId: number
    imageUrl: string
    imageType: string
    order?: number
    caption?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateImageUpdateManyMutationInput = {
    imageUrl?: StringFieldUpdateOperationsInput | string
    imageType?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateImageUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    templateId?: IntFieldUpdateOperationsInput | number
    imageUrl?: StringFieldUpdateOperationsInput | string
    imageType?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplatePagesCreateInput = {
    name: string
    content?: string | null
    order: number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    template: TemplateCreateNestedOneWithoutPagesInput
  }

  export type TemplatePagesUncheckedCreateInput = {
    id?: number
    templateId: number
    name: string
    content?: string | null
    order: number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplatePagesUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    template?: TemplateUpdateOneRequiredWithoutPagesNestedInput
  }

  export type TemplatePagesUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    templateId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplatePagesCreateManyInput = {
    id?: number
    templateId: number
    name: string
    content?: string | null
    order: number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplatePagesUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplatePagesUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    templateId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type FunnelListRelationFilter = {
    every?: FunnelWhereInput
    some?: FunnelWhereInput
    none?: FunnelWhereInput
  }

  export type DomainListRelationFilter = {
    every?: DomainWhereInput
    some?: DomainWhereInput
    none?: DomainWhereInput
  }

  export type TemplateListRelationFilter = {
    every?: TemplateWhereInput
    some?: TemplateWhereInput
    none?: TemplateWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type FunnelOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type DomainOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TemplateOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    password?: SortOrder
    passwordResetToken?: SortOrder
    passwordResetExpiresAt?: SortOrder
    isAdmin?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    password?: SortOrder
    passwordResetToken?: SortOrder
    passwordResetExpiresAt?: SortOrder
    isAdmin?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    password?: SortOrder
    passwordResetToken?: SortOrder
    passwordResetExpiresAt?: SortOrder
    isAdmin?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type UserRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type PageListRelationFilter = {
    every?: PageWhereInput
    some?: PageWhereInput
    none?: PageWhereInput
  }

  export type FunnelDomainListRelationFilter = {
    every?: FunnelDomainWhereInput
    some?: FunnelDomainWhereInput
    none?: FunnelDomainWhereInput
  }

  export type TemplateNullableRelationFilter = {
    is?: TemplateWhereInput | null
    isNot?: TemplateWhereInput | null
  }

  export type PageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type FunnelDomainOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type FunnelCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    status?: SortOrder
    userId?: SortOrder
    templateId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FunnelAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    templateId?: SortOrder
  }

  export type FunnelMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    status?: SortOrder
    userId?: SortOrder
    templateId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FunnelMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    status?: SortOrder
    userId?: SortOrder
    templateId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FunnelSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    templateId?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumDomainTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.DomainType | EnumDomainTypeFieldRefInput<$PrismaModel>
    in?: $Enums.DomainType[] | ListEnumDomainTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.DomainType[] | ListEnumDomainTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumDomainTypeFilter<$PrismaModel> | $Enums.DomainType
  }

  export type EnumDomainStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.DomainStatus | EnumDomainStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DomainStatus[] | ListEnumDomainStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DomainStatus[] | ListEnumDomainStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDomainStatusFilter<$PrismaModel> | $Enums.DomainStatus
  }

  export type EnumSslStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SslStatus | EnumSslStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SslStatus[] | ListEnumSslStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SslStatus[] | ListEnumSslStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSslStatusFilter<$PrismaModel> | $Enums.SslStatus
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DomainCountOrderByAggregateInput = {
    id?: SortOrder
    hostname?: SortOrder
    type?: SortOrder
    status?: SortOrder
    sslStatus?: SortOrder
    userId?: SortOrder
    cloudflareHostnameId?: SortOrder
    cloudflareZoneId?: SortOrder
    cloudflareRecordId?: SortOrder
    verificationToken?: SortOrder
    ownershipVerification?: SortOrder
    dnsInstructions?: SortOrder
    sslCertificateId?: SortOrder
    sslValidationRecords?: SortOrder
    lastVerifiedAt?: SortOrder
    expiresAt?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DomainAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type DomainMaxOrderByAggregateInput = {
    id?: SortOrder
    hostname?: SortOrder
    type?: SortOrder
    status?: SortOrder
    sslStatus?: SortOrder
    userId?: SortOrder
    cloudflareHostnameId?: SortOrder
    cloudflareZoneId?: SortOrder
    cloudflareRecordId?: SortOrder
    verificationToken?: SortOrder
    sslCertificateId?: SortOrder
    lastVerifiedAt?: SortOrder
    expiresAt?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DomainMinOrderByAggregateInput = {
    id?: SortOrder
    hostname?: SortOrder
    type?: SortOrder
    status?: SortOrder
    sslStatus?: SortOrder
    userId?: SortOrder
    cloudflareHostnameId?: SortOrder
    cloudflareZoneId?: SortOrder
    cloudflareRecordId?: SortOrder
    verificationToken?: SortOrder
    sslCertificateId?: SortOrder
    lastVerifiedAt?: SortOrder
    expiresAt?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DomainSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type EnumDomainTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DomainType | EnumDomainTypeFieldRefInput<$PrismaModel>
    in?: $Enums.DomainType[] | ListEnumDomainTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.DomainType[] | ListEnumDomainTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumDomainTypeWithAggregatesFilter<$PrismaModel> | $Enums.DomainType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDomainTypeFilter<$PrismaModel>
    _max?: NestedEnumDomainTypeFilter<$PrismaModel>
  }

  export type EnumDomainStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DomainStatus | EnumDomainStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DomainStatus[] | ListEnumDomainStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DomainStatus[] | ListEnumDomainStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDomainStatusWithAggregatesFilter<$PrismaModel> | $Enums.DomainStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDomainStatusFilter<$PrismaModel>
    _max?: NestedEnumDomainStatusFilter<$PrismaModel>
  }

  export type EnumSslStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SslStatus | EnumSslStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SslStatus[] | ListEnumSslStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SslStatus[] | ListEnumSslStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSslStatusWithAggregatesFilter<$PrismaModel> | $Enums.SslStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSslStatusFilter<$PrismaModel>
    _max?: NestedEnumSslStatusFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type FunnelRelationFilter = {
    is?: FunnelWhereInput
    isNot?: FunnelWhereInput
  }

  export type DomainRelationFilter = {
    is?: DomainWhereInput
    isNot?: DomainWhereInput
  }

  export type FunnelDomainFunnelIdDomainIdCompoundUniqueInput = {
    funnelId: number
    domainId: number
  }

  export type FunnelDomainCountOrderByAggregateInput = {
    id?: SortOrder
    funnelId?: SortOrder
    domainId?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FunnelDomainAvgOrderByAggregateInput = {
    id?: SortOrder
    funnelId?: SortOrder
    domainId?: SortOrder
  }

  export type FunnelDomainMaxOrderByAggregateInput = {
    id?: SortOrder
    funnelId?: SortOrder
    domainId?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FunnelDomainMinOrderByAggregateInput = {
    id?: SortOrder
    funnelId?: SortOrder
    domainId?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FunnelDomainSumOrderByAggregateInput = {
    id?: SortOrder
    funnelId?: SortOrder
    domainId?: SortOrder
  }

  export type PageCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    content?: SortOrder
    order?: SortOrder
    linkingId?: SortOrder
    funnelId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PageAvgOrderByAggregateInput = {
    id?: SortOrder
    order?: SortOrder
    funnelId?: SortOrder
  }

  export type PageMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    content?: SortOrder
    order?: SortOrder
    linkingId?: SortOrder
    funnelId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PageMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    content?: SortOrder
    order?: SortOrder
    linkingId?: SortOrder
    funnelId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PageSumOrderByAggregateInput = {
    id?: SortOrder
    order?: SortOrder
    funnelId?: SortOrder
  }

  export type TemplateCategoryCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    icon?: SortOrder
    order?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateCategoryAvgOrderByAggregateInput = {
    id?: SortOrder
    order?: SortOrder
  }

  export type TemplateCategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    icon?: SortOrder
    order?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateCategoryMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    icon?: SortOrder
    order?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateCategorySumOrderByAggregateInput = {
    id?: SortOrder
    order?: SortOrder
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type TemplateCategoryRelationFilter = {
    is?: TemplateCategoryWhereInput
    isNot?: TemplateCategoryWhereInput
  }

  export type TemplateImageListRelationFilter = {
    every?: TemplateImageWhereInput
    some?: TemplateImageWhereInput
    none?: TemplateImageWhereInput
  }

  export type TemplatePagesListRelationFilter = {
    every?: TemplatePagesWhereInput
    some?: TemplatePagesWhereInput
    none?: TemplatePagesWhereInput
  }

  export type TemplateImageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TemplatePagesOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TemplateCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    categoryId?: SortOrder
    thumbnailImage?: SortOrder
    tags?: SortOrder
    usageCount?: SortOrder
    isActive?: SortOrder
    isPublic?: SortOrder
    createdByUserId?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateAvgOrderByAggregateInput = {
    id?: SortOrder
    categoryId?: SortOrder
    usageCount?: SortOrder
    createdByUserId?: SortOrder
  }

  export type TemplateMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    categoryId?: SortOrder
    thumbnailImage?: SortOrder
    usageCount?: SortOrder
    isActive?: SortOrder
    isPublic?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    categoryId?: SortOrder
    thumbnailImage?: SortOrder
    usageCount?: SortOrder
    isActive?: SortOrder
    isPublic?: SortOrder
    createdByUserId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateSumOrderByAggregateInput = {
    id?: SortOrder
    categoryId?: SortOrder
    usageCount?: SortOrder
    createdByUserId?: SortOrder
  }

  export type TemplateRelationFilter = {
    is?: TemplateWhereInput
    isNot?: TemplateWhereInput
  }

  export type TemplateImageCountOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    imageUrl?: SortOrder
    imageType?: SortOrder
    order?: SortOrder
    caption?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateImageAvgOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    order?: SortOrder
  }

  export type TemplateImageMaxOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    imageUrl?: SortOrder
    imageType?: SortOrder
    order?: SortOrder
    caption?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateImageMinOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    imageUrl?: SortOrder
    imageType?: SortOrder
    order?: SortOrder
    caption?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplateImageSumOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    order?: SortOrder
  }

  export type TemplatePagesCountOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    name?: SortOrder
    content?: SortOrder
    order?: SortOrder
    settings?: SortOrder
    linkingIdPrefix?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplatePagesAvgOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    order?: SortOrder
  }

  export type TemplatePagesMaxOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    name?: SortOrder
    content?: SortOrder
    order?: SortOrder
    linkingIdPrefix?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplatePagesMinOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    name?: SortOrder
    content?: SortOrder
    order?: SortOrder
    linkingIdPrefix?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TemplatePagesSumOrderByAggregateInput = {
    id?: SortOrder
    templateId?: SortOrder
    order?: SortOrder
  }

  export type FunnelCreateNestedManyWithoutUserInput = {
    create?: XOR<FunnelCreateWithoutUserInput, FunnelUncheckedCreateWithoutUserInput> | FunnelCreateWithoutUserInput[] | FunnelUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FunnelCreateOrConnectWithoutUserInput | FunnelCreateOrConnectWithoutUserInput[]
    createMany?: FunnelCreateManyUserInputEnvelope
    connect?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
  }

  export type DomainCreateNestedManyWithoutUserInput = {
    create?: XOR<DomainCreateWithoutUserInput, DomainUncheckedCreateWithoutUserInput> | DomainCreateWithoutUserInput[] | DomainUncheckedCreateWithoutUserInput[]
    connectOrCreate?: DomainCreateOrConnectWithoutUserInput | DomainCreateOrConnectWithoutUserInput[]
    createMany?: DomainCreateManyUserInputEnvelope
    connect?: DomainWhereUniqueInput | DomainWhereUniqueInput[]
  }

  export type TemplateCreateNestedManyWithoutCreatedByInput = {
    create?: XOR<TemplateCreateWithoutCreatedByInput, TemplateUncheckedCreateWithoutCreatedByInput> | TemplateCreateWithoutCreatedByInput[] | TemplateUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: TemplateCreateOrConnectWithoutCreatedByInput | TemplateCreateOrConnectWithoutCreatedByInput[]
    createMany?: TemplateCreateManyCreatedByInputEnvelope
    connect?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
  }

  export type FunnelUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<FunnelCreateWithoutUserInput, FunnelUncheckedCreateWithoutUserInput> | FunnelCreateWithoutUserInput[] | FunnelUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FunnelCreateOrConnectWithoutUserInput | FunnelCreateOrConnectWithoutUserInput[]
    createMany?: FunnelCreateManyUserInputEnvelope
    connect?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
  }

  export type DomainUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<DomainCreateWithoutUserInput, DomainUncheckedCreateWithoutUserInput> | DomainCreateWithoutUserInput[] | DomainUncheckedCreateWithoutUserInput[]
    connectOrCreate?: DomainCreateOrConnectWithoutUserInput | DomainCreateOrConnectWithoutUserInput[]
    createMany?: DomainCreateManyUserInputEnvelope
    connect?: DomainWhereUniqueInput | DomainWhereUniqueInput[]
  }

  export type TemplateUncheckedCreateNestedManyWithoutCreatedByInput = {
    create?: XOR<TemplateCreateWithoutCreatedByInput, TemplateUncheckedCreateWithoutCreatedByInput> | TemplateCreateWithoutCreatedByInput[] | TemplateUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: TemplateCreateOrConnectWithoutCreatedByInput | TemplateCreateOrConnectWithoutCreatedByInput[]
    createMany?: TemplateCreateManyCreatedByInputEnvelope
    connect?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type FunnelUpdateManyWithoutUserNestedInput = {
    create?: XOR<FunnelCreateWithoutUserInput, FunnelUncheckedCreateWithoutUserInput> | FunnelCreateWithoutUserInput[] | FunnelUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FunnelCreateOrConnectWithoutUserInput | FunnelCreateOrConnectWithoutUserInput[]
    upsert?: FunnelUpsertWithWhereUniqueWithoutUserInput | FunnelUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: FunnelCreateManyUserInputEnvelope
    set?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    disconnect?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    delete?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    connect?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    update?: FunnelUpdateWithWhereUniqueWithoutUserInput | FunnelUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: FunnelUpdateManyWithWhereWithoutUserInput | FunnelUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: FunnelScalarWhereInput | FunnelScalarWhereInput[]
  }

  export type DomainUpdateManyWithoutUserNestedInput = {
    create?: XOR<DomainCreateWithoutUserInput, DomainUncheckedCreateWithoutUserInput> | DomainCreateWithoutUserInput[] | DomainUncheckedCreateWithoutUserInput[]
    connectOrCreate?: DomainCreateOrConnectWithoutUserInput | DomainCreateOrConnectWithoutUserInput[]
    upsert?: DomainUpsertWithWhereUniqueWithoutUserInput | DomainUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: DomainCreateManyUserInputEnvelope
    set?: DomainWhereUniqueInput | DomainWhereUniqueInput[]
    disconnect?: DomainWhereUniqueInput | DomainWhereUniqueInput[]
    delete?: DomainWhereUniqueInput | DomainWhereUniqueInput[]
    connect?: DomainWhereUniqueInput | DomainWhereUniqueInput[]
    update?: DomainUpdateWithWhereUniqueWithoutUserInput | DomainUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: DomainUpdateManyWithWhereWithoutUserInput | DomainUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: DomainScalarWhereInput | DomainScalarWhereInput[]
  }

  export type TemplateUpdateManyWithoutCreatedByNestedInput = {
    create?: XOR<TemplateCreateWithoutCreatedByInput, TemplateUncheckedCreateWithoutCreatedByInput> | TemplateCreateWithoutCreatedByInput[] | TemplateUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: TemplateCreateOrConnectWithoutCreatedByInput | TemplateCreateOrConnectWithoutCreatedByInput[]
    upsert?: TemplateUpsertWithWhereUniqueWithoutCreatedByInput | TemplateUpsertWithWhereUniqueWithoutCreatedByInput[]
    createMany?: TemplateCreateManyCreatedByInputEnvelope
    set?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    disconnect?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    delete?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    connect?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    update?: TemplateUpdateWithWhereUniqueWithoutCreatedByInput | TemplateUpdateWithWhereUniqueWithoutCreatedByInput[]
    updateMany?: TemplateUpdateManyWithWhereWithoutCreatedByInput | TemplateUpdateManyWithWhereWithoutCreatedByInput[]
    deleteMany?: TemplateScalarWhereInput | TemplateScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type FunnelUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<FunnelCreateWithoutUserInput, FunnelUncheckedCreateWithoutUserInput> | FunnelCreateWithoutUserInput[] | FunnelUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FunnelCreateOrConnectWithoutUserInput | FunnelCreateOrConnectWithoutUserInput[]
    upsert?: FunnelUpsertWithWhereUniqueWithoutUserInput | FunnelUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: FunnelCreateManyUserInputEnvelope
    set?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    disconnect?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    delete?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    connect?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    update?: FunnelUpdateWithWhereUniqueWithoutUserInput | FunnelUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: FunnelUpdateManyWithWhereWithoutUserInput | FunnelUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: FunnelScalarWhereInput | FunnelScalarWhereInput[]
  }

  export type DomainUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<DomainCreateWithoutUserInput, DomainUncheckedCreateWithoutUserInput> | DomainCreateWithoutUserInput[] | DomainUncheckedCreateWithoutUserInput[]
    connectOrCreate?: DomainCreateOrConnectWithoutUserInput | DomainCreateOrConnectWithoutUserInput[]
    upsert?: DomainUpsertWithWhereUniqueWithoutUserInput | DomainUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: DomainCreateManyUserInputEnvelope
    set?: DomainWhereUniqueInput | DomainWhereUniqueInput[]
    disconnect?: DomainWhereUniqueInput | DomainWhereUniqueInput[]
    delete?: DomainWhereUniqueInput | DomainWhereUniqueInput[]
    connect?: DomainWhereUniqueInput | DomainWhereUniqueInput[]
    update?: DomainUpdateWithWhereUniqueWithoutUserInput | DomainUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: DomainUpdateManyWithWhereWithoutUserInput | DomainUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: DomainScalarWhereInput | DomainScalarWhereInput[]
  }

  export type TemplateUncheckedUpdateManyWithoutCreatedByNestedInput = {
    create?: XOR<TemplateCreateWithoutCreatedByInput, TemplateUncheckedCreateWithoutCreatedByInput> | TemplateCreateWithoutCreatedByInput[] | TemplateUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: TemplateCreateOrConnectWithoutCreatedByInput | TemplateCreateOrConnectWithoutCreatedByInput[]
    upsert?: TemplateUpsertWithWhereUniqueWithoutCreatedByInput | TemplateUpsertWithWhereUniqueWithoutCreatedByInput[]
    createMany?: TemplateCreateManyCreatedByInputEnvelope
    set?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    disconnect?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    delete?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    connect?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    update?: TemplateUpdateWithWhereUniqueWithoutCreatedByInput | TemplateUpdateWithWhereUniqueWithoutCreatedByInput[]
    updateMany?: TemplateUpdateManyWithWhereWithoutCreatedByInput | TemplateUpdateManyWithWhereWithoutCreatedByInput[]
    deleteMany?: TemplateScalarWhereInput | TemplateScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutFunnelsInput = {
    create?: XOR<UserCreateWithoutFunnelsInput, UserUncheckedCreateWithoutFunnelsInput>
    connectOrCreate?: UserCreateOrConnectWithoutFunnelsInput
    connect?: UserWhereUniqueInput
  }

  export type PageCreateNestedManyWithoutFunnelInput = {
    create?: XOR<PageCreateWithoutFunnelInput, PageUncheckedCreateWithoutFunnelInput> | PageCreateWithoutFunnelInput[] | PageUncheckedCreateWithoutFunnelInput[]
    connectOrCreate?: PageCreateOrConnectWithoutFunnelInput | PageCreateOrConnectWithoutFunnelInput[]
    createMany?: PageCreateManyFunnelInputEnvelope
    connect?: PageWhereUniqueInput | PageWhereUniqueInput[]
  }

  export type FunnelDomainCreateNestedManyWithoutFunnelInput = {
    create?: XOR<FunnelDomainCreateWithoutFunnelInput, FunnelDomainUncheckedCreateWithoutFunnelInput> | FunnelDomainCreateWithoutFunnelInput[] | FunnelDomainUncheckedCreateWithoutFunnelInput[]
    connectOrCreate?: FunnelDomainCreateOrConnectWithoutFunnelInput | FunnelDomainCreateOrConnectWithoutFunnelInput[]
    createMany?: FunnelDomainCreateManyFunnelInputEnvelope
    connect?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
  }

  export type TemplateCreateNestedOneWithoutFunnelsCreatedInput = {
    create?: XOR<TemplateCreateWithoutFunnelsCreatedInput, TemplateUncheckedCreateWithoutFunnelsCreatedInput>
    connectOrCreate?: TemplateCreateOrConnectWithoutFunnelsCreatedInput
    connect?: TemplateWhereUniqueInput
  }

  export type PageUncheckedCreateNestedManyWithoutFunnelInput = {
    create?: XOR<PageCreateWithoutFunnelInput, PageUncheckedCreateWithoutFunnelInput> | PageCreateWithoutFunnelInput[] | PageUncheckedCreateWithoutFunnelInput[]
    connectOrCreate?: PageCreateOrConnectWithoutFunnelInput | PageCreateOrConnectWithoutFunnelInput[]
    createMany?: PageCreateManyFunnelInputEnvelope
    connect?: PageWhereUniqueInput | PageWhereUniqueInput[]
  }

  export type FunnelDomainUncheckedCreateNestedManyWithoutFunnelInput = {
    create?: XOR<FunnelDomainCreateWithoutFunnelInput, FunnelDomainUncheckedCreateWithoutFunnelInput> | FunnelDomainCreateWithoutFunnelInput[] | FunnelDomainUncheckedCreateWithoutFunnelInput[]
    connectOrCreate?: FunnelDomainCreateOrConnectWithoutFunnelInput | FunnelDomainCreateOrConnectWithoutFunnelInput[]
    createMany?: FunnelDomainCreateManyFunnelInputEnvelope
    connect?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutFunnelsNestedInput = {
    create?: XOR<UserCreateWithoutFunnelsInput, UserUncheckedCreateWithoutFunnelsInput>
    connectOrCreate?: UserCreateOrConnectWithoutFunnelsInput
    upsert?: UserUpsertWithoutFunnelsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutFunnelsInput, UserUpdateWithoutFunnelsInput>, UserUncheckedUpdateWithoutFunnelsInput>
  }

  export type PageUpdateManyWithoutFunnelNestedInput = {
    create?: XOR<PageCreateWithoutFunnelInput, PageUncheckedCreateWithoutFunnelInput> | PageCreateWithoutFunnelInput[] | PageUncheckedCreateWithoutFunnelInput[]
    connectOrCreate?: PageCreateOrConnectWithoutFunnelInput | PageCreateOrConnectWithoutFunnelInput[]
    upsert?: PageUpsertWithWhereUniqueWithoutFunnelInput | PageUpsertWithWhereUniqueWithoutFunnelInput[]
    createMany?: PageCreateManyFunnelInputEnvelope
    set?: PageWhereUniqueInput | PageWhereUniqueInput[]
    disconnect?: PageWhereUniqueInput | PageWhereUniqueInput[]
    delete?: PageWhereUniqueInput | PageWhereUniqueInput[]
    connect?: PageWhereUniqueInput | PageWhereUniqueInput[]
    update?: PageUpdateWithWhereUniqueWithoutFunnelInput | PageUpdateWithWhereUniqueWithoutFunnelInput[]
    updateMany?: PageUpdateManyWithWhereWithoutFunnelInput | PageUpdateManyWithWhereWithoutFunnelInput[]
    deleteMany?: PageScalarWhereInput | PageScalarWhereInput[]
  }

  export type FunnelDomainUpdateManyWithoutFunnelNestedInput = {
    create?: XOR<FunnelDomainCreateWithoutFunnelInput, FunnelDomainUncheckedCreateWithoutFunnelInput> | FunnelDomainCreateWithoutFunnelInput[] | FunnelDomainUncheckedCreateWithoutFunnelInput[]
    connectOrCreate?: FunnelDomainCreateOrConnectWithoutFunnelInput | FunnelDomainCreateOrConnectWithoutFunnelInput[]
    upsert?: FunnelDomainUpsertWithWhereUniqueWithoutFunnelInput | FunnelDomainUpsertWithWhereUniqueWithoutFunnelInput[]
    createMany?: FunnelDomainCreateManyFunnelInputEnvelope
    set?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    disconnect?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    delete?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    connect?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    update?: FunnelDomainUpdateWithWhereUniqueWithoutFunnelInput | FunnelDomainUpdateWithWhereUniqueWithoutFunnelInput[]
    updateMany?: FunnelDomainUpdateManyWithWhereWithoutFunnelInput | FunnelDomainUpdateManyWithWhereWithoutFunnelInput[]
    deleteMany?: FunnelDomainScalarWhereInput | FunnelDomainScalarWhereInput[]
  }

  export type TemplateUpdateOneWithoutFunnelsCreatedNestedInput = {
    create?: XOR<TemplateCreateWithoutFunnelsCreatedInput, TemplateUncheckedCreateWithoutFunnelsCreatedInput>
    connectOrCreate?: TemplateCreateOrConnectWithoutFunnelsCreatedInput
    upsert?: TemplateUpsertWithoutFunnelsCreatedInput
    disconnect?: TemplateWhereInput | boolean
    delete?: TemplateWhereInput | boolean
    connect?: TemplateWhereUniqueInput
    update?: XOR<XOR<TemplateUpdateToOneWithWhereWithoutFunnelsCreatedInput, TemplateUpdateWithoutFunnelsCreatedInput>, TemplateUncheckedUpdateWithoutFunnelsCreatedInput>
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type PageUncheckedUpdateManyWithoutFunnelNestedInput = {
    create?: XOR<PageCreateWithoutFunnelInput, PageUncheckedCreateWithoutFunnelInput> | PageCreateWithoutFunnelInput[] | PageUncheckedCreateWithoutFunnelInput[]
    connectOrCreate?: PageCreateOrConnectWithoutFunnelInput | PageCreateOrConnectWithoutFunnelInput[]
    upsert?: PageUpsertWithWhereUniqueWithoutFunnelInput | PageUpsertWithWhereUniqueWithoutFunnelInput[]
    createMany?: PageCreateManyFunnelInputEnvelope
    set?: PageWhereUniqueInput | PageWhereUniqueInput[]
    disconnect?: PageWhereUniqueInput | PageWhereUniqueInput[]
    delete?: PageWhereUniqueInput | PageWhereUniqueInput[]
    connect?: PageWhereUniqueInput | PageWhereUniqueInput[]
    update?: PageUpdateWithWhereUniqueWithoutFunnelInput | PageUpdateWithWhereUniqueWithoutFunnelInput[]
    updateMany?: PageUpdateManyWithWhereWithoutFunnelInput | PageUpdateManyWithWhereWithoutFunnelInput[]
    deleteMany?: PageScalarWhereInput | PageScalarWhereInput[]
  }

  export type FunnelDomainUncheckedUpdateManyWithoutFunnelNestedInput = {
    create?: XOR<FunnelDomainCreateWithoutFunnelInput, FunnelDomainUncheckedCreateWithoutFunnelInput> | FunnelDomainCreateWithoutFunnelInput[] | FunnelDomainUncheckedCreateWithoutFunnelInput[]
    connectOrCreate?: FunnelDomainCreateOrConnectWithoutFunnelInput | FunnelDomainCreateOrConnectWithoutFunnelInput[]
    upsert?: FunnelDomainUpsertWithWhereUniqueWithoutFunnelInput | FunnelDomainUpsertWithWhereUniqueWithoutFunnelInput[]
    createMany?: FunnelDomainCreateManyFunnelInputEnvelope
    set?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    disconnect?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    delete?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    connect?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    update?: FunnelDomainUpdateWithWhereUniqueWithoutFunnelInput | FunnelDomainUpdateWithWhereUniqueWithoutFunnelInput[]
    updateMany?: FunnelDomainUpdateManyWithWhereWithoutFunnelInput | FunnelDomainUpdateManyWithWhereWithoutFunnelInput[]
    deleteMany?: FunnelDomainScalarWhereInput | FunnelDomainScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutDomainsInput = {
    create?: XOR<UserCreateWithoutDomainsInput, UserUncheckedCreateWithoutDomainsInput>
    connectOrCreate?: UserCreateOrConnectWithoutDomainsInput
    connect?: UserWhereUniqueInput
  }

  export type FunnelDomainCreateNestedManyWithoutDomainInput = {
    create?: XOR<FunnelDomainCreateWithoutDomainInput, FunnelDomainUncheckedCreateWithoutDomainInput> | FunnelDomainCreateWithoutDomainInput[] | FunnelDomainUncheckedCreateWithoutDomainInput[]
    connectOrCreate?: FunnelDomainCreateOrConnectWithoutDomainInput | FunnelDomainCreateOrConnectWithoutDomainInput[]
    createMany?: FunnelDomainCreateManyDomainInputEnvelope
    connect?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
  }

  export type FunnelDomainUncheckedCreateNestedManyWithoutDomainInput = {
    create?: XOR<FunnelDomainCreateWithoutDomainInput, FunnelDomainUncheckedCreateWithoutDomainInput> | FunnelDomainCreateWithoutDomainInput[] | FunnelDomainUncheckedCreateWithoutDomainInput[]
    connectOrCreate?: FunnelDomainCreateOrConnectWithoutDomainInput | FunnelDomainCreateOrConnectWithoutDomainInput[]
    createMany?: FunnelDomainCreateManyDomainInputEnvelope
    connect?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
  }

  export type EnumDomainTypeFieldUpdateOperationsInput = {
    set?: $Enums.DomainType
  }

  export type EnumDomainStatusFieldUpdateOperationsInput = {
    set?: $Enums.DomainStatus
  }

  export type EnumSslStatusFieldUpdateOperationsInput = {
    set?: $Enums.SslStatus
  }

  export type UserUpdateOneRequiredWithoutDomainsNestedInput = {
    create?: XOR<UserCreateWithoutDomainsInput, UserUncheckedCreateWithoutDomainsInput>
    connectOrCreate?: UserCreateOrConnectWithoutDomainsInput
    upsert?: UserUpsertWithoutDomainsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutDomainsInput, UserUpdateWithoutDomainsInput>, UserUncheckedUpdateWithoutDomainsInput>
  }

  export type FunnelDomainUpdateManyWithoutDomainNestedInput = {
    create?: XOR<FunnelDomainCreateWithoutDomainInput, FunnelDomainUncheckedCreateWithoutDomainInput> | FunnelDomainCreateWithoutDomainInput[] | FunnelDomainUncheckedCreateWithoutDomainInput[]
    connectOrCreate?: FunnelDomainCreateOrConnectWithoutDomainInput | FunnelDomainCreateOrConnectWithoutDomainInput[]
    upsert?: FunnelDomainUpsertWithWhereUniqueWithoutDomainInput | FunnelDomainUpsertWithWhereUniqueWithoutDomainInput[]
    createMany?: FunnelDomainCreateManyDomainInputEnvelope
    set?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    disconnect?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    delete?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    connect?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    update?: FunnelDomainUpdateWithWhereUniqueWithoutDomainInput | FunnelDomainUpdateWithWhereUniqueWithoutDomainInput[]
    updateMany?: FunnelDomainUpdateManyWithWhereWithoutDomainInput | FunnelDomainUpdateManyWithWhereWithoutDomainInput[]
    deleteMany?: FunnelDomainScalarWhereInput | FunnelDomainScalarWhereInput[]
  }

  export type FunnelDomainUncheckedUpdateManyWithoutDomainNestedInput = {
    create?: XOR<FunnelDomainCreateWithoutDomainInput, FunnelDomainUncheckedCreateWithoutDomainInput> | FunnelDomainCreateWithoutDomainInput[] | FunnelDomainUncheckedCreateWithoutDomainInput[]
    connectOrCreate?: FunnelDomainCreateOrConnectWithoutDomainInput | FunnelDomainCreateOrConnectWithoutDomainInput[]
    upsert?: FunnelDomainUpsertWithWhereUniqueWithoutDomainInput | FunnelDomainUpsertWithWhereUniqueWithoutDomainInput[]
    createMany?: FunnelDomainCreateManyDomainInputEnvelope
    set?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    disconnect?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    delete?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    connect?: FunnelDomainWhereUniqueInput | FunnelDomainWhereUniqueInput[]
    update?: FunnelDomainUpdateWithWhereUniqueWithoutDomainInput | FunnelDomainUpdateWithWhereUniqueWithoutDomainInput[]
    updateMany?: FunnelDomainUpdateManyWithWhereWithoutDomainInput | FunnelDomainUpdateManyWithWhereWithoutDomainInput[]
    deleteMany?: FunnelDomainScalarWhereInput | FunnelDomainScalarWhereInput[]
  }

  export type FunnelCreateNestedOneWithoutDomainConnectionsInput = {
    create?: XOR<FunnelCreateWithoutDomainConnectionsInput, FunnelUncheckedCreateWithoutDomainConnectionsInput>
    connectOrCreate?: FunnelCreateOrConnectWithoutDomainConnectionsInput
    connect?: FunnelWhereUniqueInput
  }

  export type DomainCreateNestedOneWithoutFunnelConnectionsInput = {
    create?: XOR<DomainCreateWithoutFunnelConnectionsInput, DomainUncheckedCreateWithoutFunnelConnectionsInput>
    connectOrCreate?: DomainCreateOrConnectWithoutFunnelConnectionsInput
    connect?: DomainWhereUniqueInput
  }

  export type FunnelUpdateOneRequiredWithoutDomainConnectionsNestedInput = {
    create?: XOR<FunnelCreateWithoutDomainConnectionsInput, FunnelUncheckedCreateWithoutDomainConnectionsInput>
    connectOrCreate?: FunnelCreateOrConnectWithoutDomainConnectionsInput
    upsert?: FunnelUpsertWithoutDomainConnectionsInput
    connect?: FunnelWhereUniqueInput
    update?: XOR<XOR<FunnelUpdateToOneWithWhereWithoutDomainConnectionsInput, FunnelUpdateWithoutDomainConnectionsInput>, FunnelUncheckedUpdateWithoutDomainConnectionsInput>
  }

  export type DomainUpdateOneRequiredWithoutFunnelConnectionsNestedInput = {
    create?: XOR<DomainCreateWithoutFunnelConnectionsInput, DomainUncheckedCreateWithoutFunnelConnectionsInput>
    connectOrCreate?: DomainCreateOrConnectWithoutFunnelConnectionsInput
    upsert?: DomainUpsertWithoutFunnelConnectionsInput
    connect?: DomainWhereUniqueInput
    update?: XOR<XOR<DomainUpdateToOneWithWhereWithoutFunnelConnectionsInput, DomainUpdateWithoutFunnelConnectionsInput>, DomainUncheckedUpdateWithoutFunnelConnectionsInput>
  }

  export type FunnelCreateNestedOneWithoutPagesInput = {
    create?: XOR<FunnelCreateWithoutPagesInput, FunnelUncheckedCreateWithoutPagesInput>
    connectOrCreate?: FunnelCreateOrConnectWithoutPagesInput
    connect?: FunnelWhereUniqueInput
  }

  export type FunnelUpdateOneRequiredWithoutPagesNestedInput = {
    create?: XOR<FunnelCreateWithoutPagesInput, FunnelUncheckedCreateWithoutPagesInput>
    connectOrCreate?: FunnelCreateOrConnectWithoutPagesInput
    upsert?: FunnelUpsertWithoutPagesInput
    connect?: FunnelWhereUniqueInput
    update?: XOR<XOR<FunnelUpdateToOneWithWhereWithoutPagesInput, FunnelUpdateWithoutPagesInput>, FunnelUncheckedUpdateWithoutPagesInput>
  }

  export type TemplateCreateNestedManyWithoutCategoryInput = {
    create?: XOR<TemplateCreateWithoutCategoryInput, TemplateUncheckedCreateWithoutCategoryInput> | TemplateCreateWithoutCategoryInput[] | TemplateUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: TemplateCreateOrConnectWithoutCategoryInput | TemplateCreateOrConnectWithoutCategoryInput[]
    createMany?: TemplateCreateManyCategoryInputEnvelope
    connect?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
  }

  export type TemplateUncheckedCreateNestedManyWithoutCategoryInput = {
    create?: XOR<TemplateCreateWithoutCategoryInput, TemplateUncheckedCreateWithoutCategoryInput> | TemplateCreateWithoutCategoryInput[] | TemplateUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: TemplateCreateOrConnectWithoutCategoryInput | TemplateCreateOrConnectWithoutCategoryInput[]
    createMany?: TemplateCreateManyCategoryInputEnvelope
    connect?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
  }

  export type TemplateUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<TemplateCreateWithoutCategoryInput, TemplateUncheckedCreateWithoutCategoryInput> | TemplateCreateWithoutCategoryInput[] | TemplateUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: TemplateCreateOrConnectWithoutCategoryInput | TemplateCreateOrConnectWithoutCategoryInput[]
    upsert?: TemplateUpsertWithWhereUniqueWithoutCategoryInput | TemplateUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: TemplateCreateManyCategoryInputEnvelope
    set?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    disconnect?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    delete?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    connect?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    update?: TemplateUpdateWithWhereUniqueWithoutCategoryInput | TemplateUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: TemplateUpdateManyWithWhereWithoutCategoryInput | TemplateUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: TemplateScalarWhereInput | TemplateScalarWhereInput[]
  }

  export type TemplateUncheckedUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<TemplateCreateWithoutCategoryInput, TemplateUncheckedCreateWithoutCategoryInput> | TemplateCreateWithoutCategoryInput[] | TemplateUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: TemplateCreateOrConnectWithoutCategoryInput | TemplateCreateOrConnectWithoutCategoryInput[]
    upsert?: TemplateUpsertWithWhereUniqueWithoutCategoryInput | TemplateUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: TemplateCreateManyCategoryInputEnvelope
    set?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    disconnect?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    delete?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    connect?: TemplateWhereUniqueInput | TemplateWhereUniqueInput[]
    update?: TemplateUpdateWithWhereUniqueWithoutCategoryInput | TemplateUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: TemplateUpdateManyWithWhereWithoutCategoryInput | TemplateUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: TemplateScalarWhereInput | TemplateScalarWhereInput[]
  }

  export type TemplateCreatetagsInput = {
    set: string[]
  }

  export type TemplateCategoryCreateNestedOneWithoutTemplatesInput = {
    create?: XOR<TemplateCategoryCreateWithoutTemplatesInput, TemplateCategoryUncheckedCreateWithoutTemplatesInput>
    connectOrCreate?: TemplateCategoryCreateOrConnectWithoutTemplatesInput
    connect?: TemplateCategoryWhereUniqueInput
  }

  export type TemplateImageCreateNestedManyWithoutTemplateInput = {
    create?: XOR<TemplateImageCreateWithoutTemplateInput, TemplateImageUncheckedCreateWithoutTemplateInput> | TemplateImageCreateWithoutTemplateInput[] | TemplateImageUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: TemplateImageCreateOrConnectWithoutTemplateInput | TemplateImageCreateOrConnectWithoutTemplateInput[]
    createMany?: TemplateImageCreateManyTemplateInputEnvelope
    connect?: TemplateImageWhereUniqueInput | TemplateImageWhereUniqueInput[]
  }

  export type TemplatePagesCreateNestedManyWithoutTemplateInput = {
    create?: XOR<TemplatePagesCreateWithoutTemplateInput, TemplatePagesUncheckedCreateWithoutTemplateInput> | TemplatePagesCreateWithoutTemplateInput[] | TemplatePagesUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: TemplatePagesCreateOrConnectWithoutTemplateInput | TemplatePagesCreateOrConnectWithoutTemplateInput[]
    createMany?: TemplatePagesCreateManyTemplateInputEnvelope
    connect?: TemplatePagesWhereUniqueInput | TemplatePagesWhereUniqueInput[]
  }

  export type UserCreateNestedOneWithoutTemplatesInput = {
    create?: XOR<UserCreateWithoutTemplatesInput, UserUncheckedCreateWithoutTemplatesInput>
    connectOrCreate?: UserCreateOrConnectWithoutTemplatesInput
    connect?: UserWhereUniqueInput
  }

  export type FunnelCreateNestedManyWithoutTemplateInput = {
    create?: XOR<FunnelCreateWithoutTemplateInput, FunnelUncheckedCreateWithoutTemplateInput> | FunnelCreateWithoutTemplateInput[] | FunnelUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: FunnelCreateOrConnectWithoutTemplateInput | FunnelCreateOrConnectWithoutTemplateInput[]
    createMany?: FunnelCreateManyTemplateInputEnvelope
    connect?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
  }

  export type TemplateImageUncheckedCreateNestedManyWithoutTemplateInput = {
    create?: XOR<TemplateImageCreateWithoutTemplateInput, TemplateImageUncheckedCreateWithoutTemplateInput> | TemplateImageCreateWithoutTemplateInput[] | TemplateImageUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: TemplateImageCreateOrConnectWithoutTemplateInput | TemplateImageCreateOrConnectWithoutTemplateInput[]
    createMany?: TemplateImageCreateManyTemplateInputEnvelope
    connect?: TemplateImageWhereUniqueInput | TemplateImageWhereUniqueInput[]
  }

  export type TemplatePagesUncheckedCreateNestedManyWithoutTemplateInput = {
    create?: XOR<TemplatePagesCreateWithoutTemplateInput, TemplatePagesUncheckedCreateWithoutTemplateInput> | TemplatePagesCreateWithoutTemplateInput[] | TemplatePagesUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: TemplatePagesCreateOrConnectWithoutTemplateInput | TemplatePagesCreateOrConnectWithoutTemplateInput[]
    createMany?: TemplatePagesCreateManyTemplateInputEnvelope
    connect?: TemplatePagesWhereUniqueInput | TemplatePagesWhereUniqueInput[]
  }

  export type FunnelUncheckedCreateNestedManyWithoutTemplateInput = {
    create?: XOR<FunnelCreateWithoutTemplateInput, FunnelUncheckedCreateWithoutTemplateInput> | FunnelCreateWithoutTemplateInput[] | FunnelUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: FunnelCreateOrConnectWithoutTemplateInput | FunnelCreateOrConnectWithoutTemplateInput[]
    createMany?: FunnelCreateManyTemplateInputEnvelope
    connect?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
  }

  export type TemplateUpdatetagsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type TemplateCategoryUpdateOneRequiredWithoutTemplatesNestedInput = {
    create?: XOR<TemplateCategoryCreateWithoutTemplatesInput, TemplateCategoryUncheckedCreateWithoutTemplatesInput>
    connectOrCreate?: TemplateCategoryCreateOrConnectWithoutTemplatesInput
    upsert?: TemplateCategoryUpsertWithoutTemplatesInput
    connect?: TemplateCategoryWhereUniqueInput
    update?: XOR<XOR<TemplateCategoryUpdateToOneWithWhereWithoutTemplatesInput, TemplateCategoryUpdateWithoutTemplatesInput>, TemplateCategoryUncheckedUpdateWithoutTemplatesInput>
  }

  export type TemplateImageUpdateManyWithoutTemplateNestedInput = {
    create?: XOR<TemplateImageCreateWithoutTemplateInput, TemplateImageUncheckedCreateWithoutTemplateInput> | TemplateImageCreateWithoutTemplateInput[] | TemplateImageUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: TemplateImageCreateOrConnectWithoutTemplateInput | TemplateImageCreateOrConnectWithoutTemplateInput[]
    upsert?: TemplateImageUpsertWithWhereUniqueWithoutTemplateInput | TemplateImageUpsertWithWhereUniqueWithoutTemplateInput[]
    createMany?: TemplateImageCreateManyTemplateInputEnvelope
    set?: TemplateImageWhereUniqueInput | TemplateImageWhereUniqueInput[]
    disconnect?: TemplateImageWhereUniqueInput | TemplateImageWhereUniqueInput[]
    delete?: TemplateImageWhereUniqueInput | TemplateImageWhereUniqueInput[]
    connect?: TemplateImageWhereUniqueInput | TemplateImageWhereUniqueInput[]
    update?: TemplateImageUpdateWithWhereUniqueWithoutTemplateInput | TemplateImageUpdateWithWhereUniqueWithoutTemplateInput[]
    updateMany?: TemplateImageUpdateManyWithWhereWithoutTemplateInput | TemplateImageUpdateManyWithWhereWithoutTemplateInput[]
    deleteMany?: TemplateImageScalarWhereInput | TemplateImageScalarWhereInput[]
  }

  export type TemplatePagesUpdateManyWithoutTemplateNestedInput = {
    create?: XOR<TemplatePagesCreateWithoutTemplateInput, TemplatePagesUncheckedCreateWithoutTemplateInput> | TemplatePagesCreateWithoutTemplateInput[] | TemplatePagesUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: TemplatePagesCreateOrConnectWithoutTemplateInput | TemplatePagesCreateOrConnectWithoutTemplateInput[]
    upsert?: TemplatePagesUpsertWithWhereUniqueWithoutTemplateInput | TemplatePagesUpsertWithWhereUniqueWithoutTemplateInput[]
    createMany?: TemplatePagesCreateManyTemplateInputEnvelope
    set?: TemplatePagesWhereUniqueInput | TemplatePagesWhereUniqueInput[]
    disconnect?: TemplatePagesWhereUniqueInput | TemplatePagesWhereUniqueInput[]
    delete?: TemplatePagesWhereUniqueInput | TemplatePagesWhereUniqueInput[]
    connect?: TemplatePagesWhereUniqueInput | TemplatePagesWhereUniqueInput[]
    update?: TemplatePagesUpdateWithWhereUniqueWithoutTemplateInput | TemplatePagesUpdateWithWhereUniqueWithoutTemplateInput[]
    updateMany?: TemplatePagesUpdateManyWithWhereWithoutTemplateInput | TemplatePagesUpdateManyWithWhereWithoutTemplateInput[]
    deleteMany?: TemplatePagesScalarWhereInput | TemplatePagesScalarWhereInput[]
  }

  export type UserUpdateOneRequiredWithoutTemplatesNestedInput = {
    create?: XOR<UserCreateWithoutTemplatesInput, UserUncheckedCreateWithoutTemplatesInput>
    connectOrCreate?: UserCreateOrConnectWithoutTemplatesInput
    upsert?: UserUpsertWithoutTemplatesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutTemplatesInput, UserUpdateWithoutTemplatesInput>, UserUncheckedUpdateWithoutTemplatesInput>
  }

  export type FunnelUpdateManyWithoutTemplateNestedInput = {
    create?: XOR<FunnelCreateWithoutTemplateInput, FunnelUncheckedCreateWithoutTemplateInput> | FunnelCreateWithoutTemplateInput[] | FunnelUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: FunnelCreateOrConnectWithoutTemplateInput | FunnelCreateOrConnectWithoutTemplateInput[]
    upsert?: FunnelUpsertWithWhereUniqueWithoutTemplateInput | FunnelUpsertWithWhereUniqueWithoutTemplateInput[]
    createMany?: FunnelCreateManyTemplateInputEnvelope
    set?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    disconnect?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    delete?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    connect?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    update?: FunnelUpdateWithWhereUniqueWithoutTemplateInput | FunnelUpdateWithWhereUniqueWithoutTemplateInput[]
    updateMany?: FunnelUpdateManyWithWhereWithoutTemplateInput | FunnelUpdateManyWithWhereWithoutTemplateInput[]
    deleteMany?: FunnelScalarWhereInput | FunnelScalarWhereInput[]
  }

  export type TemplateImageUncheckedUpdateManyWithoutTemplateNestedInput = {
    create?: XOR<TemplateImageCreateWithoutTemplateInput, TemplateImageUncheckedCreateWithoutTemplateInput> | TemplateImageCreateWithoutTemplateInput[] | TemplateImageUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: TemplateImageCreateOrConnectWithoutTemplateInput | TemplateImageCreateOrConnectWithoutTemplateInput[]
    upsert?: TemplateImageUpsertWithWhereUniqueWithoutTemplateInput | TemplateImageUpsertWithWhereUniqueWithoutTemplateInput[]
    createMany?: TemplateImageCreateManyTemplateInputEnvelope
    set?: TemplateImageWhereUniqueInput | TemplateImageWhereUniqueInput[]
    disconnect?: TemplateImageWhereUniqueInput | TemplateImageWhereUniqueInput[]
    delete?: TemplateImageWhereUniqueInput | TemplateImageWhereUniqueInput[]
    connect?: TemplateImageWhereUniqueInput | TemplateImageWhereUniqueInput[]
    update?: TemplateImageUpdateWithWhereUniqueWithoutTemplateInput | TemplateImageUpdateWithWhereUniqueWithoutTemplateInput[]
    updateMany?: TemplateImageUpdateManyWithWhereWithoutTemplateInput | TemplateImageUpdateManyWithWhereWithoutTemplateInput[]
    deleteMany?: TemplateImageScalarWhereInput | TemplateImageScalarWhereInput[]
  }

  export type TemplatePagesUncheckedUpdateManyWithoutTemplateNestedInput = {
    create?: XOR<TemplatePagesCreateWithoutTemplateInput, TemplatePagesUncheckedCreateWithoutTemplateInput> | TemplatePagesCreateWithoutTemplateInput[] | TemplatePagesUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: TemplatePagesCreateOrConnectWithoutTemplateInput | TemplatePagesCreateOrConnectWithoutTemplateInput[]
    upsert?: TemplatePagesUpsertWithWhereUniqueWithoutTemplateInput | TemplatePagesUpsertWithWhereUniqueWithoutTemplateInput[]
    createMany?: TemplatePagesCreateManyTemplateInputEnvelope
    set?: TemplatePagesWhereUniqueInput | TemplatePagesWhereUniqueInput[]
    disconnect?: TemplatePagesWhereUniqueInput | TemplatePagesWhereUniqueInput[]
    delete?: TemplatePagesWhereUniqueInput | TemplatePagesWhereUniqueInput[]
    connect?: TemplatePagesWhereUniqueInput | TemplatePagesWhereUniqueInput[]
    update?: TemplatePagesUpdateWithWhereUniqueWithoutTemplateInput | TemplatePagesUpdateWithWhereUniqueWithoutTemplateInput[]
    updateMany?: TemplatePagesUpdateManyWithWhereWithoutTemplateInput | TemplatePagesUpdateManyWithWhereWithoutTemplateInput[]
    deleteMany?: TemplatePagesScalarWhereInput | TemplatePagesScalarWhereInput[]
  }

  export type FunnelUncheckedUpdateManyWithoutTemplateNestedInput = {
    create?: XOR<FunnelCreateWithoutTemplateInput, FunnelUncheckedCreateWithoutTemplateInput> | FunnelCreateWithoutTemplateInput[] | FunnelUncheckedCreateWithoutTemplateInput[]
    connectOrCreate?: FunnelCreateOrConnectWithoutTemplateInput | FunnelCreateOrConnectWithoutTemplateInput[]
    upsert?: FunnelUpsertWithWhereUniqueWithoutTemplateInput | FunnelUpsertWithWhereUniqueWithoutTemplateInput[]
    createMany?: FunnelCreateManyTemplateInputEnvelope
    set?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    disconnect?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    delete?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    connect?: FunnelWhereUniqueInput | FunnelWhereUniqueInput[]
    update?: FunnelUpdateWithWhereUniqueWithoutTemplateInput | FunnelUpdateWithWhereUniqueWithoutTemplateInput[]
    updateMany?: FunnelUpdateManyWithWhereWithoutTemplateInput | FunnelUpdateManyWithWhereWithoutTemplateInput[]
    deleteMany?: FunnelScalarWhereInput | FunnelScalarWhereInput[]
  }

  export type TemplateCreateNestedOneWithoutPreviewImagesInput = {
    create?: XOR<TemplateCreateWithoutPreviewImagesInput, TemplateUncheckedCreateWithoutPreviewImagesInput>
    connectOrCreate?: TemplateCreateOrConnectWithoutPreviewImagesInput
    connect?: TemplateWhereUniqueInput
  }

  export type TemplateUpdateOneRequiredWithoutPreviewImagesNestedInput = {
    create?: XOR<TemplateCreateWithoutPreviewImagesInput, TemplateUncheckedCreateWithoutPreviewImagesInput>
    connectOrCreate?: TemplateCreateOrConnectWithoutPreviewImagesInput
    upsert?: TemplateUpsertWithoutPreviewImagesInput
    connect?: TemplateWhereUniqueInput
    update?: XOR<XOR<TemplateUpdateToOneWithWhereWithoutPreviewImagesInput, TemplateUpdateWithoutPreviewImagesInput>, TemplateUncheckedUpdateWithoutPreviewImagesInput>
  }

  export type TemplateCreateNestedOneWithoutPagesInput = {
    create?: XOR<TemplateCreateWithoutPagesInput, TemplateUncheckedCreateWithoutPagesInput>
    connectOrCreate?: TemplateCreateOrConnectWithoutPagesInput
    connect?: TemplateWhereUniqueInput
  }

  export type TemplateUpdateOneRequiredWithoutPagesNestedInput = {
    create?: XOR<TemplateCreateWithoutPagesInput, TemplateUncheckedCreateWithoutPagesInput>
    connectOrCreate?: TemplateCreateOrConnectWithoutPagesInput
    upsert?: TemplateUpsertWithoutPagesInput
    connect?: TemplateWhereUniqueInput
    update?: XOR<XOR<TemplateUpdateToOneWithWhereWithoutPagesInput, TemplateUpdateWithoutPagesInput>, TemplateUncheckedUpdateWithoutPagesInput>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumDomainTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.DomainType | EnumDomainTypeFieldRefInput<$PrismaModel>
    in?: $Enums.DomainType[] | ListEnumDomainTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.DomainType[] | ListEnumDomainTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumDomainTypeFilter<$PrismaModel> | $Enums.DomainType
  }

  export type NestedEnumDomainStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.DomainStatus | EnumDomainStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DomainStatus[] | ListEnumDomainStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DomainStatus[] | ListEnumDomainStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDomainStatusFilter<$PrismaModel> | $Enums.DomainStatus
  }

  export type NestedEnumSslStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SslStatus | EnumSslStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SslStatus[] | ListEnumSslStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SslStatus[] | ListEnumSslStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSslStatusFilter<$PrismaModel> | $Enums.SslStatus
  }

  export type NestedEnumDomainTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DomainType | EnumDomainTypeFieldRefInput<$PrismaModel>
    in?: $Enums.DomainType[] | ListEnumDomainTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.DomainType[] | ListEnumDomainTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumDomainTypeWithAggregatesFilter<$PrismaModel> | $Enums.DomainType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDomainTypeFilter<$PrismaModel>
    _max?: NestedEnumDomainTypeFilter<$PrismaModel>
  }

  export type NestedEnumDomainStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DomainStatus | EnumDomainStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DomainStatus[] | ListEnumDomainStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DomainStatus[] | ListEnumDomainStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDomainStatusWithAggregatesFilter<$PrismaModel> | $Enums.DomainStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDomainStatusFilter<$PrismaModel>
    _max?: NestedEnumDomainStatusFilter<$PrismaModel>
  }

  export type NestedEnumSslStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SslStatus | EnumSslStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SslStatus[] | ListEnumSslStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SslStatus[] | ListEnumSslStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSslStatusWithAggregatesFilter<$PrismaModel> | $Enums.SslStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSslStatusFilter<$PrismaModel>
    _max?: NestedEnumSslStatusFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type FunnelCreateWithoutUserInput = {
    name: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    pages?: PageCreateNestedManyWithoutFunnelInput
    domainConnections?: FunnelDomainCreateNestedManyWithoutFunnelInput
    template?: TemplateCreateNestedOneWithoutFunnelsCreatedInput
  }

  export type FunnelUncheckedCreateWithoutUserInput = {
    id?: number
    name: string
    status?: string
    templateId?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pages?: PageUncheckedCreateNestedManyWithoutFunnelInput
    domainConnections?: FunnelDomainUncheckedCreateNestedManyWithoutFunnelInput
  }

  export type FunnelCreateOrConnectWithoutUserInput = {
    where: FunnelWhereUniqueInput
    create: XOR<FunnelCreateWithoutUserInput, FunnelUncheckedCreateWithoutUserInput>
  }

  export type FunnelCreateManyUserInputEnvelope = {
    data: FunnelCreateManyUserInput | FunnelCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type DomainCreateWithoutUserInput = {
    hostname: string
    type: $Enums.DomainType
    status?: $Enums.DomainStatus
    sslStatus?: $Enums.SslStatus
    cloudflareHostnameId?: string | null
    cloudflareZoneId?: string | null
    cloudflareRecordId?: string | null
    verificationToken?: string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    funnelConnections?: FunnelDomainCreateNestedManyWithoutDomainInput
  }

  export type DomainUncheckedCreateWithoutUserInput = {
    id?: number
    hostname: string
    type: $Enums.DomainType
    status?: $Enums.DomainStatus
    sslStatus?: $Enums.SslStatus
    cloudflareHostnameId?: string | null
    cloudflareZoneId?: string | null
    cloudflareRecordId?: string | null
    verificationToken?: string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    funnelConnections?: FunnelDomainUncheckedCreateNestedManyWithoutDomainInput
  }

  export type DomainCreateOrConnectWithoutUserInput = {
    where: DomainWhereUniqueInput
    create: XOR<DomainCreateWithoutUserInput, DomainUncheckedCreateWithoutUserInput>
  }

  export type DomainCreateManyUserInputEnvelope = {
    data: DomainCreateManyUserInput | DomainCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type TemplateCreateWithoutCreatedByInput = {
    name: string
    slug: string
    description?: string | null
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    category: TemplateCategoryCreateNestedOneWithoutTemplatesInput
    previewImages?: TemplateImageCreateNestedManyWithoutTemplateInput
    pages?: TemplatePagesCreateNestedManyWithoutTemplateInput
    funnelsCreated?: FunnelCreateNestedManyWithoutTemplateInput
  }

  export type TemplateUncheckedCreateWithoutCreatedByInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    categoryId: number
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    previewImages?: TemplateImageUncheckedCreateNestedManyWithoutTemplateInput
    pages?: TemplatePagesUncheckedCreateNestedManyWithoutTemplateInput
    funnelsCreated?: FunnelUncheckedCreateNestedManyWithoutTemplateInput
  }

  export type TemplateCreateOrConnectWithoutCreatedByInput = {
    where: TemplateWhereUniqueInput
    create: XOR<TemplateCreateWithoutCreatedByInput, TemplateUncheckedCreateWithoutCreatedByInput>
  }

  export type TemplateCreateManyCreatedByInputEnvelope = {
    data: TemplateCreateManyCreatedByInput | TemplateCreateManyCreatedByInput[]
    skipDuplicates?: boolean
  }

  export type FunnelUpsertWithWhereUniqueWithoutUserInput = {
    where: FunnelWhereUniqueInput
    update: XOR<FunnelUpdateWithoutUserInput, FunnelUncheckedUpdateWithoutUserInput>
    create: XOR<FunnelCreateWithoutUserInput, FunnelUncheckedCreateWithoutUserInput>
  }

  export type FunnelUpdateWithWhereUniqueWithoutUserInput = {
    where: FunnelWhereUniqueInput
    data: XOR<FunnelUpdateWithoutUserInput, FunnelUncheckedUpdateWithoutUserInput>
  }

  export type FunnelUpdateManyWithWhereWithoutUserInput = {
    where: FunnelScalarWhereInput
    data: XOR<FunnelUpdateManyMutationInput, FunnelUncheckedUpdateManyWithoutUserInput>
  }

  export type FunnelScalarWhereInput = {
    AND?: FunnelScalarWhereInput | FunnelScalarWhereInput[]
    OR?: FunnelScalarWhereInput[]
    NOT?: FunnelScalarWhereInput | FunnelScalarWhereInput[]
    id?: IntFilter<"Funnel"> | number
    name?: StringFilter<"Funnel"> | string
    status?: StringFilter<"Funnel"> | string
    userId?: IntFilter<"Funnel"> | number
    templateId?: IntNullableFilter<"Funnel"> | number | null
    createdAt?: DateTimeFilter<"Funnel"> | Date | string
    updatedAt?: DateTimeFilter<"Funnel"> | Date | string
  }

  export type DomainUpsertWithWhereUniqueWithoutUserInput = {
    where: DomainWhereUniqueInput
    update: XOR<DomainUpdateWithoutUserInput, DomainUncheckedUpdateWithoutUserInput>
    create: XOR<DomainCreateWithoutUserInput, DomainUncheckedCreateWithoutUserInput>
  }

  export type DomainUpdateWithWhereUniqueWithoutUserInput = {
    where: DomainWhereUniqueInput
    data: XOR<DomainUpdateWithoutUserInput, DomainUncheckedUpdateWithoutUserInput>
  }

  export type DomainUpdateManyWithWhereWithoutUserInput = {
    where: DomainScalarWhereInput
    data: XOR<DomainUpdateManyMutationInput, DomainUncheckedUpdateManyWithoutUserInput>
  }

  export type DomainScalarWhereInput = {
    AND?: DomainScalarWhereInput | DomainScalarWhereInput[]
    OR?: DomainScalarWhereInput[]
    NOT?: DomainScalarWhereInput | DomainScalarWhereInput[]
    id?: IntFilter<"Domain"> | number
    hostname?: StringFilter<"Domain"> | string
    type?: EnumDomainTypeFilter<"Domain"> | $Enums.DomainType
    status?: EnumDomainStatusFilter<"Domain"> | $Enums.DomainStatus
    sslStatus?: EnumSslStatusFilter<"Domain"> | $Enums.SslStatus
    userId?: IntFilter<"Domain"> | number
    cloudflareHostnameId?: StringNullableFilter<"Domain"> | string | null
    cloudflareZoneId?: StringNullableFilter<"Domain"> | string | null
    cloudflareRecordId?: StringNullableFilter<"Domain"> | string | null
    verificationToken?: StringNullableFilter<"Domain"> | string | null
    ownershipVerification?: JsonNullableFilter<"Domain">
    dnsInstructions?: JsonNullableFilter<"Domain">
    sslCertificateId?: StringNullableFilter<"Domain"> | string | null
    sslValidationRecords?: JsonNullableFilter<"Domain">
    lastVerifiedAt?: DateTimeNullableFilter<"Domain"> | Date | string | null
    expiresAt?: DateTimeNullableFilter<"Domain"> | Date | string | null
    notes?: StringNullableFilter<"Domain"> | string | null
    createdAt?: DateTimeFilter<"Domain"> | Date | string
    updatedAt?: DateTimeFilter<"Domain"> | Date | string
  }

  export type TemplateUpsertWithWhereUniqueWithoutCreatedByInput = {
    where: TemplateWhereUniqueInput
    update: XOR<TemplateUpdateWithoutCreatedByInput, TemplateUncheckedUpdateWithoutCreatedByInput>
    create: XOR<TemplateCreateWithoutCreatedByInput, TemplateUncheckedCreateWithoutCreatedByInput>
  }

  export type TemplateUpdateWithWhereUniqueWithoutCreatedByInput = {
    where: TemplateWhereUniqueInput
    data: XOR<TemplateUpdateWithoutCreatedByInput, TemplateUncheckedUpdateWithoutCreatedByInput>
  }

  export type TemplateUpdateManyWithWhereWithoutCreatedByInput = {
    where: TemplateScalarWhereInput
    data: XOR<TemplateUpdateManyMutationInput, TemplateUncheckedUpdateManyWithoutCreatedByInput>
  }

  export type TemplateScalarWhereInput = {
    AND?: TemplateScalarWhereInput | TemplateScalarWhereInput[]
    OR?: TemplateScalarWhereInput[]
    NOT?: TemplateScalarWhereInput | TemplateScalarWhereInput[]
    id?: IntFilter<"Template"> | number
    name?: StringFilter<"Template"> | string
    slug?: StringFilter<"Template"> | string
    description?: StringNullableFilter<"Template"> | string | null
    categoryId?: IntFilter<"Template"> | number
    thumbnailImage?: StringNullableFilter<"Template"> | string | null
    tags?: StringNullableListFilter<"Template">
    usageCount?: IntFilter<"Template"> | number
    isActive?: BoolFilter<"Template"> | boolean
    isPublic?: BoolFilter<"Template"> | boolean
    createdByUserId?: IntFilter<"Template"> | number
    metadata?: JsonNullableFilter<"Template">
    createdAt?: DateTimeFilter<"Template"> | Date | string
    updatedAt?: DateTimeFilter<"Template"> | Date | string
  }

  export type UserCreateWithoutFunnelsInput = {
    email: string
    name?: string | null
    password: string
    passwordResetToken?: string | null
    passwordResetExpiresAt?: Date | string | null
    isAdmin?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    domains?: DomainCreateNestedManyWithoutUserInput
    templates?: TemplateCreateNestedManyWithoutCreatedByInput
  }

  export type UserUncheckedCreateWithoutFunnelsInput = {
    id?: number
    email: string
    name?: string | null
    password: string
    passwordResetToken?: string | null
    passwordResetExpiresAt?: Date | string | null
    isAdmin?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    domains?: DomainUncheckedCreateNestedManyWithoutUserInput
    templates?: TemplateUncheckedCreateNestedManyWithoutCreatedByInput
  }

  export type UserCreateOrConnectWithoutFunnelsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutFunnelsInput, UserUncheckedCreateWithoutFunnelsInput>
  }

  export type PageCreateWithoutFunnelInput = {
    name: string
    content?: string | null
    order: number
    linkingId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PageUncheckedCreateWithoutFunnelInput = {
    id?: number
    name: string
    content?: string | null
    order: number
    linkingId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PageCreateOrConnectWithoutFunnelInput = {
    where: PageWhereUniqueInput
    create: XOR<PageCreateWithoutFunnelInput, PageUncheckedCreateWithoutFunnelInput>
  }

  export type PageCreateManyFunnelInputEnvelope = {
    data: PageCreateManyFunnelInput | PageCreateManyFunnelInput[]
    skipDuplicates?: boolean
  }

  export type FunnelDomainCreateWithoutFunnelInput = {
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    domain: DomainCreateNestedOneWithoutFunnelConnectionsInput
  }

  export type FunnelDomainUncheckedCreateWithoutFunnelInput = {
    id?: number
    domainId: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FunnelDomainCreateOrConnectWithoutFunnelInput = {
    where: FunnelDomainWhereUniqueInput
    create: XOR<FunnelDomainCreateWithoutFunnelInput, FunnelDomainUncheckedCreateWithoutFunnelInput>
  }

  export type FunnelDomainCreateManyFunnelInputEnvelope = {
    data: FunnelDomainCreateManyFunnelInput | FunnelDomainCreateManyFunnelInput[]
    skipDuplicates?: boolean
  }

  export type TemplateCreateWithoutFunnelsCreatedInput = {
    name: string
    slug: string
    description?: string | null
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    category: TemplateCategoryCreateNestedOneWithoutTemplatesInput
    previewImages?: TemplateImageCreateNestedManyWithoutTemplateInput
    pages?: TemplatePagesCreateNestedManyWithoutTemplateInput
    createdBy: UserCreateNestedOneWithoutTemplatesInput
  }

  export type TemplateUncheckedCreateWithoutFunnelsCreatedInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    categoryId: number
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    createdByUserId: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    previewImages?: TemplateImageUncheckedCreateNestedManyWithoutTemplateInput
    pages?: TemplatePagesUncheckedCreateNestedManyWithoutTemplateInput
  }

  export type TemplateCreateOrConnectWithoutFunnelsCreatedInput = {
    where: TemplateWhereUniqueInput
    create: XOR<TemplateCreateWithoutFunnelsCreatedInput, TemplateUncheckedCreateWithoutFunnelsCreatedInput>
  }

  export type UserUpsertWithoutFunnelsInput = {
    update: XOR<UserUpdateWithoutFunnelsInput, UserUncheckedUpdateWithoutFunnelsInput>
    create: XOR<UserCreateWithoutFunnelsInput, UserUncheckedCreateWithoutFunnelsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutFunnelsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutFunnelsInput, UserUncheckedUpdateWithoutFunnelsInput>
  }

  export type UserUpdateWithoutFunnelsInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    passwordResetToken?: NullableStringFieldUpdateOperationsInput | string | null
    passwordResetExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: DomainUpdateManyWithoutUserNestedInput
    templates?: TemplateUpdateManyWithoutCreatedByNestedInput
  }

  export type UserUncheckedUpdateWithoutFunnelsInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    passwordResetToken?: NullableStringFieldUpdateOperationsInput | string | null
    passwordResetExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domains?: DomainUncheckedUpdateManyWithoutUserNestedInput
    templates?: TemplateUncheckedUpdateManyWithoutCreatedByNestedInput
  }

  export type PageUpsertWithWhereUniqueWithoutFunnelInput = {
    where: PageWhereUniqueInput
    update: XOR<PageUpdateWithoutFunnelInput, PageUncheckedUpdateWithoutFunnelInput>
    create: XOR<PageCreateWithoutFunnelInput, PageUncheckedCreateWithoutFunnelInput>
  }

  export type PageUpdateWithWhereUniqueWithoutFunnelInput = {
    where: PageWhereUniqueInput
    data: XOR<PageUpdateWithoutFunnelInput, PageUncheckedUpdateWithoutFunnelInput>
  }

  export type PageUpdateManyWithWhereWithoutFunnelInput = {
    where: PageScalarWhereInput
    data: XOR<PageUpdateManyMutationInput, PageUncheckedUpdateManyWithoutFunnelInput>
  }

  export type PageScalarWhereInput = {
    AND?: PageScalarWhereInput | PageScalarWhereInput[]
    OR?: PageScalarWhereInput[]
    NOT?: PageScalarWhereInput | PageScalarWhereInput[]
    id?: IntFilter<"Page"> | number
    name?: StringFilter<"Page"> | string
    content?: StringNullableFilter<"Page"> | string | null
    order?: IntFilter<"Page"> | number
    linkingId?: StringNullableFilter<"Page"> | string | null
    funnelId?: IntFilter<"Page"> | number
    createdAt?: DateTimeFilter<"Page"> | Date | string
    updatedAt?: DateTimeFilter<"Page"> | Date | string
  }

  export type FunnelDomainUpsertWithWhereUniqueWithoutFunnelInput = {
    where: FunnelDomainWhereUniqueInput
    update: XOR<FunnelDomainUpdateWithoutFunnelInput, FunnelDomainUncheckedUpdateWithoutFunnelInput>
    create: XOR<FunnelDomainCreateWithoutFunnelInput, FunnelDomainUncheckedCreateWithoutFunnelInput>
  }

  export type FunnelDomainUpdateWithWhereUniqueWithoutFunnelInput = {
    where: FunnelDomainWhereUniqueInput
    data: XOR<FunnelDomainUpdateWithoutFunnelInput, FunnelDomainUncheckedUpdateWithoutFunnelInput>
  }

  export type FunnelDomainUpdateManyWithWhereWithoutFunnelInput = {
    where: FunnelDomainScalarWhereInput
    data: XOR<FunnelDomainUpdateManyMutationInput, FunnelDomainUncheckedUpdateManyWithoutFunnelInput>
  }

  export type FunnelDomainScalarWhereInput = {
    AND?: FunnelDomainScalarWhereInput | FunnelDomainScalarWhereInput[]
    OR?: FunnelDomainScalarWhereInput[]
    NOT?: FunnelDomainScalarWhereInput | FunnelDomainScalarWhereInput[]
    id?: IntFilter<"FunnelDomain"> | number
    funnelId?: IntFilter<"FunnelDomain"> | number
    domainId?: IntFilter<"FunnelDomain"> | number
    isActive?: BoolFilter<"FunnelDomain"> | boolean
    createdAt?: DateTimeFilter<"FunnelDomain"> | Date | string
    updatedAt?: DateTimeFilter<"FunnelDomain"> | Date | string
  }

  export type TemplateUpsertWithoutFunnelsCreatedInput = {
    update: XOR<TemplateUpdateWithoutFunnelsCreatedInput, TemplateUncheckedUpdateWithoutFunnelsCreatedInput>
    create: XOR<TemplateCreateWithoutFunnelsCreatedInput, TemplateUncheckedCreateWithoutFunnelsCreatedInput>
    where?: TemplateWhereInput
  }

  export type TemplateUpdateToOneWithWhereWithoutFunnelsCreatedInput = {
    where?: TemplateWhereInput
    data: XOR<TemplateUpdateWithoutFunnelsCreatedInput, TemplateUncheckedUpdateWithoutFunnelsCreatedInput>
  }

  export type TemplateUpdateWithoutFunnelsCreatedInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: TemplateCategoryUpdateOneRequiredWithoutTemplatesNestedInput
    previewImages?: TemplateImageUpdateManyWithoutTemplateNestedInput
    pages?: TemplatePagesUpdateManyWithoutTemplateNestedInput
    createdBy?: UserUpdateOneRequiredWithoutTemplatesNestedInput
  }

  export type TemplateUncheckedUpdateWithoutFunnelsCreatedInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: IntFieldUpdateOperationsInput | number
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    createdByUserId?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    previewImages?: TemplateImageUncheckedUpdateManyWithoutTemplateNestedInput
    pages?: TemplatePagesUncheckedUpdateManyWithoutTemplateNestedInput
  }

  export type UserCreateWithoutDomainsInput = {
    email: string
    name?: string | null
    password: string
    passwordResetToken?: string | null
    passwordResetExpiresAt?: Date | string | null
    isAdmin?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    funnels?: FunnelCreateNestedManyWithoutUserInput
    templates?: TemplateCreateNestedManyWithoutCreatedByInput
  }

  export type UserUncheckedCreateWithoutDomainsInput = {
    id?: number
    email: string
    name?: string | null
    password: string
    passwordResetToken?: string | null
    passwordResetExpiresAt?: Date | string | null
    isAdmin?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    funnels?: FunnelUncheckedCreateNestedManyWithoutUserInput
    templates?: TemplateUncheckedCreateNestedManyWithoutCreatedByInput
  }

  export type UserCreateOrConnectWithoutDomainsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutDomainsInput, UserUncheckedCreateWithoutDomainsInput>
  }

  export type FunnelDomainCreateWithoutDomainInput = {
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    funnel: FunnelCreateNestedOneWithoutDomainConnectionsInput
  }

  export type FunnelDomainUncheckedCreateWithoutDomainInput = {
    id?: number
    funnelId: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FunnelDomainCreateOrConnectWithoutDomainInput = {
    where: FunnelDomainWhereUniqueInput
    create: XOR<FunnelDomainCreateWithoutDomainInput, FunnelDomainUncheckedCreateWithoutDomainInput>
  }

  export type FunnelDomainCreateManyDomainInputEnvelope = {
    data: FunnelDomainCreateManyDomainInput | FunnelDomainCreateManyDomainInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutDomainsInput = {
    update: XOR<UserUpdateWithoutDomainsInput, UserUncheckedUpdateWithoutDomainsInput>
    create: XOR<UserCreateWithoutDomainsInput, UserUncheckedCreateWithoutDomainsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutDomainsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutDomainsInput, UserUncheckedUpdateWithoutDomainsInput>
  }

  export type UserUpdateWithoutDomainsInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    passwordResetToken?: NullableStringFieldUpdateOperationsInput | string | null
    passwordResetExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    funnels?: FunnelUpdateManyWithoutUserNestedInput
    templates?: TemplateUpdateManyWithoutCreatedByNestedInput
  }

  export type UserUncheckedUpdateWithoutDomainsInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    passwordResetToken?: NullableStringFieldUpdateOperationsInput | string | null
    passwordResetExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    funnels?: FunnelUncheckedUpdateManyWithoutUserNestedInput
    templates?: TemplateUncheckedUpdateManyWithoutCreatedByNestedInput
  }

  export type FunnelDomainUpsertWithWhereUniqueWithoutDomainInput = {
    where: FunnelDomainWhereUniqueInput
    update: XOR<FunnelDomainUpdateWithoutDomainInput, FunnelDomainUncheckedUpdateWithoutDomainInput>
    create: XOR<FunnelDomainCreateWithoutDomainInput, FunnelDomainUncheckedCreateWithoutDomainInput>
  }

  export type FunnelDomainUpdateWithWhereUniqueWithoutDomainInput = {
    where: FunnelDomainWhereUniqueInput
    data: XOR<FunnelDomainUpdateWithoutDomainInput, FunnelDomainUncheckedUpdateWithoutDomainInput>
  }

  export type FunnelDomainUpdateManyWithWhereWithoutDomainInput = {
    where: FunnelDomainScalarWhereInput
    data: XOR<FunnelDomainUpdateManyMutationInput, FunnelDomainUncheckedUpdateManyWithoutDomainInput>
  }

  export type FunnelCreateWithoutDomainConnectionsInput = {
    name: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutFunnelsInput
    pages?: PageCreateNestedManyWithoutFunnelInput
    template?: TemplateCreateNestedOneWithoutFunnelsCreatedInput
  }

  export type FunnelUncheckedCreateWithoutDomainConnectionsInput = {
    id?: number
    name: string
    status?: string
    userId: number
    templateId?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pages?: PageUncheckedCreateNestedManyWithoutFunnelInput
  }

  export type FunnelCreateOrConnectWithoutDomainConnectionsInput = {
    where: FunnelWhereUniqueInput
    create: XOR<FunnelCreateWithoutDomainConnectionsInput, FunnelUncheckedCreateWithoutDomainConnectionsInput>
  }

  export type DomainCreateWithoutFunnelConnectionsInput = {
    hostname: string
    type: $Enums.DomainType
    status?: $Enums.DomainStatus
    sslStatus?: $Enums.SslStatus
    cloudflareHostnameId?: string | null
    cloudflareZoneId?: string | null
    cloudflareRecordId?: string | null
    verificationToken?: string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutDomainsInput
  }

  export type DomainUncheckedCreateWithoutFunnelConnectionsInput = {
    id?: number
    hostname: string
    type: $Enums.DomainType
    status?: $Enums.DomainStatus
    sslStatus?: $Enums.SslStatus
    userId: number
    cloudflareHostnameId?: string | null
    cloudflareZoneId?: string | null
    cloudflareRecordId?: string | null
    verificationToken?: string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DomainCreateOrConnectWithoutFunnelConnectionsInput = {
    where: DomainWhereUniqueInput
    create: XOR<DomainCreateWithoutFunnelConnectionsInput, DomainUncheckedCreateWithoutFunnelConnectionsInput>
  }

  export type FunnelUpsertWithoutDomainConnectionsInput = {
    update: XOR<FunnelUpdateWithoutDomainConnectionsInput, FunnelUncheckedUpdateWithoutDomainConnectionsInput>
    create: XOR<FunnelCreateWithoutDomainConnectionsInput, FunnelUncheckedCreateWithoutDomainConnectionsInput>
    where?: FunnelWhereInput
  }

  export type FunnelUpdateToOneWithWhereWithoutDomainConnectionsInput = {
    where?: FunnelWhereInput
    data: XOR<FunnelUpdateWithoutDomainConnectionsInput, FunnelUncheckedUpdateWithoutDomainConnectionsInput>
  }

  export type FunnelUpdateWithoutDomainConnectionsInput = {
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutFunnelsNestedInput
    pages?: PageUpdateManyWithoutFunnelNestedInput
    template?: TemplateUpdateOneWithoutFunnelsCreatedNestedInput
  }

  export type FunnelUncheckedUpdateWithoutDomainConnectionsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    userId?: IntFieldUpdateOperationsInput | number
    templateId?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pages?: PageUncheckedUpdateManyWithoutFunnelNestedInput
  }

  export type DomainUpsertWithoutFunnelConnectionsInput = {
    update: XOR<DomainUpdateWithoutFunnelConnectionsInput, DomainUncheckedUpdateWithoutFunnelConnectionsInput>
    create: XOR<DomainCreateWithoutFunnelConnectionsInput, DomainUncheckedCreateWithoutFunnelConnectionsInput>
    where?: DomainWhereInput
  }

  export type DomainUpdateToOneWithWhereWithoutFunnelConnectionsInput = {
    where?: DomainWhereInput
    data: XOR<DomainUpdateWithoutFunnelConnectionsInput, DomainUncheckedUpdateWithoutFunnelConnectionsInput>
  }

  export type DomainUpdateWithoutFunnelConnectionsInput = {
    hostname?: StringFieldUpdateOperationsInput | string
    type?: EnumDomainTypeFieldUpdateOperationsInput | $Enums.DomainType
    status?: EnumDomainStatusFieldUpdateOperationsInput | $Enums.DomainStatus
    sslStatus?: EnumSslStatusFieldUpdateOperationsInput | $Enums.SslStatus
    cloudflareHostnameId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareZoneId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareRecordId?: NullableStringFieldUpdateOperationsInput | string | null
    verificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: NullableStringFieldUpdateOperationsInput | string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutDomainsNestedInput
  }

  export type DomainUncheckedUpdateWithoutFunnelConnectionsInput = {
    id?: IntFieldUpdateOperationsInput | number
    hostname?: StringFieldUpdateOperationsInput | string
    type?: EnumDomainTypeFieldUpdateOperationsInput | $Enums.DomainType
    status?: EnumDomainStatusFieldUpdateOperationsInput | $Enums.DomainStatus
    sslStatus?: EnumSslStatusFieldUpdateOperationsInput | $Enums.SslStatus
    userId?: IntFieldUpdateOperationsInput | number
    cloudflareHostnameId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareZoneId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareRecordId?: NullableStringFieldUpdateOperationsInput | string | null
    verificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: NullableStringFieldUpdateOperationsInput | string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FunnelCreateWithoutPagesInput = {
    name: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutFunnelsInput
    domainConnections?: FunnelDomainCreateNestedManyWithoutFunnelInput
    template?: TemplateCreateNestedOneWithoutFunnelsCreatedInput
  }

  export type FunnelUncheckedCreateWithoutPagesInput = {
    id?: number
    name: string
    status?: string
    userId: number
    templateId?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    domainConnections?: FunnelDomainUncheckedCreateNestedManyWithoutFunnelInput
  }

  export type FunnelCreateOrConnectWithoutPagesInput = {
    where: FunnelWhereUniqueInput
    create: XOR<FunnelCreateWithoutPagesInput, FunnelUncheckedCreateWithoutPagesInput>
  }

  export type FunnelUpsertWithoutPagesInput = {
    update: XOR<FunnelUpdateWithoutPagesInput, FunnelUncheckedUpdateWithoutPagesInput>
    create: XOR<FunnelCreateWithoutPagesInput, FunnelUncheckedCreateWithoutPagesInput>
    where?: FunnelWhereInput
  }

  export type FunnelUpdateToOneWithWhereWithoutPagesInput = {
    where?: FunnelWhereInput
    data: XOR<FunnelUpdateWithoutPagesInput, FunnelUncheckedUpdateWithoutPagesInput>
  }

  export type FunnelUpdateWithoutPagesInput = {
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutFunnelsNestedInput
    domainConnections?: FunnelDomainUpdateManyWithoutFunnelNestedInput
    template?: TemplateUpdateOneWithoutFunnelsCreatedNestedInput
  }

  export type FunnelUncheckedUpdateWithoutPagesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    userId?: IntFieldUpdateOperationsInput | number
    templateId?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domainConnections?: FunnelDomainUncheckedUpdateManyWithoutFunnelNestedInput
  }

  export type TemplateCreateWithoutCategoryInput = {
    name: string
    slug: string
    description?: string | null
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    previewImages?: TemplateImageCreateNestedManyWithoutTemplateInput
    pages?: TemplatePagesCreateNestedManyWithoutTemplateInput
    createdBy: UserCreateNestedOneWithoutTemplatesInput
    funnelsCreated?: FunnelCreateNestedManyWithoutTemplateInput
  }

  export type TemplateUncheckedCreateWithoutCategoryInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    createdByUserId: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    previewImages?: TemplateImageUncheckedCreateNestedManyWithoutTemplateInput
    pages?: TemplatePagesUncheckedCreateNestedManyWithoutTemplateInput
    funnelsCreated?: FunnelUncheckedCreateNestedManyWithoutTemplateInput
  }

  export type TemplateCreateOrConnectWithoutCategoryInput = {
    where: TemplateWhereUniqueInput
    create: XOR<TemplateCreateWithoutCategoryInput, TemplateUncheckedCreateWithoutCategoryInput>
  }

  export type TemplateCreateManyCategoryInputEnvelope = {
    data: TemplateCreateManyCategoryInput | TemplateCreateManyCategoryInput[]
    skipDuplicates?: boolean
  }

  export type TemplateUpsertWithWhereUniqueWithoutCategoryInput = {
    where: TemplateWhereUniqueInput
    update: XOR<TemplateUpdateWithoutCategoryInput, TemplateUncheckedUpdateWithoutCategoryInput>
    create: XOR<TemplateCreateWithoutCategoryInput, TemplateUncheckedCreateWithoutCategoryInput>
  }

  export type TemplateUpdateWithWhereUniqueWithoutCategoryInput = {
    where: TemplateWhereUniqueInput
    data: XOR<TemplateUpdateWithoutCategoryInput, TemplateUncheckedUpdateWithoutCategoryInput>
  }

  export type TemplateUpdateManyWithWhereWithoutCategoryInput = {
    where: TemplateScalarWhereInput
    data: XOR<TemplateUpdateManyMutationInput, TemplateUncheckedUpdateManyWithoutCategoryInput>
  }

  export type TemplateCategoryCreateWithoutTemplatesInput = {
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    order?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateCategoryUncheckedCreateWithoutTemplatesInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    order?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateCategoryCreateOrConnectWithoutTemplatesInput = {
    where: TemplateCategoryWhereUniqueInput
    create: XOR<TemplateCategoryCreateWithoutTemplatesInput, TemplateCategoryUncheckedCreateWithoutTemplatesInput>
  }

  export type TemplateImageCreateWithoutTemplateInput = {
    imageUrl: string
    imageType: string
    order?: number
    caption?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateImageUncheckedCreateWithoutTemplateInput = {
    id?: number
    imageUrl: string
    imageType: string
    order?: number
    caption?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateImageCreateOrConnectWithoutTemplateInput = {
    where: TemplateImageWhereUniqueInput
    create: XOR<TemplateImageCreateWithoutTemplateInput, TemplateImageUncheckedCreateWithoutTemplateInput>
  }

  export type TemplateImageCreateManyTemplateInputEnvelope = {
    data: TemplateImageCreateManyTemplateInput | TemplateImageCreateManyTemplateInput[]
    skipDuplicates?: boolean
  }

  export type TemplatePagesCreateWithoutTemplateInput = {
    name: string
    content?: string | null
    order: number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplatePagesUncheckedCreateWithoutTemplateInput = {
    id?: number
    name: string
    content?: string | null
    order: number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplatePagesCreateOrConnectWithoutTemplateInput = {
    where: TemplatePagesWhereUniqueInput
    create: XOR<TemplatePagesCreateWithoutTemplateInput, TemplatePagesUncheckedCreateWithoutTemplateInput>
  }

  export type TemplatePagesCreateManyTemplateInputEnvelope = {
    data: TemplatePagesCreateManyTemplateInput | TemplatePagesCreateManyTemplateInput[]
    skipDuplicates?: boolean
  }

  export type UserCreateWithoutTemplatesInput = {
    email: string
    name?: string | null
    password: string
    passwordResetToken?: string | null
    passwordResetExpiresAt?: Date | string | null
    isAdmin?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    funnels?: FunnelCreateNestedManyWithoutUserInput
    domains?: DomainCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutTemplatesInput = {
    id?: number
    email: string
    name?: string | null
    password: string
    passwordResetToken?: string | null
    passwordResetExpiresAt?: Date | string | null
    isAdmin?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    funnels?: FunnelUncheckedCreateNestedManyWithoutUserInput
    domains?: DomainUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutTemplatesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutTemplatesInput, UserUncheckedCreateWithoutTemplatesInput>
  }

  export type FunnelCreateWithoutTemplateInput = {
    name: string
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutFunnelsInput
    pages?: PageCreateNestedManyWithoutFunnelInput
    domainConnections?: FunnelDomainCreateNestedManyWithoutFunnelInput
  }

  export type FunnelUncheckedCreateWithoutTemplateInput = {
    id?: number
    name: string
    status?: string
    userId: number
    createdAt?: Date | string
    updatedAt?: Date | string
    pages?: PageUncheckedCreateNestedManyWithoutFunnelInput
    domainConnections?: FunnelDomainUncheckedCreateNestedManyWithoutFunnelInput
  }

  export type FunnelCreateOrConnectWithoutTemplateInput = {
    where: FunnelWhereUniqueInput
    create: XOR<FunnelCreateWithoutTemplateInput, FunnelUncheckedCreateWithoutTemplateInput>
  }

  export type FunnelCreateManyTemplateInputEnvelope = {
    data: FunnelCreateManyTemplateInput | FunnelCreateManyTemplateInput[]
    skipDuplicates?: boolean
  }

  export type TemplateCategoryUpsertWithoutTemplatesInput = {
    update: XOR<TemplateCategoryUpdateWithoutTemplatesInput, TemplateCategoryUncheckedUpdateWithoutTemplatesInput>
    create: XOR<TemplateCategoryCreateWithoutTemplatesInput, TemplateCategoryUncheckedCreateWithoutTemplatesInput>
    where?: TemplateCategoryWhereInput
  }

  export type TemplateCategoryUpdateToOneWithWhereWithoutTemplatesInput = {
    where?: TemplateCategoryWhereInput
    data: XOR<TemplateCategoryUpdateWithoutTemplatesInput, TemplateCategoryUncheckedUpdateWithoutTemplatesInput>
  }

  export type TemplateCategoryUpdateWithoutTemplatesInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateCategoryUncheckedUpdateWithoutTemplatesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateImageUpsertWithWhereUniqueWithoutTemplateInput = {
    where: TemplateImageWhereUniqueInput
    update: XOR<TemplateImageUpdateWithoutTemplateInput, TemplateImageUncheckedUpdateWithoutTemplateInput>
    create: XOR<TemplateImageCreateWithoutTemplateInput, TemplateImageUncheckedCreateWithoutTemplateInput>
  }

  export type TemplateImageUpdateWithWhereUniqueWithoutTemplateInput = {
    where: TemplateImageWhereUniqueInput
    data: XOR<TemplateImageUpdateWithoutTemplateInput, TemplateImageUncheckedUpdateWithoutTemplateInput>
  }

  export type TemplateImageUpdateManyWithWhereWithoutTemplateInput = {
    where: TemplateImageScalarWhereInput
    data: XOR<TemplateImageUpdateManyMutationInput, TemplateImageUncheckedUpdateManyWithoutTemplateInput>
  }

  export type TemplateImageScalarWhereInput = {
    AND?: TemplateImageScalarWhereInput | TemplateImageScalarWhereInput[]
    OR?: TemplateImageScalarWhereInput[]
    NOT?: TemplateImageScalarWhereInput | TemplateImageScalarWhereInput[]
    id?: IntFilter<"TemplateImage"> | number
    templateId?: IntFilter<"TemplateImage"> | number
    imageUrl?: StringFilter<"TemplateImage"> | string
    imageType?: StringFilter<"TemplateImage"> | string
    order?: IntFilter<"TemplateImage"> | number
    caption?: StringNullableFilter<"TemplateImage"> | string | null
    createdAt?: DateTimeFilter<"TemplateImage"> | Date | string
    updatedAt?: DateTimeFilter<"TemplateImage"> | Date | string
  }

  export type TemplatePagesUpsertWithWhereUniqueWithoutTemplateInput = {
    where: TemplatePagesWhereUniqueInput
    update: XOR<TemplatePagesUpdateWithoutTemplateInput, TemplatePagesUncheckedUpdateWithoutTemplateInput>
    create: XOR<TemplatePagesCreateWithoutTemplateInput, TemplatePagesUncheckedCreateWithoutTemplateInput>
  }

  export type TemplatePagesUpdateWithWhereUniqueWithoutTemplateInput = {
    where: TemplatePagesWhereUniqueInput
    data: XOR<TemplatePagesUpdateWithoutTemplateInput, TemplatePagesUncheckedUpdateWithoutTemplateInput>
  }

  export type TemplatePagesUpdateManyWithWhereWithoutTemplateInput = {
    where: TemplatePagesScalarWhereInput
    data: XOR<TemplatePagesUpdateManyMutationInput, TemplatePagesUncheckedUpdateManyWithoutTemplateInput>
  }

  export type TemplatePagesScalarWhereInput = {
    AND?: TemplatePagesScalarWhereInput | TemplatePagesScalarWhereInput[]
    OR?: TemplatePagesScalarWhereInput[]
    NOT?: TemplatePagesScalarWhereInput | TemplatePagesScalarWhereInput[]
    id?: IntFilter<"TemplatePages"> | number
    templateId?: IntFilter<"TemplatePages"> | number
    name?: StringFilter<"TemplatePages"> | string
    content?: StringNullableFilter<"TemplatePages"> | string | null
    order?: IntFilter<"TemplatePages"> | number
    settings?: JsonNullableFilter<"TemplatePages">
    linkingIdPrefix?: StringNullableFilter<"TemplatePages"> | string | null
    metadata?: JsonNullableFilter<"TemplatePages">
    createdAt?: DateTimeFilter<"TemplatePages"> | Date | string
    updatedAt?: DateTimeFilter<"TemplatePages"> | Date | string
  }

  export type UserUpsertWithoutTemplatesInput = {
    update: XOR<UserUpdateWithoutTemplatesInput, UserUncheckedUpdateWithoutTemplatesInput>
    create: XOR<UserCreateWithoutTemplatesInput, UserUncheckedCreateWithoutTemplatesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutTemplatesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutTemplatesInput, UserUncheckedUpdateWithoutTemplatesInput>
  }

  export type UserUpdateWithoutTemplatesInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    passwordResetToken?: NullableStringFieldUpdateOperationsInput | string | null
    passwordResetExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    funnels?: FunnelUpdateManyWithoutUserNestedInput
    domains?: DomainUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutTemplatesInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    passwordResetToken?: NullableStringFieldUpdateOperationsInput | string | null
    passwordResetExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    funnels?: FunnelUncheckedUpdateManyWithoutUserNestedInput
    domains?: DomainUncheckedUpdateManyWithoutUserNestedInput
  }

  export type FunnelUpsertWithWhereUniqueWithoutTemplateInput = {
    where: FunnelWhereUniqueInput
    update: XOR<FunnelUpdateWithoutTemplateInput, FunnelUncheckedUpdateWithoutTemplateInput>
    create: XOR<FunnelCreateWithoutTemplateInput, FunnelUncheckedCreateWithoutTemplateInput>
  }

  export type FunnelUpdateWithWhereUniqueWithoutTemplateInput = {
    where: FunnelWhereUniqueInput
    data: XOR<FunnelUpdateWithoutTemplateInput, FunnelUncheckedUpdateWithoutTemplateInput>
  }

  export type FunnelUpdateManyWithWhereWithoutTemplateInput = {
    where: FunnelScalarWhereInput
    data: XOR<FunnelUpdateManyMutationInput, FunnelUncheckedUpdateManyWithoutTemplateInput>
  }

  export type TemplateCreateWithoutPreviewImagesInput = {
    name: string
    slug: string
    description?: string | null
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    category: TemplateCategoryCreateNestedOneWithoutTemplatesInput
    pages?: TemplatePagesCreateNestedManyWithoutTemplateInput
    createdBy: UserCreateNestedOneWithoutTemplatesInput
    funnelsCreated?: FunnelCreateNestedManyWithoutTemplateInput
  }

  export type TemplateUncheckedCreateWithoutPreviewImagesInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    categoryId: number
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    createdByUserId: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    pages?: TemplatePagesUncheckedCreateNestedManyWithoutTemplateInput
    funnelsCreated?: FunnelUncheckedCreateNestedManyWithoutTemplateInput
  }

  export type TemplateCreateOrConnectWithoutPreviewImagesInput = {
    where: TemplateWhereUniqueInput
    create: XOR<TemplateCreateWithoutPreviewImagesInput, TemplateUncheckedCreateWithoutPreviewImagesInput>
  }

  export type TemplateUpsertWithoutPreviewImagesInput = {
    update: XOR<TemplateUpdateWithoutPreviewImagesInput, TemplateUncheckedUpdateWithoutPreviewImagesInput>
    create: XOR<TemplateCreateWithoutPreviewImagesInput, TemplateUncheckedCreateWithoutPreviewImagesInput>
    where?: TemplateWhereInput
  }

  export type TemplateUpdateToOneWithWhereWithoutPreviewImagesInput = {
    where?: TemplateWhereInput
    data: XOR<TemplateUpdateWithoutPreviewImagesInput, TemplateUncheckedUpdateWithoutPreviewImagesInput>
  }

  export type TemplateUpdateWithoutPreviewImagesInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: TemplateCategoryUpdateOneRequiredWithoutTemplatesNestedInput
    pages?: TemplatePagesUpdateManyWithoutTemplateNestedInput
    createdBy?: UserUpdateOneRequiredWithoutTemplatesNestedInput
    funnelsCreated?: FunnelUpdateManyWithoutTemplateNestedInput
  }

  export type TemplateUncheckedUpdateWithoutPreviewImagesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: IntFieldUpdateOperationsInput | number
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    createdByUserId?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pages?: TemplatePagesUncheckedUpdateManyWithoutTemplateNestedInput
    funnelsCreated?: FunnelUncheckedUpdateManyWithoutTemplateNestedInput
  }

  export type TemplateCreateWithoutPagesInput = {
    name: string
    slug: string
    description?: string | null
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    category: TemplateCategoryCreateNestedOneWithoutTemplatesInput
    previewImages?: TemplateImageCreateNestedManyWithoutTemplateInput
    createdBy: UserCreateNestedOneWithoutTemplatesInput
    funnelsCreated?: FunnelCreateNestedManyWithoutTemplateInput
  }

  export type TemplateUncheckedCreateWithoutPagesInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    categoryId: number
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    createdByUserId: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    previewImages?: TemplateImageUncheckedCreateNestedManyWithoutTemplateInput
    funnelsCreated?: FunnelUncheckedCreateNestedManyWithoutTemplateInput
  }

  export type TemplateCreateOrConnectWithoutPagesInput = {
    where: TemplateWhereUniqueInput
    create: XOR<TemplateCreateWithoutPagesInput, TemplateUncheckedCreateWithoutPagesInput>
  }

  export type TemplateUpsertWithoutPagesInput = {
    update: XOR<TemplateUpdateWithoutPagesInput, TemplateUncheckedUpdateWithoutPagesInput>
    create: XOR<TemplateCreateWithoutPagesInput, TemplateUncheckedCreateWithoutPagesInput>
    where?: TemplateWhereInput
  }

  export type TemplateUpdateToOneWithWhereWithoutPagesInput = {
    where?: TemplateWhereInput
    data: XOR<TemplateUpdateWithoutPagesInput, TemplateUncheckedUpdateWithoutPagesInput>
  }

  export type TemplateUpdateWithoutPagesInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: TemplateCategoryUpdateOneRequiredWithoutTemplatesNestedInput
    previewImages?: TemplateImageUpdateManyWithoutTemplateNestedInput
    createdBy?: UserUpdateOneRequiredWithoutTemplatesNestedInput
    funnelsCreated?: FunnelUpdateManyWithoutTemplateNestedInput
  }

  export type TemplateUncheckedUpdateWithoutPagesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: IntFieldUpdateOperationsInput | number
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    createdByUserId?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    previewImages?: TemplateImageUncheckedUpdateManyWithoutTemplateNestedInput
    funnelsCreated?: FunnelUncheckedUpdateManyWithoutTemplateNestedInput
  }

  export type FunnelCreateManyUserInput = {
    id?: number
    name: string
    status?: string
    templateId?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DomainCreateManyUserInput = {
    id?: number
    hostname: string
    type: $Enums.DomainType
    status?: $Enums.DomainStatus
    sslStatus?: $Enums.SslStatus
    cloudflareHostnameId?: string | null
    cloudflareZoneId?: string | null
    cloudflareRecordId?: string | null
    verificationToken?: string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateCreateManyCreatedByInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    categoryId: number
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FunnelUpdateWithoutUserInput = {
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pages?: PageUpdateManyWithoutFunnelNestedInput
    domainConnections?: FunnelDomainUpdateManyWithoutFunnelNestedInput
    template?: TemplateUpdateOneWithoutFunnelsCreatedNestedInput
  }

  export type FunnelUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    templateId?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pages?: PageUncheckedUpdateManyWithoutFunnelNestedInput
    domainConnections?: FunnelDomainUncheckedUpdateManyWithoutFunnelNestedInput
  }

  export type FunnelUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    templateId?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DomainUpdateWithoutUserInput = {
    hostname?: StringFieldUpdateOperationsInput | string
    type?: EnumDomainTypeFieldUpdateOperationsInput | $Enums.DomainType
    status?: EnumDomainStatusFieldUpdateOperationsInput | $Enums.DomainStatus
    sslStatus?: EnumSslStatusFieldUpdateOperationsInput | $Enums.SslStatus
    cloudflareHostnameId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareZoneId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareRecordId?: NullableStringFieldUpdateOperationsInput | string | null
    verificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: NullableStringFieldUpdateOperationsInput | string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    funnelConnections?: FunnelDomainUpdateManyWithoutDomainNestedInput
  }

  export type DomainUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    hostname?: StringFieldUpdateOperationsInput | string
    type?: EnumDomainTypeFieldUpdateOperationsInput | $Enums.DomainType
    status?: EnumDomainStatusFieldUpdateOperationsInput | $Enums.DomainStatus
    sslStatus?: EnumSslStatusFieldUpdateOperationsInput | $Enums.SslStatus
    cloudflareHostnameId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareZoneId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareRecordId?: NullableStringFieldUpdateOperationsInput | string | null
    verificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: NullableStringFieldUpdateOperationsInput | string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    funnelConnections?: FunnelDomainUncheckedUpdateManyWithoutDomainNestedInput
  }

  export type DomainUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    hostname?: StringFieldUpdateOperationsInput | string
    type?: EnumDomainTypeFieldUpdateOperationsInput | $Enums.DomainType
    status?: EnumDomainStatusFieldUpdateOperationsInput | $Enums.DomainStatus
    sslStatus?: EnumSslStatusFieldUpdateOperationsInput | $Enums.SslStatus
    cloudflareHostnameId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareZoneId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudflareRecordId?: NullableStringFieldUpdateOperationsInput | string | null
    verificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    ownershipVerification?: NullableJsonNullValueInput | InputJsonValue
    dnsInstructions?: NullableJsonNullValueInput | InputJsonValue
    sslCertificateId?: NullableStringFieldUpdateOperationsInput | string | null
    sslValidationRecords?: NullableJsonNullValueInput | InputJsonValue
    lastVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateUpdateWithoutCreatedByInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: TemplateCategoryUpdateOneRequiredWithoutTemplatesNestedInput
    previewImages?: TemplateImageUpdateManyWithoutTemplateNestedInput
    pages?: TemplatePagesUpdateManyWithoutTemplateNestedInput
    funnelsCreated?: FunnelUpdateManyWithoutTemplateNestedInput
  }

  export type TemplateUncheckedUpdateWithoutCreatedByInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: IntFieldUpdateOperationsInput | number
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    previewImages?: TemplateImageUncheckedUpdateManyWithoutTemplateNestedInput
    pages?: TemplatePagesUncheckedUpdateManyWithoutTemplateNestedInput
    funnelsCreated?: FunnelUncheckedUpdateManyWithoutTemplateNestedInput
  }

  export type TemplateUncheckedUpdateManyWithoutCreatedByInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: IntFieldUpdateOperationsInput | number
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PageCreateManyFunnelInput = {
    id?: number
    name: string
    content?: string | null
    order: number
    linkingId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FunnelDomainCreateManyFunnelInput = {
    id?: number
    domainId: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PageUpdateWithoutFunnelInput = {
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    linkingId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PageUncheckedUpdateWithoutFunnelInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    linkingId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PageUncheckedUpdateManyWithoutFunnelInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    linkingId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FunnelDomainUpdateWithoutFunnelInput = {
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    domain?: DomainUpdateOneRequiredWithoutFunnelConnectionsNestedInput
  }

  export type FunnelDomainUncheckedUpdateWithoutFunnelInput = {
    id?: IntFieldUpdateOperationsInput | number
    domainId?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FunnelDomainUncheckedUpdateManyWithoutFunnelInput = {
    id?: IntFieldUpdateOperationsInput | number
    domainId?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FunnelDomainCreateManyDomainInput = {
    id?: number
    funnelId: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FunnelDomainUpdateWithoutDomainInput = {
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    funnel?: FunnelUpdateOneRequiredWithoutDomainConnectionsNestedInput
  }

  export type FunnelDomainUncheckedUpdateWithoutDomainInput = {
    id?: IntFieldUpdateOperationsInput | number
    funnelId?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FunnelDomainUncheckedUpdateManyWithoutDomainInput = {
    id?: IntFieldUpdateOperationsInput | number
    funnelId?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateCreateManyCategoryInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    thumbnailImage?: string | null
    tags?: TemplateCreatetagsInput | string[]
    usageCount?: number
    isActive?: boolean
    isPublic?: boolean
    createdByUserId: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateUpdateWithoutCategoryInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    previewImages?: TemplateImageUpdateManyWithoutTemplateNestedInput
    pages?: TemplatePagesUpdateManyWithoutTemplateNestedInput
    createdBy?: UserUpdateOneRequiredWithoutTemplatesNestedInput
    funnelsCreated?: FunnelUpdateManyWithoutTemplateNestedInput
  }

  export type TemplateUncheckedUpdateWithoutCategoryInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    createdByUserId?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    previewImages?: TemplateImageUncheckedUpdateManyWithoutTemplateNestedInput
    pages?: TemplatePagesUncheckedUpdateManyWithoutTemplateNestedInput
    funnelsCreated?: FunnelUncheckedUpdateManyWithoutTemplateNestedInput
  }

  export type TemplateUncheckedUpdateManyWithoutCategoryInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnailImage?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: TemplateUpdatetagsInput | string[]
    usageCount?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    createdByUserId?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateImageCreateManyTemplateInput = {
    id?: number
    imageUrl: string
    imageType: string
    order?: number
    caption?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplatePagesCreateManyTemplateInput = {
    id?: number
    name: string
    content?: string | null
    order: number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FunnelCreateManyTemplateInput = {
    id?: number
    name: string
    status?: string
    userId: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TemplateImageUpdateWithoutTemplateInput = {
    imageUrl?: StringFieldUpdateOperationsInput | string
    imageType?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateImageUncheckedUpdateWithoutTemplateInput = {
    id?: IntFieldUpdateOperationsInput | number
    imageUrl?: StringFieldUpdateOperationsInput | string
    imageType?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplateImageUncheckedUpdateManyWithoutTemplateInput = {
    id?: IntFieldUpdateOperationsInput | number
    imageUrl?: StringFieldUpdateOperationsInput | string
    imageType?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplatePagesUpdateWithoutTemplateInput = {
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplatePagesUncheckedUpdateWithoutTemplateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TemplatePagesUncheckedUpdateManyWithoutTemplateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    settings?: NullableJsonNullValueInput | InputJsonValue
    linkingIdPrefix?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FunnelUpdateWithoutTemplateInput = {
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutFunnelsNestedInput
    pages?: PageUpdateManyWithoutFunnelNestedInput
    domainConnections?: FunnelDomainUpdateManyWithoutFunnelNestedInput
  }

  export type FunnelUncheckedUpdateWithoutTemplateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    userId?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pages?: PageUncheckedUpdateManyWithoutFunnelNestedInput
    domainConnections?: FunnelDomainUncheckedUpdateManyWithoutFunnelNestedInput
  }

  export type FunnelUncheckedUpdateManyWithoutTemplateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    userId?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use UserCountOutputTypeDefaultArgs instead
     */
    export type UserCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use FunnelCountOutputTypeDefaultArgs instead
     */
    export type FunnelCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = FunnelCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use DomainCountOutputTypeDefaultArgs instead
     */
    export type DomainCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = DomainCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TemplateCategoryCountOutputTypeDefaultArgs instead
     */
    export type TemplateCategoryCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TemplateCategoryCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TemplateCountOutputTypeDefaultArgs instead
     */
    export type TemplateCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TemplateCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use FunnelDefaultArgs instead
     */
    export type FunnelArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = FunnelDefaultArgs<ExtArgs>
    /**
     * @deprecated Use DomainDefaultArgs instead
     */
    export type DomainArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = DomainDefaultArgs<ExtArgs>
    /**
     * @deprecated Use FunnelDomainDefaultArgs instead
     */
    export type FunnelDomainArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = FunnelDomainDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PageDefaultArgs instead
     */
    export type PageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PageDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TemplateCategoryDefaultArgs instead
     */
    export type TemplateCategoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TemplateCategoryDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TemplateDefaultArgs instead
     */
    export type TemplateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TemplateDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TemplateImageDefaultArgs instead
     */
    export type TemplateImageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TemplateImageDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TemplatePagesDefaultArgs instead
     */
    export type TemplatePagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TemplatePagesDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}