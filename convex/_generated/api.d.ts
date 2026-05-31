/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth_helpers from "../auth_helpers.js";
import type * as backlinks from "../backlinks.js";
import type * as exchanges from "../exchanges.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as websites from "../websites.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth_helpers: typeof auth_helpers;
  backlinks: typeof backlinks;
  exchanges: typeof exchanges;
  messages: typeof messages;
  notifications: typeof notifications;
  seed: typeof seed;
  users: typeof users;
  websites: typeof websites;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
