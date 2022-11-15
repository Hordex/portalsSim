function tick(){
    
}

function startGame() {
    let fps = 50;
    window.fps = fps;

    UpdateArena();

    window.doWork = new Worker("interval.js");
    window.doWork.onmessage = function(event) {
        if (event.data === "interval.start") {
            tick();
        }
    };
    doWork.postMessage({ stop: true });
    doWork.postMessage({ start: true, ms: (1000 / fps) });
}

startGame();