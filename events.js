class SimEvent {
    constructor(startTime, duration, parentSimState) {
        this.StartTime = startTime;
        this.Duration = duration;
        this.ParentSimState = parentSimState;
        this.TimePassed = this.ParentSimState.Time - this.StartTime;
        this.Started = false;
    }
    Tick(ticks) {
        this.TimePassed += ticks;
        this.TickImpl();
        if (this.TimePassed >= this.Duration) {
            this.EndEvent();
        }
    }
    StartEvent() {
        this.TimePassed = this.ParentSimState.Time - this.StartTime;
        this.Started = true;
        this.OnStart();
        this.Tick(0);
    }
    EndEvent() {
        this.OnEnd();
        this.Done = true;
    }
    OnStart(){

    }
    OnEnd(){

    }
    TickImpl(){

    }
}




class RotatePlayerPortalEvent extends SimEvent {
    TickImpl() {
        let timeParam = Math.min(Math.max(this.TimePassed / this.Duration, 0), 1);
        let end = this.ParentSimState.Scenario.PlayerRotation === Rotations.cw ? 90 : -90;
        this.ParentSimState.Player.PersonalPortal.RotateTeleport(end * timeParam);
    }
}


class RotateFieldPortals extends SimEvent {
    TickImpl() {
        for (let sceneObject of this.ParentSimState.Objects) {
            if (!(sceneObject instanceof Portal)) {
                continue;
            }

            let timeParam = Math.min(Math.max(this.TimePassed / this.Duration, 0), 1);
            let end = sceneObject.Mechanic === Rotations.cw ? 90 : -90;
            sceneObject.RotateTeleport(end * timeParam);
        }
    }
}


class ValidateTeleport extends SimEvent {
    constructor(startTime, duration, parentSimState) {
        super(startTime, duration, parentSimState);
        this.StartPos = new Point(0,0);
        this.EndPos = new Point(0,0);
        this.bSuccess = false;
    }
    OnStart() {
        this.bSuccess = false;
        let playerPos = this.ParentSimState.Player.Position;
        this.EndPos = playerPos;
        for (let sceneObject of this.ParentSimState.Objects) {
            if (!(sceneObject instanceof Portal)) {
                continue;
            }

            if (sceneObject.IsOverlapping(playerPos)) {
                this.StartPos = playerPos;
                let TravelOffset = sceneObject.Offset.Rotate(sceneObject.Rotation);
                if (!Circle.prototype.IsOverlapping.call(sceneObject, playerPos)) {
                    TravelOffset = TravelOffset.Multiply(-1);
                }
                this.EndPos = this.StartPos.Add(TravelOffset);
                this.bSuccess = true;
                break;
            }

        }

        if (!this.bSuccess) {
            this.ParentSimState.Fail("Didn't use teleport. DEATH");
            return;
        }
        this.ParentSimState.bUseInput = false;
    }
    TickImpl() {
        if (this.bSuccess) {
            let timeParam = Math.min(Math.max(this.TimePassed / this.Duration, 0), 1);
            this.ParentSimState.Player.Teleport(this.StartPos.Multiply(1 - timeParam).Add(this.EndPos.Multiply(timeParam)));
        }
    }
    OnEnd() {
        for (let object of this.ParentSimState.Objects) {
            if (!(object instanceof Portal)) {
                continue;
            }

            object.SetVisibility(false);
        }
        this.ParentSimState.bUseInput = true;
    }
}

class CastEvent extends SimEvent{
    constructor(startTime, duration, parentSimState, name){
        super(startTime, duration, parentSimState);
        this.CastName = name;
    }
    OnStart(){
        this.ParentSimState.Cast.Activate(this.CastName);
    }
    TickImpl(){
        this.ParentSimState.Cast.SetProgress(this.TimePassed / this.Duration);
    }
}

class ShowFieldObjects extends CastEvent{
    OnEnd(){
        for (let sceneObject of this.ParentSimState.Objects) {
            if (!(sceneObject instanceof Portal)) {
                continue;
            }

            sceneObject.SetVisibility(true);
        }
    }
}

