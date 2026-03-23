/**
 * INSTRUCTIONS | LIRE AVANT TOUTE MODIFICATION
 * -----------------------------------------------
 * Les traductions sont segmentées par namespace dans ./fr/
 * Chaque fichier exporte un objet avec les clés de sa section.
 * Ce fichier les réunit en un seul objet exporté.
 */
import common from "./fr/common.js";
import business from "./fr/business.js";
import finances from "./fr/finances.js";
import documents from "./fr/documents.js";
import analysis from "./fr/analysis.js";
import modules from "./fr/modules.js";
import reference from "./fr/reference.js";

export default Object.assign({}, common, business, finances, documents, analysis, modules, reference);
