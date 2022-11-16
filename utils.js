let SimSettings = {
    unitSize:150,
    arenaWidth:3,
    arenaHeight:4,
    marginTop:0.55,
    marginRight:0.2,
    portalDiameter:0.35,
    playerSpeed:1,
    playerDiameter:0.2,
    laserOffset: 0.1,
    portalRotaionDiameter: 0.5,
    playerRotationDiameter: 0.4
}

let Moves = {
    up: "up",
    down: "down",
    left:"left",
    right:"right"
}

let KeyCodes = {
    38 : Moves.up,
    37 : Moves.left,
    39 : Moves.right,
    40 : Moves.down,
    87 : Moves.up,
    65 : Moves.left,
    68 : Moves.right,
    83 : Moves.down
}

var pressedKeys = {};
window.onkeyup = function(e) { 
    if(KeyCodes[e.keyCode]){
        pressedKeys[e.keyCode] = false;
    }
}
window.onkeydown = function(e) { 
    if(KeyCodes[e.keyCode]){
        pressedKeys[e.keyCode] = true; 
    }
}

function GetObject(ID){
    let element = document.getElementById(ID);
    console.assert(element !== undefined,"Object " + ID + " not found!");
    return element;
}