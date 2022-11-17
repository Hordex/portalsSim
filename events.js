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
        if (this.TimePassed >= this.Duration) {
            this.EndEvent();
        }
    }
    StartEvent() {
        this.TimePassed = this.ParentSimState.Time - this.StartTime;
        this.Started = true;
        this.Tick(0);
    }
    EndEvent() {
        this.Done = true;
    }
}




class RotatePlayerPortalEvent extends SimEvent {
    Tick(ticks) {
        this.TimePassed += ticks;
        let timeParam = Math.min(Math.max(this.TimePassed / this.Duration, 0), 1);
        let end = this.ParentSimState.Scenario.PlayerRotation === Rotations.cw ? 90 : -90;
        this.ParentSimState.Player.PersonalPortal.RotateTeleport(end * timeParam);
        if (this.TimePassed >= this.Duration) {
            this.EndEvent();
        }
    }
}


class RotateFieldPortals extends SimEvent {
    Tick(ticks) {
        this.TimePassed += ticks;
        for (let sceneObject of this.ParentSimState.Objects) {
            if (!sceneObject instanceof Portal) {
                continue;
            }

            let timeParam = Math.min(Math.max(this.TimePassed / this.Duration, 0), 1);
            let end = sceneObject.Mechanic === Rotations.cw ? 90 : -90;
            sceneObject.RotateTeleport(end * timeParam);
        }
        if (this.TimePassed >= this.Duration) {
            super.EndEvent();
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
    StartEvent() {
        this.bSuccess = false;
        let playerPos = this.ParentSimState.Player.Position;
        this.EndPos = playerPos;
        for (let sceneObject of this.ParentSimState.Objects) {
            if (!sceneObject instanceof Portal) {
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
        }

        super.StartEvent();
    }
    Tick(ticks) {
        this.TimePassed += ticks;

        if (this.bSuccess) {
            let timeParam = Math.min(Math.max(this.TimePassed / this.Duration, 0), 1);
            this.ParentSimState.Player.Teleport(this.StartPos.Multiply(1 - timeParam).Add(this.EndPos.Multiply(timeParam)));
        }

        if (this.TimePassed >= this.Duration) {
            this.EndEvent();
        }
    }
    EndEvent() {
        for (let object of this.ParentSimState.Objects) {
            if (!object instanceof Portal) {
                continue;
            }

            object.SetVisibility(false);
        }

        super.EndEvent();
    }
}

class ShowFieldPortals extends SimEvent{

}


