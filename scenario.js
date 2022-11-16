const OptionsNames = {
    northSafePortalOption:"northSafePortalOption",
    southSafePortalOption:"southSafePortalOption",
    playerRotationOption:"playerRotationOption",
    playerDirectionOption:"playerDirectionOption",
    staffOrderOption:"staffOrderOption",
    toggleButton:"toggleButton",
    cancelButton:"cancelButton"
}

const StaffBooms = {
    inner : "inner",
    outer : "outer"
}

const Rotations = {
    cw : "cw",
    ccw : "ccw"
}

const PortalDirections = {
    east: "east",
    west: "west"
}

const BaitPositionCalls = {
    northOut:"northOut",
    northIn: "northIn",
    southIn: "southIn",
    southOut:"southOut"
} 

const BaitPositions = {
    northOut: new Point(1.5, 3.9),
    northIn: new Point(1.9, 3.8),
    southIn: new Point(2.1, 1.2),
    southOut: new Point(1.5,0.1)
}

const SafePortalConfigurationOrder = [Rotations.cw,Rotations.ccw];

function ValidateStringInput(input, expectations){
    if(input !== undefined && expectations.hasOwnProperty(input.toLowerCase())){
        return input.toLowerCase();
    }
    let possibleKeys = Object.keys(expectations);
    return possibleKeys[Math.floor(Math.random() * possibleKeys.length)];
}

function ValidateNumInput(input, max){
    let fallback = Math.floor(Math.random() * max + 1);
    if(input === undefined) {
        return fallback;
    }
    let value = +input;
    if(!isFinite(value) || value <= 0 || value > max) {
        return fallback;
    }
    return value;
}

function ScenarioGenerator(staffOrder, northSafePortal, southSafePortal, playerRotation, playerDirection){
    this.StaffOrder = ValidateStringInput(staffOrder,StaffBooms);

    this.PlayerRotation = ValidateStringInput(playerRotation,Rotations);
    this.PlayerDirection = ValidateStringInput(playerDirection,PortalDirections);

    this.PlayerBait1 = "";
    this.PlayerBait2 = "";

    if(this.PlayerRotation === Rotations.cw){ // NORTH
        if(this.PlayerDirection === PortalDirections.east){
            this.PlayerBait1 = BaitPositionCalls.northOut;
            this.PlayerBait2 = BaitPositionCalls.northIn;
        } else {
            this.PlayerBait1 = BaitPositionCalls.northIn;
            this.PlayerBait2 = BaitPositionCalls.northOut;
        }
    } else { // SOUTH
        if(this.PlayerDirection === PortalDirections.east){
            this.PlayerBait1 = BaitPositionCalls.southOut;
            this.PlayerBait2 = BaitPositionCalls.southIn;
        } else {
            this.PlayerBait1 = BaitPositionCalls.southIn;
            this.PlayerBait2 = BaitPositionCalls.southOut;
        }
    }

    this.NorthSafePortal = ValidateNumInput(northSafePortal,4)-1;
    this.NorthSafeRotation = SafePortalConfigurationOrder[(this.NorthSafePortal) % 2];
    this.NorthFakePortal = (this.NorthSafePortal + 2) % 4;
    this.NorthFakeRotation = SafePortalConfigurationOrder[(this.NorthFakePortal + 1) % 2];

    this.SouthSafePortal = ValidateNumInput(southSafePortal,4)-1;
    this.SouthSafeRotation = SafePortalConfigurationOrder[(this.SouthSafePortal + 1) % 2];
    this.SouthFakePortal = (this.SouthSafePortal + 2) % 4;
    this.SouthFakeRotation = SafePortalConfigurationOrder[(this.SouthFakePortal) % 2];
}