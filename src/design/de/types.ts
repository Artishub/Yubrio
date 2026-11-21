// `exact` maps an English text to its German text. `patterns` handle texts with a value in
// them: the pattern matches the whole English text and the replacement may use $1, $2.
export type German = { exact: Record<string, string>; patterns: [RegExp, string][] };
