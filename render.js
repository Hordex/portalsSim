function UpdateArena(){
    let arena = GetObject("arena");
    arena.style.aspectRatio = SimSettings.arenaWidth + "/" + SimSettings.arenaHeight;
    arena.style.width = SimSettings.arenaWidth * SimSettings.unitSize + "px";
    arena.style.margin = SimSettings.marginTop * SimSettings.unitSize + "px " + SimSettings.marginRight * SimSettings.unitSize + "px";
}