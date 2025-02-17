// Important values
var points = new Decimal(10)
var timespeed = new Decimal(1)
var generators = []
var timeGenerators = []
var superGenerators = [];
var lastUpdate = Date.now()
var prestigePoints = new Decimal(0)
// Settings
var soundEnabled = true;
var updateFrequency = 100;


// Construct all generator objects
for(let i = 0; i < 20; i++) {
    i = new Decimal(i)
    let generator = {
        cost: new Decimal(10).pow(i.pow(2)).mul(10),
        bought: new Decimal(0),
        amount: new Decimal(0),
        mult: new Decimal(1),
    }
    generators.push(generator)
}
for(let i = 0; i < 16; i++) {
    i = new Decimal(i)
    let timegenerator = {
        cost: new Decimal(10).pow(i.pow(3)).mul(10000),
        bought: new Decimal(0),
        amount: new Decimal(0),
        mult: new Decimal(0.01),
    }
    timeGenerators.push(timegenerator)
}

// Format Decimal values (this is a huge mess... but i need it)
function exponentialFormat(num, precision, mantissa = true) {
    let e = num.log10().floor()
    let m = num.div(Decimal.pow(10, e))
    if (m.toString() == 10) {
        m = new Decimal(1)
        e = e.add(1)
    }
    e = (e.gte(1e9) ? format(e, 3) : (e.gte(10000) ? commaFormat(e, 0) : e.toString()))
    if (mantissa)
        return m.toStringWithDecimalPlaces(precision) + "e" + e
    else return "e" + e
}

