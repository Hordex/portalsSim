class SimulationState {
    constructor() {
        this.Clear();
    }
    Clear(){
        this.Scenario = null;
        this.Bounds = new AABB(new Point(0, 0), new Point(SimSettings.arenaWidth, SimSettings.arenaHeight));
        this.Objects = [];
        this.Player = null;
        this.Bots = [];
        this.Time = 0;
        this.EventQueue = [
            new ShowFieldObjects(0, 3700, this,"Infern Brand"),
            new ChargeStaves(8100,3700,this,"Infern Wave"),
            new ShowMechanics(16500,3700,this,"Banishment"),
            new ApplyStatus(16500+3700,12000, this,"Call of the Portal","tp_floor.png"),
            new ApplyStatus(16500+3700,20000, this,"Rite of Passage","tp_self.png"),
            new ActivateDeathZones(24500,3700,this,"Infern Ward"),
            new RotateFieldPortals(30700,1000, this),
            new ValidateTeleport(31800,500, this),
            new ShowBots(34500,6000,this,"PlayerBait1"),
            new Cleave(36500,2000,this,"Magic Vuln","mvuln.png"),
            new ApplyStatus(37500,5000, this,"Stun","stun.png"),
            new RotatePlayerPortalEvent(38500,1000, this),
            new UsePlayerTeleport(40500,1000, this),
            new ShowBots(42500,9000,this,"PlayerBait2"),
            new Cleave(44500,2000,this,"Magic Vuln","mvuln.png"),
            new Win(47000,0,this),
        ];
        this.OngoingEvents = [];
        this.Cast = new Cast();
        this.bUseInput = true;
    }

    Init(inScenario,bSkipToBanishment) {
        this.Clear();
        if(bSkipToBanishment){
            this.Time = 14000;
        }
        this.Scenario = inScenario;
        this.Player = new Player(new Point(SimSettings.arenaWidth, SimSettings.arenaHeight).Multiply( 0.5 ));
        this.Player.AddPortal(inScenario.PlayerDirection, inScenario.PlayerRotation);
        this.Player.SetPortalVisibility(false);
        this.Bots = [
            new Character(new Point(0, 0)),
            new Character(new Point(0, SimSettings.arenaHeight)),
            new Character(new Point(SimSettings.arenaWidth, SimSettings.arenaHeight))
        ];
        this.Objects = [
            this.SpawnPortal(SimSettings.arenaHeight - 0.5, this.Scenario.NorthSafePortal, this.Scenario.NorthSafeRotation),
            this.SpawnPortal(SimSettings.arenaHeight - 0.5, this.Scenario.NorthFakePortal, this.Scenario.NorthFakeRotation),
            this.SpawnPortal(0.5, this.Scenario.SouthSafePortal, this.Scenario.SouthSafeRotation),
            this.SpawnPortal(0.5, this.Scenario.SouthFakePortal, this.Scenario.SouthFakeRotation),
            this.SpawnDeathLaser(1),
            this.SpawnDeathLaser(2),
            this.SpawnDeathLaser(3),
        ];

        for (let sceneObject of this.Objects) {
            sceneObject.SetVisibility(false);
            if(sceneObject instanceof Portal){
                sceneObject.SetMarkerVisibility(false);
            }
        }
    }
    Fail(reason) {
        Messages.push(reason);
        CancelSimulation();
    }
    CheckArenaBounds() {
        if (!this.Bounds.IsPointIn(this.Player.Position)) {
            this.Fail("Walked into death wall. SLOW DEATH");
        }
    }
    SpawnPortal(Y, number, mechanic) {
        const X = [
            SimSettings.portalDiameter / 2,
            SimSettings.portalDiameter / 2 + 1,
            SimSettings.arenaWidth - SimSettings.portalDiameter / 2 - 1,
            SimSettings.arenaWidth - SimSettings.portalDiameter / 2
        ];
        let direction = (number % 2) === 0 ? PortalDirections.east : PortalDirections.west;
        return new Portal(new Point(X[number], Y), direction, false, mechanic);
    }
    SpawnDeathLaser(Y){
        let deathZone = new Rectangle(new Point(0,Y-SimSettings.laserOffset),0, new Point(SimSettings.arenaWidth,2 * SimSettings.laserOffset));
        deathZone.SetVisibility(false);
        return deathZone;
    }
    Tick(input, time) {
        this.Time += time;
        if(this.bUseInput && this.Player.CanMove()){
            let beforePos = CurrentSimulationState.Player.Position;
            CurrentSimulationState.Player.Move(input.Multiply(SimSettings.playerSpeed * time / 1000));
            let afterPos = CurrentSimulationState.Player.Position;
            for (const sceneObject of this.Objects) {
                if(sceneObject instanceof Rectangle && sceneObject.Visible){
                    if(sceneObject.IntersectLine(beforePos,afterPos)){
                        this.Fail("Walked into laser. DEATH");
                    }
                }
            }
        }
        this.CheckArenaBounds();

        for (let oldEvent of this.OngoingEvents) {
            oldEvent.Tick(time);
        }

        for (let newEvent of this.EventQueue) {
            if (newEvent.StartTime <= this.Time) {
                if (newEvent.Duration > 0) {
                    this.OngoingEvents.push(newEvent);
                }
                newEvent.StartEvent();
            }
        }

        this.OngoingEvents = this.OngoingEvents.filter(item => !item.Done);
        this.EventQueue = this.EventQueue.filter(item => !item.Started);
    }
}

let MoveVectors = {
    up : new Point(0,1),
    down : new Point(0,-1),
    left : new Point(-1,0),
    right : new Point(1,0)
}

