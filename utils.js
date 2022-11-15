let SimSettings = {
    unitSize:150,
    arenaWidth:3,
    arenaHeight:4,
    marginTop:0.55,
    marginRight:0.2,
    portalDiameter:0.35,
    playerSpeed:1,
    playerDiameter:0.1,
    laserOffset: 0.1
}

function GetObject(ID){
    let element = document.getElementById(ID);
    console.assert(element !== undefined,"Object " + ID + " not found!");
    return element;
}