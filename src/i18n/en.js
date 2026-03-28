/**
 * Translations are split by namespace in ./en/
 * Each file exports keys for its section.
 * This file merges them into a single export.
 */
import common from "./en/common.js";
import business from "./en/business.js";
import finances from "./en/finances.js";
import documents from "./en/documents.js";
import analysis from "./en/analysis.js";
import modules from "./en/modules.js";
import reference from "./en/reference.js";

export default Object.assign({}, common, business, finances, documents, analysis, modules, reference);