let SimObjectIDGen = 0;

// === SimObject
class SimObject {
    constructor(position, rotation) {
        this.Position = position;
        this.Rotation = rotation;
        this.bDirty = false;
        this.ID = "SimObject" + SimObjectIDGen;
        SimObjectIDGen += 1;
        this.RenderOffsetX = 0;
        this.RenderOffsetY = 0;
        this.Visible = true;
    }
    SetVisibility(visibility) {
        this.bDirty = visibility !== this.Visible;
        this.Visible = visibility;
    }
    Move(moveVector) {
        let tmpPos = this.Position;
        this.Position = tmpPos.Add(moveVector);
        this.bDirty = true;
    }
    Teleport(newPosition) {
        this.Position = newPosition;
        this.bDirty = true;
    }
    Rotate(rotor) {
        this.Rotation += rotor;
        this.bDirty = true;
    }
    RotateTeleport(rotor) {
        this.Rotation = rotor;
        this.bDirty = true;
    }
}






// === Rectangle

class Rectangle extends SimObject{
    constructor(position, rotation, size) {
        super(position, rotation);
        this.LocalBB = new AABB(new Point(0, 0), size);
    }
    IsOverlapping(position) {
        return this.LocalBB.IsPointIn((position.Subtract(this.Position)).Rotate(-this.Rotation));
    }
    IntersectLine(startPos,endPos){
        if(this.IsOverlapping(startPos) || this.IsOverlapping(endPos)){
            return true;
        }
        let localStartPos = (startPos.Subtract(this.Position)).Rotate(-this.Rotation);
        let localEndPos = (endPos.Subtract(this.Position)).Rotate(-this.Rotation);
        return this.LocalBB.DoesLineIntersect(localStartPos,localEndPos);
    }
}

// === Circle

class Circle extends SimObject{
    constructor(postion, radius) {
        super(postion, 0);
        this.Radius = radius;
    }
    IsOverlapping(position) {
        return (position.Subtract(this.Position)).LengthSquared() <= this.Radius * this.Radius;
    }
}


// === Character

class Character extends SimObject{
    constructor(position) {
        super(position, 0);
        this.Visible = false;
    }
}

// === Player

class Player extends Character{
    constructor(position){
        super(position);
        this.PersonalPortal = null;
        this.Statuses = [];
        this.Visible = true;
    }
    AddPortal(direction, rotation) {
        this.PersonalPortal = new Portal(new Point(0, SimSettings.arenaHeight), direction, true, rotation);
    }
    SetPortalVisibility(visibility){
        this.bDirty = true;
        this.PersonalPortal.SetVisibility(visibility);
        this.PersonalPortal.SetMarkerVisibility(visibility);
    }
    Move(moveVector){
        super.Move(moveVector);
    }
    CanMove(){
        return !this.Statuses.some(item => item.Name === "Stun");
    }
}

// === Portal

class Portal extends Circle{
    constructor(position, direction, InbPlayer, mechanic) {
        super(position, SimSettings.portalDiameter / 2);
        this.Mechanic = mechanic === Rotations.cw ? mechanic : Rotations.ccw;
        if (direction === PortalDirections.east) {
            this.Offset = new Point(1, 0);
        } else {
            this.Offset = new Point(-1, 0);
        }
        this.bPlayer = InbPlayer;
        this.LinkedEndpoint = new Circle(position.Add(this.Offset), SimSettings.portalDiameter / 2);
        this.Bridge = new SimObject(new Point(0, 0), 0);
        this.MechanicMarker = new SimObject(new Point(0, 0), 0);
    }
    Rotate(rotor) {
        super.Rotate(rotor);
        this.LinkedEndpoint.Teleport(this.Position.Add(this.Offset.Rotate(rotor)));
    }
    Move(moveVector) {
        super.Move(moveVector);
        this.LinkedEndpoint.Move(moveVector);
    }
    Teleport(newPosition) {
        super.Teleport(newPosition);
        this.LinkedEndpoint.Teleport(this.Position.Add(this.Offset));
    }
    RotateTeleport(rotor) {
        super.RotateTeleport(rotor);
        this.LinkedEndpoint.Teleport(this.Position.Add(this.Offset.Rotate(rotor)));
    }
    IsOverlapping(position) {
        return super.IsOverlapping(position) || this.LinkedEndpoint.IsOverlapping(position);
    }
    SetVisibility(visibility) {
        this.bDirty = visibility !== this.Visible;
        this.Visible = visibility;
        this.Bridge.SetVisibility(visibility);
        this.LinkedEndpoint.SetVisibility(visibility);
        if(!this.Visible){
            this.SetMarkerVisibility(this.Visible);
        }
    }
    SetMarkerVisibility(visibility){
        this.bDirty = true;
        this.MechanicMarker.SetVisibility(visibility);
    }
}

class Cast {
    constructor(){
        this.Name = "";
        this.Active = false;
        this.bDirty = true;
        this.Progress = 0;
    }
    SetProgress(newProgress){
        this.Progress = Math.min(Math.max(newProgress,0),1);
        this.bDirty = true;
        if(this.Progress >= 1){
            this.Deactivate();
        }
    }
    Deactivate(){
        this.Active = false;
        this.bDirty = true;
    }
    Activate(name){
        this.Progress = 0;
        this.Name = name;
        this.Active = true;
        this.bDirty = true;
    }
}

class Status {
    constructor(name,image,duration){
        this.Name = name;
        this.Image = image;
        this.Duration = duration;
    }
    GetDurationString(){
        let tmpDuration = Math.round(this.Duration/1000);
        return tmpDuration > 0 ? tmpDuration.toString() : "";
    }
}