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

module.exports = checkSecurityRules;