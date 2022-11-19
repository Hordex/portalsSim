function MakeMarker(url,position){
    let Marker = document.createElement("div");
    Marker.style.backgroundImage = `url('${url}')`;
    Marker.style.backgroundSize = "contain";
    Marker.style.transform = "translate(-50%,-50%)";
    Marker.style.position = "absolute";
    Marker.style.top = (SimSettings.unitSize * (SimSettings.arenaHeight - position.Y)) + "px";
    Marker.style.left = (SimSettings.unitSize * position.X) + "px";
    Marker.style.width = Marker.style.height = SimSettings.portalDiameter * SimSettings.unitSize + "px";
    return Marker;
}

function UpdateArena(){
    let arena = GetObject("arena");
    arena.style.aspectRatio = SimSettings.arenaWidth + "/" + SimSettings.arenaHeight;
    arena.style.width = SimSettings.arenaWidth * SimSettings.unitSize + "px";
    arena.style.margin = SimSettings.marginTop * SimSettings.unitSize + "px " + SimSettings.marginRight * SimSettings.unitSize + "px";

    arena.insertBefore(MakeMarker("M1.png",BaitPositions[BaitPositionCalls.northIn]),arena.firstChild);
    arena.insertBefore(MakeMarker("MA.png",BaitPositions[BaitPositionCalls.northOut]),arena.firstChild);
    arena.insertBefore(MakeMarker("M3.png",BaitPositions[BaitPositionCalls.southIn]),arena.firstChild);
    arena.insertBefore(MakeMarker("MC.png",BaitPositions[BaitPositionCalls.southOut]),arena.firstChild);
    arena.insertBefore(MakeMarker("M2.png",new Point(0.5,0.5)),arena.firstChild);
    arena.insertBefore(MakeMarker("M4.png",new Point(2.5, 3.5)),arena.firstChild);
}