function commaFormat(num, precision) {
    if (num === null || num === undefined) return "NaN"
    let init = num.toString()
    let portions = init.split(".")
    portions[0] = portions[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
    if (portions.length == 1) return portions[0]
    return portions[0] + "." + portions[1]
}


function regularFormat(num, precision) {
    if (num === null || num === undefined) return "NaN"
    return num.toStringWithDecimalPlaces(precision)
}

function fixValue(x, y = 0) {
    return x || new Decimal(y)
}

function sumValues(x) {
    x = Object.values(x)
    if (!x[0]) return new Decimal(0)
    return x.reduce((a, b) => Decimal.add(a, b))
}

function format(decimal, precision = 2) {
    decimal = new Decimal(decimal)
    if (decimal.gte("eeee1000")) {
        var slog = decimal.slog(10)
        if (slog.gte(1e6)) return "F" + format(slog.floor())
        else return Decimal.pow(10, slog.sub(slog.floor())).toString() + "F" + commaFormat(slog.floor(), 0)
    }
    else if (decimal.gte("1e1000000")) return exponentialFormat(decimal, 0, false)
    else if (decimal.gte("1e10000")) return exponentialFormat(decimal, 0)
    else if (decimal.gte(1e9)) return exponentialFormat(decimal, precision)
    else if (decimal.gte(0.0001)) return regularFormat(decimal, precision)
    else if (decimal.eq(0)) return (0).toFixed(precision)

    decimal = invertOOM(decimal)
    let val = ""
    if (decimal.lt("1e1000")){
        val = exponentialFormat(decimal, precision)
        return val.replace(/([^(?:e|F)]*)$/, '-$1')
    }
    else   
        return format(decimal, precision) + "⁻¹"

}

function formatWhole(decimal) {
    decimal = new Decimal(decimal)
    if (decimal.gte(1e9)) return format(decimal, 2)
    if (decimal.lte(0.99) && !decimal.eq(0)) return format(decimal, 2)
    return format(decimal, 0)
}

function formatTime(s) {
    if (s < 60) return format(s) + "s"
    else if (s < 3600) return formatWhole(Math.floor(s / 60)) + "m " + format(s % 60) + "s"
    else if (s < 86400) return formatWhole(Math.floor(s / 3600)) + "h " + formatWhole(Math.floor(s / 60) % 60) + "m " + format(s % 60) + "s"
    else if (s < 31536000) return formatWhole(Math.floor(s / 86400) % 365) + "d " + formatWhole(Math.floor(s / 3600) % 24) + "h " + formatWhole(Math.floor(s / 60) % 60) + "m " + format(s % 60) + "s"
    else return formatWhole(Math.floor(s / 31536000)) + "y " + formatWhole(Math.floor(s / 86400) % 365) + "d " + formatWhole(Math.floor(s / 3600) % 24) + "h " + formatWhole(Math.floor(s / 60) % 60) + "m " + format(s % 60) + "s"
}

function toPlaces(x, precision, maxAccepted) {
    x = new Decimal(x)
    let result = x.toString()
    if (new Decimal(result).gte(maxAccepted)) {
        result = new Decimal(maxAccepted - Math.pow(0.1, precision)).toString()
    }
    return result
}

// Will also display very small numbers
function formatSmall(x, precision=2) { 
    return format(x, precision, true)    
}

function invertOOM(x){
    let e = x.log10().ceil()
    let m = x.div(Decimal.pow(10, e))
    e = e.neg()
    x = new Decimal(10).pow(e).times(m)

    return x
}

// Code for buying stuff
function buyGenerator(i) {
    let g = generators[i - 1]
    if (g.cost.gt(points)) return
    points = points.sub(g.cost)
    g.amount = g.amount.add(1)
    g.bought = g.bought.add(1)
    g.mult = g.mult.mul(1.1)
    g.cost = g.cost.mul(new Decimal(1.5).pow(i))
}
function buyTimeGenerator(i) {
    let g = timeGenerators[i - 1]
    if (g.cost.gt(points)) return
    points = points.sub(g.cost)
    g.amount = g.amount.add(1)
    g.bought = g.bought.add(1)
    g.mult = g.mult.mul(1.05)
    g.cost = g.cost.mul(new Decimal(3).pow(i))
}

// Well, it... updates the GUI... what else do you want?
function updateGUI() {
    var diff = new Decimal((Date.now() - lastUpdate));
    lastUpdate = Date.now();
    document.getElementById("points").textContent = "You have " + format(points) + " points";
    document.getElementById("pointgen").textContent = "(+" + format(generators[0].amount.mul(generators[0].mult.mul(diff.mul(timespeed))).div(50)) + "/s)";
    document.getElementById("buymax").textContent = "Buy Max";
    for (let i = 0; i < 20; i++) {
        let g = generators[i];
        document.getElementById("gen" + (i + 1)).innerHTML = "Generator " + (i + 1) + "<br>Amount: " + format(g.amount) + "<br>Bought: " + format(g.bought) + "<br>Mult: x" + format(g.mult) + "<br>Cost: " + format(g.cost) + " points";
        if (g.cost.gt(points)) document.getElementById("gen" + (i + 1)).classList.add("locked");
        else document.getElementById("gen" + (i + 1)).classList.remove("locked");
    }
    document.getElementById("timespeed").textContent = "Time is " + format(timespeed) + "x faster";
    for (let i = 0; i < 16; i++) {
        let g = timeGenerators[i];
        document.getElementById("tgen" + (i + 1)).innerHTML = "Time Generator " + (i + 1) + "<br>Amount: " + format(g.amount) + "<br>Bought: " + format(g.bought) + "<br>Mult: x" + format(g.mult) + "<br>Cost: " + format(g.cost) + " points";
        if (g.cost.gt(points)) document.getElementById("tgen" + (i + 1)).classList.add("locked");
        else document.getElementById("tgen" + (i + 1)).classList.remove("locked");
    }

    // Update prestige points display
    document.getElementById("prestige-points").textContent = "Prestige Points: " + format(prestigePoints) + ", which are multiplying generator effect by " + format(prestigePoints.sqrt());
}

// Buy max stuff
function buyMax() {
    for(let i = 0; i < 20; i++) {
        while (points.gte(generators[i].cost)) buyGenerator(i + 1)
    }
    for(let i = 0; i < 16; i++) {
        while (points.gte(timeGenerators[i].cost)) buyTimeGenerator(i + 1)
    }
}

// number go up thingy lol
function onTick(diff) {
    diff = new Decimal(diff);
    let timeSpeedDiff = diff.mul(timespeed);
    points = points.add(generators[0].amount.mul(generators[0].mult.mul(timeSpeedDiff)));
    for (let i = 1; i < 20; i++) {
        let genMultDiff = generators[i].mult.mul(timeSpeedDiff.div(5));
        generators[i - 1].amount = generators[i - 1].amount.add(generators[i].amount.mul(genMultDiff));
    }
    timespeed = timespeed.add(timeGenerators[0].amount.mul(timeGenerators[0].mult.mul(diff)));
    for (let i = 1; i < 16; i++) {
        let timeGenMultDiff = timeGenerators[i].mult.mul(diff.div(5));
        timeGenerators[i - 1].amount = timeGenerators[i - 1].amount.add(timeGenerators[i].amount.mul(timeGenMultDiff));
    }
}

function mainLoop() {
    var diff = (Date.now() - lastUpdate) / 1000
    onTick(diff)
    updateGUI()
    checkAchievements()
    lastUpdate = Date.now()
}

// Save and load game progress
function saveGame() {
    const gameState = {
        points: points.toString(),
        timespeed: timespeed.toString(),
        generators: generators.map(g => ({
            cost: g.cost.toString(),
            bought: g.bought.toString(),
            amount: g.amount.toString(),
            mult: g.mult.toString()
        })),
        timeGenerators: timeGenerators.map(g => ({
            cost: g.cost.toString(),
            bought: g.bought.toString(),
            amount: g.amount.toString(),
            mult: g.mult.toString()
        })),
        lastUpdate: lastUpdate,
        achievements: achievements.map(a => ({ ...a })),
        prestigePoints: prestigePoints.toString(),
        soundEnabled: soundEnabled,
        updateFrequency: updateFrequency
    };
    localStorage.setItem('incrementalGameState', JSON.stringify(gameState));
}

function loadGame() {
    const savedGame = localStorage.getItem('incrementalGameState');
    if (savedGame) {
        const gameState = JSON.parse(savedGame);
        points = new Decimal(gameState.points);
        timespeed = new Decimal(gameState.timespeed);
        generators = gameState.generators.map(g => ({
            cost: new Decimal(g.cost),
            bought: new Decimal(g.bought),
            amount: new Decimal(g.amount),
            mult: new Decimal(g.mult)
        }));
        timeGenerators = gameState.timeGenerators.map(g => ({
            cost: new Decimal(g.cost),
            bought: new Decimal(g.bought),
            amount: new Decimal(g.amount),
            mult: new Decimal(g.mult)
        }));
        lastUpdate = gameState.lastUpdate;
        achievements = gameState.achievements;
        prestigePoints = new Decimal(gameState.prestigePoints);
        soundEnabled = gameState.soundEnabled;
        updateFrequency = gameState.updateFrequency;

        document.getElementById("toggle-sound").checked = soundEnabled;
        document.getElementById("update-frequency").value = updateFrequency;
    }
}

// Call saveGame periodically
setInterval(saveGame, 30000); // Save every 30 seconds

// Load game state when the page loads
window.onload = function() {
    loadGame();
    document.getElementById("buymax").addEventListener("click", buyMax);
    document.getElementById("prestige-button").addEventListener("click", prestige);
};

//Prestige System
function calculatePrestigePoints() {
    return points.slog(10).pow(points.slog(10)).sqrt();
}
function prestige() {
    let earnedPrestigePoints = calculatePrestigePoints();
    if (earnedPrestigePoints.gt(0)) {
        prestigePoints = prestigePoints.add(earnedPrestigePoints);
        points = new Decimal(10);
        timespeed = new Decimal(1);
        generators.forEach(g => {
            g.cost = new Decimal(10).pow(g.cost.log10().floor().pow(2)).mul(10);
            g.bought = new Decimal(0);
            g.amount = new Decimal(0);
            g.mult = new Decimal(1).mul(prestigePoints.sqrt());
        });
        timeGenerators.forEach(g => {
            g.cost = new Decimal(10).pow(g.cost.log10().floor().pow(3)).mul(10000);
            g.bought = new Decimal(0);
            g.amount = new Decimal(0);
            g.mult = new Decimal(0.01).mul(prestigePoints.sqrt());
        });
        achievements.forEach(a => a.unlocked = false);
        lastUpdate = Date.now();
        updateGUI();
        alert(`You prestiged and earned ${earnedPrestigePoints} prestige points!`);
    } else {
        alert("You don't have enough points to prestige. Check back later.");
    }
}

// Settings stuff
document.getElementById("toggle-sound").addEventListener("change", function() {
    soundEnabled = this.checked;
});

document.getElementById("update-frequency").addEventListener("input", function() {
    updateFrequency = parseInt(this.value);
    clearInterval(mainLoopInterval);
    clearInterval(updateGUIInterval);
    mainLoopInterval = setInterval(mainLoop, updateFrequency);
    updateGUIInterval = setInterval(updateGUI, updateFrequency);
});

function resetGame() {
    if (confirm("Are you sure you want to reset the game? This will erase all progress.")) {
        localStorage.removeItem('incrementalGameState');
        location.reload();
    }
}

// Initialize intervals
var mainLoopInterval = setInterval(mainLoop, updateFrequency);

updateGUI()