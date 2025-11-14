// Type definitions converted to JSDoc comments for JavaScript
// Note: This file contains type information that was previously in TypeScript
// The types are kept as comments for reference but won't be enforced in JavaScript

/**
 * @typedef {string | number | boolean | null | { [key: string]: Json | undefined } | Json[]} Json
 */

/**
 * @typedef {Object} Database
 * @property {Object} __InternalSupabase
 * @property {string} __InternalSupabase.PostgrestVersion
 * @property {Object} public
 * @property {Object} public.Tables
 * @property {Object} public.Enums
 * @property {("admin" | "patient" | "doctor")} public.Enums.app_role
 */

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "patient", "doctor"],
    },
  },
};

