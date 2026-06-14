/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authors from "../authors.js";
import type * as badges from "../badges.js";
import type * as books from "../books.js";
import type * as clubs from "../clubs.js";
import type * as donations from "../donations.js";
import type * as files from "../files.js";
import type * as follows from "../follows.js";
import type * as invites from "../invites.js";
import type * as journal from "../journal.js";
import type * as library from "../library.js";
import type * as lists from "../lists.js";
import type * as notifications from "../notifications.js";
import type * as passwordUtils from "../passwordUtils.js";
import type * as posts from "../posts.js";
import type * as seed from "../seed.js";
import type * as showcases from "../showcases.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authors: typeof authors;
  badges: typeof badges;
  books: typeof books;
  clubs: typeof clubs;
  donations: typeof donations;
  files: typeof files;
  follows: typeof follows;
  invites: typeof invites;
  journal: typeof journal;
  library: typeof library;
  lists: typeof lists;
  notifications: typeof notifications;
  passwordUtils: typeof passwordUtils;
  posts: typeof posts;
  seed: typeof seed;
  showcases: typeof showcases;
  users: typeof users;
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