function HTMLVisibility(visibility){
    return visibility ? "visible" : "collapse";
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

function CreateCheckBox(ID,description){
    let container = document.createElement("div");
    container.id = ID + "container";

    let checkboxElement = document.createElement("input");
    checkboxElement.type = "checkbox";
    checkboxElement.id = ID;
    checkboxElement.name = ID;
    checkboxElement.checked = true;
    container.appendChild(checkboxElement);

    let optionLabel = document.createElement("label");
    optionLabel.innerText = description;
    optionLabel.for = ID;
    optionLabel.style.marginLeft = "5px";
    container.appendChild(optionLabel);
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
    SettingsPanel.appendChild(CreateCheckBox(OptionsNames.skipToBanishment,"Skip mechanic prep"));
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



function SetVisibility(inSimObject){
    let object = document.getElementById(inSimObject.ID);
    object.style.visibility = HTMLVisibility(inSimObject.Visible);
}

function SetRotation(inSimObject){
    let object = document.getElementById(inSimObject.ID);
    let oldTransform = object.style.transform;
    let splitTransform = oldTransform.split(" ");
    let newRotation = "rotate(" + inSimObject.Rotation + "deg)";
    switch (splitTransform.length) {
        case 0:
            object.style.transform = newRotation;
            break;
        case 1:
            let bIsRotation = oldTransform.includes("rotate");
            if(bIsRotation){
                object.style.transform = newRotation;
            } else {
                splitTransform.push(newRotation)
                object.style.transform = splitTransform.join(" ");
            }
            break;
        default:
            let bFound = false;
            for (let index = 0; index < splitTransform.length; index++) {
                const transform = splitTransform[index];
                if(transform.includes("rotate")){
                    splitTransform[index] = newRotation;
                }
                bFound = true;   
            }
            if(!bFound){
                splitTransform.push(newRotation)
            }
            object.style.transform = splitTransform.join(" ");
            break;
    }
}

function CreateBaseRenderObject(inSimObject){
    let renderObject = document.createElement("div");
    renderObject.style.position = "absolute";
    renderObject.style.backgroundSize = "contain";
    renderObject.id = inSimObject.ID;
    renderObject.style.visibility = HTMLVisibility(inSimObject.Visible);
    return renderObject;
}

function CreatePortalRenderState(inPortal,zTranslate){
    let portalrenderOffset = -SimSettings.portalDiameter * SimSettings.unitSize / 2;
    let PortalBody = CreateBaseRenderObject(inPortal);
    let PortalBridge = CreateBaseRenderObject(inPortal.Bridge);
    PortalBridge.style.backgroundImage = "url('bridge.png')";
    PortalBridge.style.width = (SimSettings.unitSize * inPortal.Offset.Length()) + "px";
    PortalBridge.style.height = (SimSettings.unitSize * SimSettings.portalBridgeHeight) + "px";
    let bridgeRotation = inPortal.Offset.X < 0 ? "rotate(180deg)" : "" ;
    PortalBridge.style.transform = "translateZ("+ (zTranslate - 15) + "px)" + bridgeRotation;
    PortalBridge.style.zIndex = 10;
    let bridgeOffsetX = inPortal.Offset.X < 0 ? - SimSettings.unitSize : 0;
    PortalBridge.style.left = (-portalrenderOffset + bridgeOffsetX) + "px";
    PortalBridge.style.top = (-portalrenderOffset - SimSettings.unitSize * SimSettings.portalBridgeHeight / 2) + "px";
    PortalBody.appendChild(PortalBridge);
    let PortalEndPoint = CreateBaseRenderObject(inPortal.LinkedEndpoint);
    PortalEndPoint.style.backgroundImage = PortalBody.style.backgroundImage = "url('portal.png')";
    PortalEndPoint.style.left = (SimSettings.unitSize * inPortal.Offset.X) + "px";
    PortalBody.appendChild(PortalEndPoint);
    PortalEndPoint.style.width = PortalEndPoint.style.height = PortalBody.style.width = PortalBody.style.height = (SimSettings.unitSize * SimSettings.portalDiameter) + "px";
    PortalBody.style.zIndex = PortalEndPoint.style.zIndex = 50;
    PortalBody.style.transform = PortalEndPoint.style.transform = "translateZ(" + zTranslate + "px)";
    PortalBody.style.transformStyle = "preserve-3d";
    let MechanicMarker = CreateBaseRenderObject(inPortal.MechanicMarker);
    MechanicMarker.style.width  = MechanicMarker.style.height = (SimSettings.portalRotaionDiameter * SimSettings.unitSize) + "px";
    MechanicMarker.style.zIndex = 25;
    MechanicMarker.style.transform = "translateZ(" + (zTranslate - 5) + "px)";
    MechanicMarker.style.backgroundImage = "url('" +  (inPortal.Mechanic === Rotations.cw ? "arrow-circle-orange.png" : "arrow-circle-blue.png") + "')";
    MechanicMarker.style.top = (-portalrenderOffset - SimSettings.portalRotaionDiameter * SimSettings.unitSize /2) +"px";
    MechanicMarker.style.left = (-portalrenderOffset - SimSettings.portalRotaionDiameter * SimSettings.unitSize /2) +"px";
    PortalBody.appendChild(MechanicMarker);
    return PortalBody;
}

function CreateRectangleRenderState(inSimObject){
    let rectnagleBody = CreateBaseRenderObject(inSimObject);
    rectnagleBody.style.width = (SimSettings.unitSize * inSimObject.LocalBB.MaxX) + "px";
    rectnagleBody.style.height = (SimSettings.unitSize * inSimObject.LocalBB.MaxY) + "px";
    rectnagleBody.style.backgroundColor = "red";
    inSimObject.RenderOffsetY = -(SimSettings.unitSize * inSimObject.LocalBB.MaxY);
    return rectnagleBody;
}

function CreateRenderState(inSimulationState){
    let container = GetObjectContainer();

    let palyerData = inSimulationState.Player;
    let playerAvatar = CreateBaseRenderObject(palyerData);
    palyerData.RenderOffsetX = -(SimSettings.unitSize * SimSettings.playerDiameter) / 2;
    palyerData.RenderOffsetY = -(SimSettings.unitSize * SimSettings.playerDiameter) / 2;
    playerAvatar.style.backgroundImage = "url('none.png')";
    playerAvatar.style.width = playerAvatar.style.height = (SimSettings.unitSize * SimSettings.playerDiameter) + "px";
    container.appendChild(playerAvatar);
    let playerPortal = CreatePortalRenderState(palyerData.PersonalPortal,-10);
    playerPortal.firstChild.style.backgroundImage = "url('bridge_player1.png')";
    let portalrenderOffset = -SimSettings.portalDiameter * SimSettings.unitSize / 2;
    palyerData.PersonalPortal.RenderOffsetX = palyerData.PersonalPortal.RenderOffsetY = (portalrenderOffset - palyerData.RenderOffsetX);
    playerPortal.style.left = playerPortal.style.top = (portalrenderOffset - palyerData.RenderOffsetX) + "px";
    playerAvatar.appendChild(playerPortal);
    playerAvatar.style.zIndex = 100;
    playerAvatar.style.transformStyle = "preserve-3d";
    let MechanicMarker = playerPortal.lastChild;
    MechanicMarker.style.width  = MechanicMarker.style.height = (SimSettings.playerRotationDiameter * SimSettings.unitSize) + "px";
    MechanicMarker.style.top = (-portalrenderOffset - SimSettings.playerRotationDiameter * SimSettings.unitSize /2) +"px";
    MechanicMarker.style.left = (-portalrenderOffset - SimSettings.playerRotationDiameter * SimSettings.unitSize /2) +"px";
    SetPosition(palyerData);

    for (Bot of inSimulationState.Bots) {
        let BotAvatar = CreateBaseRenderObject(Bot);
        Bot.RenderOffsetX = -(SimSettings.unitSize * SimSettings.playerDiameter) / 2;
        Bot.RenderOffsetY = -(SimSettings.unitSize * SimSettings.playerDiameter) / 2;
        BotAvatar.style.backgroundImage = "url('ENpcResident.png')";
        BotAvatar.style.width = BotAvatar.style.height = (SimSettings.unitSize * SimSettings.playerDiameter) + "px";
        container.appendChild(BotAvatar);
        SetPosition(Bot);
    }

    for (simObject of CurrentSimulationState.Objects) {
        if(simObject instanceof Portal){
            let portalAvatar = CreatePortalRenderState(simObject,-14);
            simObject.RenderOffsetX = simObject.RenderOffsetY = portalrenderOffset;
            container.appendChild(portalAvatar);
            SetPosition(simObject);
        } else if(simObject instanceof Rectangle){
            let rectangleAvatar = CreateRectangleRenderState(simObject,-14);
            container.appendChild(rectangleAvatar);
            SetPosition(simObject);
        }
    }
}

function RenderObject(inSimObject){
    if(inSimObject.bDirty){
        inSimObject.bDirty = false;
        SetPosition(inSimObject);
        SetRotation(inSimObject);
        SetVisibility(inSimObject);
        if(inSimObject instanceof Portal){
            SetVisibility(inSimObject.Bridge);
            SetVisibility(inSimObject.LinkedEndpoint);
            SetVisibility(inSimObject.MechanicMarker);
        }
    }
}

function RenderCastBar(inCast){
    if(inCast.bDirty){
        inCast.bDirty = false;
        let castContainer = document.getElementById("castbar");
        castContainer.style.visibility = HTMLVisibility(inCast.Active);
        let castLabel = document.getElementById("castLabel");
        castLabel.innerText = inCast.Name.toUpperCase();
        let castProgress = document.getElementById("castProgress");
        castProgress.value = inCast.Progress;
    }
}

function AddStatus(status){
    var statusAvatar = document.createElement("div");
    statusAvatar.id = status.Name;
    statusAvatar.style.float = "left";
    statusAvatar.style.textAlign = "center";
    var statusImage = document.createElement("div");
    statusImage.style.backgroundImage = `url('${status.Image}')`;
    statusImage.style.width = `48px`;
    statusImage.style.height= `64px`;
    statusAvatar.appendChild(statusImage);
    var statusDuration = document.createElement("div");
    statusDuration.style.display = "contents";
    statusAvatar.appendChild(statusDuration);
    RenderStatus(statusAvatar,status);
    return statusAvatar;
}

function RenderStatus(statusAvatar, status){
    statusAvatar.lastChild.innerText = status.GetDurationString();
}

function RenderStatuses(statuses){
    let container = document.getElementById("StatusBar");
    let ChildrenToDelete = []
    for (const child of container.childNodes) {
        if(!child.id) {
            continue;
        }
        if(!statuses.some(status => status.Name === child.id)){
            ChildrenToDelete.push(child.id);
        }
    }
    for (const child of ChildrenToDelete) {
        document.getElementById(child).remove();
    }
    for (const status of statuses) {
        let statusAvatar = document.getElementById(status.Name);
        if(statusAvatar){
            RenderStatus(statusAvatar,status);
        } else {
            container.appendChild(AddStatus(status));
        }
    }
}

function RenderSimState(){
    if(!bSimulating){
        return;
    }
    RenderObject(CurrentSimulationState.Player);
    RenderObject(CurrentSimulationState.Player.PersonalPortal);
    for (Bot of CurrentSimulationState.Bots) {
        RenderObject(Bot);
    }
    for (simObject of CurrentSimulationState.Objects) {
        RenderObject(simObject);
    }
    RenderCastBar(CurrentSimulationState.Cast);
    RenderStatuses(CurrentSimulationState.Player.Statuses);
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