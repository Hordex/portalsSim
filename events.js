function SimEvent(startTime, duration, parentSimState){
    this.StartTime = startTime;
    this.Duration = duration;
    this.ParentSimState = parentSimState;
    this.TimePassed = this.ParentSimState.Time - this.StartTime;
}

SimEvent.prototype.Tick = function(ticks){
    this.TimePassed += ticks;
    if(this.TimePassed >= this.Duration){
        this.EndEvent();
    }
}

SimEvent.prototype.StartEvent = function(){
    this.TimePassed = this.ParentSimState.Time - this.StartTime;
    this.Started = true;
    this.Tick(0);
}

SimEvent.prototype.EndEvent = function(){
    this.Done = true;
}

function RotatePlayerPortalEvent(startTime, duration, parentSimState){
    SimEvent.call(this,startTime,duration, parentSimState);
}

RotatePlayerPortalEvent.prototype = Object.create(SimEvent.prototype);
RotatePlayerPortalEvent.prototype.constructor = RotatePlayerPortalEvent;

RotatePlayerPortalEvent.prototype.Tick = function(ticks){
    this.TimePassed += ticks;
    let timeParam = Math.min(Math.max(this.TimePassed / this.Duration,0),1);
    let end = this.ParentSimState.Scenario.PlayerRotation === Rotations.cw ? 90 : -90;
    this.ParentSimState.Player.PersonalPortal.RotateTeleport(end * timeParam);
    if(this.TimePassed >= this.Duration){
        this.EndEvent();
    }
}

function RotateFieldPortals(startTime, duration, parentSimState){
    SimEvent.call(this,startTime,duration, parentSimState);
}

RotateFieldPortals.prototype = Object.create(SimEvent.prototype);
RotateFieldPortals.prototype.constructor = RotateFieldPortals;

RotateFieldPortals.prototype.Tick = function(ticks){
    this.TimePassed += ticks;
    for (object of this.ParentSimState.Objects) {
        if(! object instanceof Portal){
            continue;
        }

        let timeParam = Math.min(Math.max(this.TimePassed / this.Duration,0),1);
        let end = object.Mechanic === Rotations.cw ? 90 : -90;
        object.RotateTeleport(end * timeParam);
    }
    if(this.TimePassed >= this.Duration){
        this.EndEvent();
    }
}

function ValidateTeleport(startTime, duration, parentSimState){
    SimEvent.call(this,startTime,duration, parentSimState);
}

ValidateTeleport.prototype = Object.create(SimEvent.prototype);
ValidateTeleport.prototype.constructor = ValidateTeleport;

ValidateTeleport.prototype.StartEvent = function(){
    let bSuccess = false;
    let playerPos = this.ParentSimState.Player.Position;
    for (object of this.ParentSimState.Objects) {
        if(! object instanceof Portal){
            continue;
        }

        if(object.IsOverlapping(playerPos)){
            bSuccess = true;
            break;
        }
    }

    if(!bSuccess){
        this.ParentSimState.Fail("Didn't use teleport. DEATH");
    }

    SimEvent.prototype.StartEvent.call(this);
}