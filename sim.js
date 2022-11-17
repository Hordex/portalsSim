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
            new RotateFieldPortals(10000, 500, this),
            new ValidateTeleport(12000, 500, this),
            new RotatePlayerPortalEvent(12650, 500, this),
        ];
        this.OngoingEvents = [];
    }

    Init(inScenario) {
        this.Clear();
        this.Scenario = inScenario;
        this.Player = new Player(new Point(SimSettings.arenaWidth, SimSettings.arenaHeight).Multiply(Math.random() * 0.5 + 0.25));
        this.Player.AddPortal(inScenario.PlayerDirection, inScenario.PlayerRotation);
        this.Bots = [
            new Character(new Point(0, 0)),
            new Character(new Point(0, SimSettings.arenaHeight)),
            new Character(new Point(SimSettings.arenaWidth, SimSettings.arenaHeight))
        ];
        this.Objects = [
            this.SpawnPortal(SimSettings.arenaHeight - 0.5, this.Scenario.NorthSafePortal, this.Scenario.NorthSafeRotation),
            this.SpawnPortal(SimSettings.arenaHeight - 0.5, this.Scenario.NorthFakePortal, this.Scenario.NorthFakeRotation),
            this.SpawnPortal(0.5, this.Scenario.SouthSafePortal, this.Scenario.SouthSafeRotation),
            this.SpawnPortal(0.5, this.Scenario.SouthFakePortal, this.Scenario.SouthFakeRotation)
        ];
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
    Tick(input, time) {
        this.Time += time;
        CurrentSimulationState.Player.Move(input.Multiply(SimSettings.playerSpeed * time / 1000));
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
        return this.LocalBB.IsPointIn((position - this.Position).Rotate(-this.Rotation));
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
    }
}

// === Player

class Player extends Character{
    constructor(position) {
        super(position, 0);
    }
    AddPortal(direction, rotation) {
        this.PersonalPortal = new Portal(new Point(0, SimSettings.arenaHeight), direction, true, rotation);
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
        super.Move(newPosition);
        this.LinkedEndpoint.Teleport(this.Position.Add(this.Offset));
    }
    RotateTeleport(rotor) {
        super.RotateTeleport(rotor);
        this.LinkedEndpoint.Teleport(this.Position.Add(this.Offset.Rotate(rotor)));
    }
    IsOverlapping(position) {
        return super.IsOverlapping(position) || this.LinkedEndpoint.IsOverlapping(position);
    }
}










