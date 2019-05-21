"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cspell_1 = require("cspell");
const defaultNumSuggestions = 10;
const regexJoinedWords = /[+]/g;
const maxWordLengthForSuggestions = 20;
const wordLengthForLimitingSuggestions = 15;
const maxNumberOfSuggestionsForLongWords = 1;
const maxEdits = 3;
class SuggestionGenerator {
    constructor(getSettings) {
        this.getSettings = getSettings;
    }
    async genSuggestions(doc, word) {
        const settings = await this.getSettings(doc);
        const dictionary = await cspell_1.getDictionary(settings);
        const { numSuggestions = defaultNumSuggestions } = settings;
        if (word.length > maxWordLengthForSuggestions) {
            return [];
        }
        const numSugs = word.length > wordLengthForLimitingSuggestions ? maxNumberOfSuggestionsForLongWords : numSuggestions;
        const numEdits = maxEdits;
        // Turn off compound suggestions for now until it works a bit better.
        return dictionary.suggest(word, numSugs, cspell_1.CompoundWordsMethod.NONE, numEdits);
    }
    async genWordSuggestions(doc, word) {
        return (await this.genSuggestions(doc, word)).map(sr => sr.word.replace(regexJoinedWords, ''));
    }
}
exports.SuggestionGenerator = SuggestionGenerator;
//# sourceMappingURL=suggestions.js.map