let curTime = new Date();
let bSimulating = false;
let bRestart = true;
let CurrentSimulationState = null;
let Messages = []
let pendingToggle = false;
let pendingReset = false;


function GatherInput(){
    let Result = new Point(0,0);
    for (const KeyCode in KeyCodes) {
        const element = pressedKeys[KeyCode];
        if(element && MoveVectors[KeyCodes[KeyCode]]){
            Result = Result.Add(MoveVectors[KeyCodes[KeyCode]])
        }
    }
    return Result.NormalisedSafe();
}

function TickLogic(ticks){
    pendingReset = pendingReset || pressedKeys[82];
    pendingToggle = pendingToggle || pressedKeys[80];
    if(pendingReset && !pressedKeys[82]){
        pendingReset = false;
        CancelSimulation();
        BeginSimulation();
        return;
    }

    if(pendingToggle && ! pressedKeys[80]){
        pendingToggle = false;
        ToggleSimulation();
    }

    if (!bSimulating){
        return;
    } else {
        CurrentSimulationState.Tick(GatherInput(), ticks);
    }
}

function tick(){
    const newTime = Date.now();
    let ticks = newTime - curTime;
    curTime = newTime;
    TickLogic(ticks);
    RenderUpdate();
}

function GetOption(name){
    let domElement = document.getElementById(name);
    return domElement.value;
}

function BeginSimulation(){
    if(bRestart || CurrentSimulationState == null){
        bRestart = false;
        DeleteObjects();
        CurrentSimulationState = new SimulationState();
        let Scenario = new ScenarioGenerator(
            GetOption(OptionsNames.staffOrderOption),
            GetOption(OptionsNames.northSafePortalOption),
            GetOption(OptionsNames.southSafePortalOption),
            GetOption(OptionsNames.playerRotationOption),
            GetOption(OptionsNames.playerDirectionOption)
            );
        CurrentSimulationState.Init(Scenario);
        CreateRenderState(CurrentSimulationState);
    }
    bSimulating = true;
}

function CancelSimulation(){
    bSimulating = false;
    bRestart = true;
}

function PauseSimulation(){
    bSimulating = false;
}

function ToggleSimulation(){
    if(bSimulating){
        PauseSimulation();
    } else {
        BeginSimulation();
    }
}

function startGame() {
    let fps = 50;
    window.fps = fps;

    UpdateArena();
    PrepareUI();

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