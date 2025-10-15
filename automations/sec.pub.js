/**
 * @param {string} inputFileContents
*/
async function checkSecurityRules(inputFileContents) {
    let allowed = true;

    let layers = 0;
    for (let i = 0; i < inputFileContents.length; i++) {
        if (inputFileContents[i] === '{') layers++;
        if (inputFileContents[i] === '}') {
            layers--;
            if (layers < 0) allowed = false; // Dont allow escaping the function
        };
    }

    return allowed;
}

/**
 * @type {{ id?: string, code?: string, modules: string[] }[]}
*/
const requireAllowedEvents = []; // Events that are allowed to use require statements

module.exports = {checkSecurityRules,requireAllowedEvents};