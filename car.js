//Define Car properties
class Car{
    //Will get Car properties
    constructor(x, y, width, height, controlType, maxSpeed=4, color="blue"){
        //hitbox attributes
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        //speed and acc attributes
        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        //angle attributes
        this.angle = 0;
        //adding damage attribute
        this.damaged = false;

        this.useBrain = controlType=="AI";

        //adding sensors to car to AI car
        if(controlType != "DUMMY"){
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork(
                [this.sensor.rayCount, 6, 4]
            );
        }
        //movements attributes
        this.controls = new Controls(controlType);

        //Refer image
        this.img = new Image();
        this.img.src = "img/Car.PNG";

        //Add color
        this.mask = document.createElement("canvas");
        this.mask.width = width;
        this.mask.height = height;

        //Draw car in the mini canvas
        const maskCtx = this.mask.getContext("2d");
        this.img.onload=()=>{
            maskCtx.fillStyle=color;
            maskCtx.rect(0,0,this.width,this.height);
            maskCtx.fill();

            maskCtx.globalCompositeOperation="destination-atop";
            maskCtx.drawImage(this.img, 0,0,this.width,this.height);
        }

    }

    update(roadBorders, traffic){
        if(!this.damaged){
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, traffic);
        }
        if(this.sensor){
            this.sensor.update(roadBorders, traffic);
            const offsets = this.sensor.readings.map(
                s=>s==null?0:1-s.offset
            );
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);

            if(this.useBrain){
                this.controls.forward = outputs[0];
                this.controls.left = outputs[1];
                this.controls.right = outputs[2];
                this.controls.reverse = outputs[3];
            }
        }
    }


    #assessDamage(roadBorders, traffic){
        for(let i=0; i<roadBorders.length; i++){
            if(polysIntersect(this.polygon,roadBorders[i])){
                return true;
            }
        }
        for(let i=0; i<traffic.length; i++){
            if(polysIntersect(this.polygon, traffic[i].polygon)){
                return true;
            }
        }
    }

    #createPolygon(){
        //Create a private function so we can define car corners
        const points=[];
        //Need a radius from the center point
        const rad = Math.hypot(this.width, this.height) / 2;
        //Alpha point (center)
        const alpha = Math.atan2(this.width, this.height);
        //First point Top+Right Corner
        points.push({
            x:this.x - Math.sin(this.angle-alpha) * rad,
            y:this.y - Math.cos(this.angle-alpha) * rad
        });
        //Second point Top+Left Corner
        points.push({
            x:this.x - Math.sin(this.angle + alpha) * rad,
            y:this.y - Math.cos(this.angle + alpha) * rad
        });
        //Third point Bottom+Right Corner
        points.push({
            x:this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y:this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        //Fourth point Bottom+Left Corner
        points.push({
            x:this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y:this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }

    #move(){
        if(this.controls.forward){
            this.speed+=this.acceleration;
        }
        if(this.controls.reverse){
            this.speed-=this.acceleration;
        }
        //Set limits to car
        if(this.speed>this.maxSpeed){
            this.speed=this.maxSpeed;
        }
        if(this.speed<-this.maxSpeed/2){
            this.speed=-this.maxSpeed/2;
        }

        if(this.speed>0){
            this.speed-= this.friction;
        }
        if(this.speed<0){
            this.speed+= this.friction;
        }

        if(Math.abs(this.speed)<this.friction){
            this.speed=0;
        }

        if(this.speed!=0){
            //this operations defines if the car is moving forward or reverse
            //so we can flip the left and right controls
            const flip = this.speed>0?1:-1;
            if(this.controls.left){
                this.angle+=0.03*flip;
            }
            if(this.controls.right){
                this.angle-=0.03*flip;
            }
        }

        //makes car able to move in any direction
        this.x-=Math.sin(this.angle)*this.speed;
        this.y-=Math.cos(this.angle)*this.speed;
    }

    //Draw car with 2D context
    draw(ctx, drawSensor=false){
        
        if(this.sensor && drawSensor){
            this.sensor.draw(ctx);
        }
        
        /*
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x,this.polygon[0].y);
        for(let i=1;i<this.polygon.length;i++){
            ctx.lineTo(this.polygon[i].x,this.polygon[i].y);
        }
        ctx.fill();*/
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);
        if(!this.damaged){
            ctx.drawImage(
                this.mask,
                -this.width/2,
                -this.height/2,
                this.width,
                this.height
            );
            ctx.globalCompositeOperation="multiply";   
        }
        ctx.drawImage(
            this.img,
            -this.width/2,
            -this.height/2,
            this.width,
            this.height
        );
        ctx.restore();
    }
}