function UpdateArena(){
    let arena = GetObject("arena");
    arena.style.aspectRatio = SimSettings.arenaWidth + "/" + SimSettings.arenaHeight;
    arena.style.width = SimSettings.arenaWidth * SimSettings.unitSize + "px";
    arena.style.margin = SimSettings.marginTop * SimSettings.unitSize + "px " + SimSettings.marginRight * SimSettings.unitSize + "px";
}

function createDropdownOption(option){
    let inputElement = document.createElement("option");
    inputElement.value = option;
    inputElement.innerText = option;
    return inputElement;
}

function CreateDropdowns(ID, description, options){
    let container = document.createElement("div");
    container.id = ID + "container";

    let selectElement = document.createElement("select");
    selectElement.id = ID;
    selectElement.name = ID;
    container.appendChild(selectElement);

    let optionLabel = document.createElement("label");
    optionLabel.innerText = description;
    optionLabel.for = ID;
    optionLabel.style.marginLeft = "5px";
    container.appendChild(optionLabel);

    for (const option of options) {
        selectElement.appendChild(createDropdownOption(option));
    }

    return container;
}

function AddButton(ID,description,delegate){
    let newButton = document.createElement("button");
    newButton.innerText = description;
    newButton.id = ID;
    newButton.onclick = delegate;
    return newButton;
}

const ButtonTexts = {
    play:"PLAY",
    pause:"PAUSE",
    cancel:"CANCEL"
}

function PrepareUI(){
    let SettingsPanel = document.getElementById("Settings");

    SettingsPanel.appendChild(AddButton(OptionsNames.toggleButton,ButtonTexts.play,ToggleSimulation));
    SettingsPanel.appendChild(AddButton(OptionsNames.cancelButton,ButtonTexts.cancel,CancelSimulation));

    SettingsPanel.appendChild(CreateDropdowns(OptionsNames.northSafePortalOption,"Safe portal north",["random",1,2,3,4]));
    SettingsPanel.appendChild(CreateDropdowns(OptionsNames.southSafePortalOption,"Safe portal south",["random",1,2,3,4]));
    SettingsPanel.appendChild(CreateDropdowns(OptionsNames.playerRotationOption,"Rotation on player's portal",["random",Rotations.cw,Rotations.ccw]));
    SettingsPanel.appendChild(CreateDropdowns(OptionsNames.playerDirectionOption,"Initial direction of player portal",["random",PortalDirections.west,PortalDirections.east]));
    SettingsPanel.appendChild(CreateDropdowns(OptionsNames.staffOrderOption,"First staves cleaving",["random",StaffBooms.inner,StaffBooms.outer]));
}

function UpdateButtons(){
    if(bSimulating){
        document.getElementById(OptionsNames.toggleButton).innerText = ButtonTexts.pause;
        document.getElementById(OptionsNames.cancelButton).style.visibility = "visible";
    } else {
        document.getElementById(OptionsNames.toggleButton).innerText = ButtonTexts.play;
        if(bRestart){
            document.getElementById(OptionsNames.cancelButton).style.visibility = "hidden";
        } else {
            document.getElementById(OptionsNames.cancelButton).style.visibility = "visible";
        }
    }
}

function GetObjectContainer(){
    return document.getElementById("ObjectContainer");
}

function GetLogContainer(){
    return document.getElementById("FailStates");
}

function DeleteObjects(){
    GetObjectContainer().replaceChildren();
    GetLogContainer().replaceChildren();
}

function SetPosition(inSimObject){
    let object = document.getElementById(inSimObject.ID);
    object.style.top = (SimSettings.unitSize * (SimSettings.arenaHeight - inSimObject.Position.Y) + inSimObject.RenderOffsetY) + "px";
    object.style.left = (SimSettings.unitSize * inSimObject.Position.X + inSimObject.RenderOffsetX) + "px";
}

function CreateRenderState(inSimulationState){
    let container = GetObjectContainer();

    let palyerData = inSimulationState.Player;
    let playerAvatar = document.createElement("div");
    palyerData.RenderOffsetX = -(SimSettings.unitSize * SimSettings.playerDiameter) / 2;
    palyerData.RenderOffsetY = -(SimSettings.unitSize * SimSettings.playerDiameter) / 2;
    playerAvatar.style.backgroundImage = "url('none.png')";
    playerAvatar.style.position = "absolute";
    playerAvatar.style.width = playerAvatar.style.height = (SimSettings.unitSize * SimSettings.playerDiameter) + "px";
    playerAvatar.style.backgroundSize = "contain";
    playerAvatar.id = palyerData.ID;
    container.appendChild(playerAvatar);
    SetPosition(palyerData);

    for (Bot of inSimulationState.Bots) {
        let BotAvatar = document.createElement("div");
        Bot.RenderOffsetX = -(SimSettings.unitSize * SimSettings.playerDiameter) / 2;
        Bot.RenderOffsetY = -(SimSettings.unitSize * SimSettings.playerDiameter) / 2;
        BotAvatar.style.backgroundImage = "url('ENpcResident.png')";
        BotAvatar.style.position = "absolute";
        BotAvatar.style.width = BotAvatar.style.height = (SimSettings.unitSize * SimSettings.playerDiameter) + "px";
        BotAvatar.style.backgroundSize = "contain";
        BotAvatar.id = Bot.ID;
        container.appendChild(BotAvatar);
        SetPosition(Bot);
    }

}

function RenderObject(inSimObject){
    if(inSimObject.bDirty){
        inSimObject.bDirty = false;
        SetPosition(inSimObject);
    }
}

function RenderSimState(){
    if(!bSimulating){
        return;
    }
    RenderObject(CurrentSimulationState.Player);
    for (Bot of CurrentSimulationState.Bots) {
        RenderObject(Bot);
    }
}

function RenderLog(){
    let Logs = GetLogContainer();
    for (const Message of Messages) {
        let logEntry = document.createElement("div");
        logEntry.innerText = Message;
        if(Logs.children.length > 0){
            Logs.insertBefore(logEntry,Logs.firstChild);
        } else {
            Logs.appendChild(logEntry);
        }
    }
    Messages = [];
}

function RenderUpdate(){
    UpdateButtons(bSimulating);
    RenderLog();
    RenderSimState();
}