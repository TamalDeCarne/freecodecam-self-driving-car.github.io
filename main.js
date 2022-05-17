//Draw car canvas
const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

//Drawing car and neuronal network
const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");
//Create road
const road = new Road(carCanvas.width/2, carCanvas.width*0.9);
//Car dimensions
const N = 500;
const cars = generateCars(N);

let bestCar = cars[0];
if(localStorage.getItem("bestBrain")){
    for(let i=0; i<cars.length; i++){
        cars[i].brain = JSON.parse(
            localStorage.getItem("bestBrain")
        );
        if(i!=0){
            NeuralNetwork.mutate(cars[i].brain, 0.2);
        }
    }
}
//Adding Traffic
const traffic = [
    new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(0), -500, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(1), -500, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(1), -700, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(2), -700, 30, 50, "DUMMY", 3, getRandomColor())
];

//Start to do the animation of the car movement
animate();

//Saves best brain
function save(){
    localStorage.setItem("bestBrain",
        JSON.stringify(bestCar.brain));
}

//Deletes saved best brain
function discard(){
    localStorage.removeItem("bestBrain");
}

//Generates ghost cars
function generateCars(N){
    const cars = [];

    for(let i=1; i<=N; i++){
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
    }

    return cars;
}

function animate(time){
    for(let i=0; i<traffic.length; i++){
        traffic[i].update(road.borders, []);
    }
    //giving car movement and provide road borders
    for (let i=0; i<cars.length; i++){
        cars[i].update(road.borders, traffic);
    }

    bestCar=cars.find(
        c=>c.y==Math.min(
            ...cars.map(c=>c.y)
        ));
    //Creating canvas height
    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;
    //Camara following Car
    carCtx.save();
    carCtx.translate(0, -bestCar.y + carCanvas.height*0.7);
    //Creating Road and Car
    road.draw(carCtx);
    //Draws traffic cars
    for(let i=0; i<traffic.length; i++){
        traffic[i].draw(carCtx, "blue");
    }
    //Set the ghost alpha
    carCtx.globalAlpha = 0.2;
    //Draws ghost cars
    for (let i=0; i<cars.length; i++){
        cars[i].draw(carCtx);
    }
    //Sets the main car alpha
    carCtx.globalAlpha = 1;
    //Draws default car
    bestCar.draw(carCtx, true);
    //Start the animation
    carCtx.restore();
    //Gives animation to neuronal network
    networkCtx.lineDashOffset = -time/50;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
    requestAnimationFrame(animate);
}