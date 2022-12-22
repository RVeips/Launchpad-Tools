function __getCount(parent) {
    var relevantChildren = 0;
    var children = parent.childNodes.length;
    for (var i = 0; i < children; i++) {
        if (parent.childNodes[i].nodeType != 3) {
            relevantChildren += __getCount(parent.childNodes[i], true);
            relevantChildren++;
        }
    }
    return relevantChildren;
}

function Initialize_Footer() {
    const mainDesc = `CFXS LaunchPad Tools v1.0-dev`
    const versionElem = document.getElementById('footerVersion')
    const statElem = document.getElementById('footerStats')
    versionElem.innerText = mainDesc
}