class ChargeStaves extends CastEvent {

}

class ShowMechanics extends CastEvent {
    OnEnd(){
        this.ParentSimState.Player.SetPortalVisibility(true);
        for (let sceneObject of this.ParentSimState.Objects) {
            if (!(sceneObject instanceof Portal)) {
                continue;
            }

            sceneObject.SetMarkerVisibility(true);
        }
    }
}

class ActivateDeathZones extends CastEvent {
    OnEnd(){
        for (let sceneObject of this.ParentSimState.Objects) {
            if (!(sceneObject instanceof Rectangle)) {
                continue;
            }

            sceneObject.SetVisibility(true);
        }
    }
}

class ApplyStatus extends SimEvent {
    constructor(startTime, duration, parentSimState,name,image){
        super(startTime, duration, parentSimState);
        this.Status = new Status(name,image,duration);
    }
    OnStart(){
        this.ParentSimState.Player.Statuses.push(this.Status);
    }
    TickImpl(){
        this.Status.Duration = Math.max(0, this.Duration - this.TimePassed);
    }
    OnEnd(){
        let index = this.ParentSimState.Player.Statuses.indexOf(this.Status);
        if(index > -1){
            this.ParentSimState.Player.Statuses.splice(index,1);
        }
    }
}

class Cleave extends ApplyStatus{

}

class ShowBots extends ApplyStatus{
    constructor(startTime, duration, parentSimState,playerBait){
        super(startTime, duration, parentSimState);
        this.PlayerBait = playerBait;
    }
    OnStart(){
        let pos = 0;
        let positions = [];
        let PlayerPosition = this.ParentSimState.Scenario[this.PlayerBait];
        for (const position in BaitPositionCalls) {
            if (Object.hasOwnProperty.call(BaitPositionCalls, position)) {
                positions.push(BaitPositionCalls[position]);
            }
        }

        for (let Bot of this.ParentSimState.Bots) {
            Bot.SetVisibility(true);
            if(positions[pos] === PlayerPosition){
                pos+=1;
            }
            Bot.Teleport(BaitPositions[positions[pos]]);
            pos+=1;
        }
    }
    OnEnd(){
        for (let Bot of this.ParentSimState.Bots) {
            Bot.SetVisibility(false);
        }
    }
}



class UsePlayerTeleport extends SimEvent {
    OnStart(){
        let playerPos = this.ParentSimState.Player.Position;
        this.StartPos = playerPos;
        let offset = this.ParentSimState.Player.PersonalPortal.Offset.Rotate(this.ParentSimState.Player.PersonalPortal.Rotation);
        this.EndPos = this.StartPos.Add(offset);
        this.PortalStartPos = this.ParentSimState.Player.PersonalPortal.Position.Multiply(1);
        this.PortalEndPos = this.ParentSimState.Player.PersonalPortal.Position.Subtract(offset);
        this.ParentSimState.bUsinput = false;
    }
    TickImpl(){
        let timeParam = Math.min(Math.max(this.TimePassed / this.Duration, 0), 1);
        this.ParentSimState.Player.Teleport(this.StartPos.Multiply(1 - timeParam).Add(this.EndPos.Multiply(timeParam)));
        this.ParentSimState.Player.PersonalPortal.Teleport(this.PortalStartPos.Multiply(1 - timeParam).Add(this.PortalEndPos.Multiply(timeParam)));
    }
    OnEnd(){
        this.ParentSimState.Player.SetPortalVisibility(false);
        this.ParentSimState.bUsinput = true;
    }
}

class Win extends SimEvent {
    OnStart(){
        for (let sceneObject of this.ParentSimState.Objects) {
            sceneObject.SetVisibility(false);
        }

        let YouWin = document.createElement("div");
        YouWin.textContent = "YOU WIN";
        YouWin.style.fontFamily = "sans-serif"
        YouWin.style.fontSize = "9em"
        YouWin.style.position = "fixed"
        YouWin.style.transform = "translate(-50%, -50%)"
        YouWin.style.left = "50%"
        YouWin.style.top = "50%"
        GetObjectContainer().appendChild(YouWin);
    }
}