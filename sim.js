function SimulationState(){
    this.Scenario = null;
    this.Bounds = new AABB(new Point(0,0),new Point(SimSettings.arenaWidth,SimSettings.arenaHeight));
    this.Objects = [];
    this.Player = null;
    this.Bots = [];
    this.Time = 0;
    this.EventQueue = [ 
        new RotateFieldPortals(4000,1000,this),
        new ValidateTeleport(5500,0,this),
        new RotatePlayerPortalEvent(6000,1000,this),
    ];
    this.OngoingEvents = [];
}

let MoveVectors = {
    up : new Point(0,1),
    down : new Point(0,-1),
    left : new Point(-1,0),
    right : new Point(1,0)
}

let SimObjectIDGen = 0;

// === SimObject
function SimObject(position, rotation){
    this.Position = position;
    this.Rotation = rotation;
    this.bDirty = false;
    this.ID = "SimObject" + SimObjectIDGen;
    SimObjectIDGen += 1;
    this.RenderOffsetX = 0;
    this.RenderOffsetY = 0;
}

SimObject.prototype.Move = function(moveVector){
    let tmpPos = this.Position;
    this.Position = tmpPos.Add(moveVector);
    this.bDirty = true;
}

SimObject.prototype.Teleport = function(newPosition){
    this.Position = newPosition;
    this.bDirty = true;
}

SimObject.prototype.Rotate = function(rotor){
    this.Rotation += rotor;
    this.bDirty = true;
}

SimObject.prototype.RotateTeleport = function(rotor){
    this.Rotation = rotor;
    this.bDirty = true;
}

// === Rectangle

function Rectangle(position, rotation, size){
    SimObject.call(this,position,rotation);
    this.LocalBB = new AABB(new Point(0,0),size);
}

Rectangle.prototype.IsOverlapping = function(position){
    return this.LocalBB.IsPointIn((position - this.Position).Rotate(-this.Rotation));
}

Rectangle.prototype = Object.create(SimObject.prototype);
Rectangle.prototype.constructor = Rectangle;

// === Circle

function Circle(postion, radius){
    SimObject.call(this,postion,0);
    this.Radius = radius;
}

Circle.prototype = Object.create(SimObject.prototype);
Circle.prototype.constructor = Circle;

Circle.prototype.IsOverlapping = function(position){
    return (position.Subtract(this.Position)).LengthSquared() <= this.Radius * this.Radius;
}

// === Character

function Character(position){
    SimObject.call(this,position,0);
}

Character.prototype = Object.create(SimObject.prototype);
Character.prototype.constructor = Character;

// === Player

function Player(position){
    SimObject.call(this,position,0);
}

Player.prototype = Object.create(Character.prototype);
Player.prototype.constructor = Player;

Player.prototype.AddPortal = function(direction,rotation){
    this.PersonalPortal = new Portal(new Point(0,SimSettings.arenaHeight),direction,true,rotation);
}

Player.prototype.Move = function(moveVector){
    SimObject.prototype.Move.call(this,moveVector);
}

Player.prototype.Teleport = function(newPosition){
    SimObject.prototype.Teleport.call(this,newPosition);
}

// === Portal

function Portal(position,direction,InbPlayer,mechanic){
    Circle.call(this,position,SimSettings.portalDiameter/2);
    this.Mechanic = mechanic === Rotations.cw ? mechanic : Rotations.ccw;
    if(direction === PortalDirections.east){
        this.Offset = new Point(1,0);
    } else {
        this.Offset = new Point(-1,0);
    }
    this.bPlayer = InbPlayer;
    this.LinkedEndpoint = new Circle(position.Add(this.Offset),SimSettings.portalDiameter/2);
    this.Bridge = new SimObject(new Point(0,0),0);
    this.MechanicMarker = new SimObject(new Point(0,0),0);
}

Portal.prototype = Object.create(Circle.prototype);
Portal.prototype.constructor = Portal;

Portal.prototype.Rotate = function(rotor){
    SimObject.prototype.Rotate.call(this,rotor);
    this.LinkedEndpoint.Teleport(this.Position.Add(this.Offset.Rotate(rotor)));
}

Portal.prototype.Move = function(moveVector){
    SimObject.prototype.Move.call(this,moveVector);
    this.LinkedEndpoint.Move(moveVector);
}

Portal.prototype.Teleport = function(newPosition){
    SimObject.prototype.Move.call(this,newPosition);
    this.LinkedEndpoint.Teleport(this.Position.Add(this.Offset));
}

Portal.prototype.RotateTeleport = function(rotor){
    SimObject.prototype.RotateTeleport.call(this,rotor);
    this.LinkedEndpoint.Teleport(this.Position.Add(this.Offset.Rotate(rotor)));
}

Portal.prototype.IsOverlapping = function(position){
    return Circle.prototype.IsOverlapping.call(this,position) || this.LinkedEndpoint.IsOverlapping(position);
}

SimulationState.prototype.Init = function(inScenario){
    SimulationState.call(this);
    this.Scenario = inScenario;
    this.Player = new Player(new Point(SimSettings.arenaWidth,SimSettings.arenaHeight).Multiply(Math.random()*0.5 + 0.25));
    this.Player.AddPortal(inScenario.PlayerDirection, inScenario.PlayerRotation);
    this.Bots = [
        new Character(new Point(0,0)),
        new Character(new Point(0,SimSettings.arenaHeight)),
        new Character(new Point(SimSettings.arenaWidth,SimSettings.arenaHeight))
    ];
    this.Objects = [
        this.SpawnPortal(SimSettings.arenaHeight - 0.5,this.Scenario.NorthSafePortal,this.Scenario.NorthSafeRotation),
        this.SpawnPortal(SimSettings.arenaHeight - 0.5,this.Scenario.NorthFakePortal,this.Scenario.NorthFakeRotation),
        this.SpawnPortal(0.5,this.Scenario.SouthSafePortal,this.Scenario.SouthSafeRotation),
        this.SpawnPortal(0.5,this.Scenario.SouthFakePortal,this.Scenario.SouthFakeRotation)
    ];
}

SimulationState.prototype.Fail = function(reason){
    Messages.push(reason);
    CancelSimulation();
}

SimulationState.prototype.CheckArenaBounds = function(){
    if(!this.Bounds.IsPointIn(this.Player.Position)){
        this.Fail("Walked into death wall. SLOW DEATH");
    }
}

SimulationState.prototype.SpawnPortal = function(Y, number, mechanic){
    const X = [
        SimSettings.portalDiameter / 2, 
        SimSettings.portalDiameter / 2 + 1,
        SimSettings.arenaWidth - SimSettings.portalDiameter/2 - 1, 
        SimSettings.arenaWidth - SimSettings.portalDiameter/2 
    ]
    let direction = (number%2) === 0 ? PortalDirections.east : PortalDirections.west;
    return new Portal(new Point(X[number],Y),direction,false,mechanic);
}

SimulationState.prototype.Tick = function(input, time){
    this.Time += time;
    CurrentSimulationState.Player.Move(input.Multiply(SimSettings.playerSpeed * time / 1000));
    this.CheckArenaBounds();

    for (oldEvent of this.OngoingEvents) {
        oldEvent.Tick(time);
    }

    for (newEvent of this.EventQueue) {
        if(newEvent.StartTime <= this.Time){
            if(newEvent.Duration > 0){
                this.OngoingEvents.push(newEvent);
            }
            newEvent.StartEvent();
        }
    }

    this.OngoingEvents = this.OngoingEvents.filter(item => !item.Done);
    this.EventQueue = this.EventQueue.filter(item => !item.Started);
}