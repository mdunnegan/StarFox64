
// acts as a main function
var game = function(){

	var renderer;
	var ship;
	var terrainGenerator;
	var scene;
	var camera;
	var collosionDetector; 

	var draw = function(){
		renderer.render(scene, camera);

		// loop draw function call
		updateCameraAndShipPositionOnZAxis();

		ship.handleInput();

		if (collosionDetector.detectCollision()){
			this.endGame();
		}

		terrainGenerator.generateNextTileIfNeeded(ship.getZPosition(), scene);

		requestAnimationFrame(draw);
	};

	var createScene = function(){
		scene = new THREE.Scene();
	
		var WIDTH = 960, HEIGHT = 540;

		var VIEW_ANGLE = 70,
		    ASPECT = WIDTH / HEIGHT,
		    NEAR = 0.1,
		    FAR = 10000;

		// RENDERER
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(WIDTH, HEIGHT);
		var c = document.getElementById("gameCanvas");
		c.appendChild(renderer.domElement);

		// CAMERA
		camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
		scene.add(camera);
		camera.position.z = 30;
		camera.position.y = 20;

		// LIGHT
		var light = new THREE.DirectionalLight( 0xffffff );
	    light.position.set( 0, 1, 1 ).normalize();
	    scene.add(light);

	    var secondLight = new THREE.DirectionalLight( 0xff99ff );
	    camera.add(secondLight);


	    // TERRAIN GENERATOR
		terrainGenerator = new TerrainGenerator();
		terrainGenerator.generateInitialTiles(scene);

		// SPACESHIP
		ship = new Spaceship();
		ship.applyTexture();
		ship.setInitialPosition();

		console.log(ship);
		scene.add(ship.model);

	};

	var initializeCollisionDetector = function(){
		collosionDetector = new CollisionDetector(ship.model, terrainGenerator, terrainGenerator.activeTerrain, 
												  terrainGenerator.getObstacleGenerator().activeObstacles);
	}

	var endGame = function(){
		console.log("There was a collision and you died lol")
	}

	var updateCameraAndShipPositionOnZAxis = function(){
		camera.position.z -= 1;
		//camera.rotation.y = 90;
		ship.getModel().position.z -= 1;
	};

	(function main(){
		createScene();
		initializeCollisionDetector();
		draw();
	})();

};

// function initTextures() {
//   cubeTexture = gl.createTexture();
//   cubeImage = new Image();
//   cubeImage.onload = function() { handleTextureLoaded(cubeImage, cubeTexture); }
//   cubeImage.src = "cubetexture.png";
// }

function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function CollisionDetector(shipMesh, terrainList, obstacleList){
	this.ship = shipMesh;
	this.activeTerrainList = terrainList;
	this.activeObstacleList = obstacleList;
}

CollisionDetector.prototype = {

	detectCollision: function(){
		return false;
	}

}

function ObstacleGenerator(){
	this.activeObstacles = [];
	this.obstacleGeometries = [new THREE.CubeGeometry(10, 10, 10)];
	this.obstacleMaterials = [new THREE.MeshNormalMaterial()]
}

ObstacleGenerator.prototype = {
	constructor: ObstacleGenerator,

	generateObstacles: function(zCoordinateOfTile, scene){

		// 'i' will be an index for choosing objects
		var i = 0;
		obstacle = new THREE.Mesh(this.obstacleGeometries[i], this.obstacleMaterials[i]);
		//obstacle.position.x = // random between -400 and 0?

		obstacle.position.x = (Math.random() * 200) - 100;

		obstacle.position.y = 5;
		obstacle.position.z = -zCoordinateOfTile;

		this.activeObstacles.push(obstacle);
	    this.activeObstacles.shift();

		scene.add(obstacle);

	}
}

function TerrainGenerator(){
	this.zRenderingPosition = 0;
	this.activeTerrain = [];
	this.sizeOfTerrain = 100;
	this.obstacleGenerator = new ObstacleGenerator();

	this.terrainGeometry = new THREE.CubeGeometry(10, 10, 1);
	this.terrainMaterial = new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture('textures/sand.jpg') } );

	this.loader = new THREE.JSONLoader();

}

TerrainGenerator.prototype = {
	constructor: TerrainGenerator,

	getActiveTerrain: function(){
		return this.activeTerrain;
	},

	getObstacleGenerator: function(){
		return this.obstacleGenerator;
	},

	generateInitialTiles: function(scene){
		this.generateNextTile(scene);
		this.generateNextTile(scene);
		this.generateNextTile(scene);
		this.generateNextTile(scene);
	},

	generateNextTileIfNeeded: function(shipPosition, scene){
		if (this.nextTileNeeded(shipPosition)){
			this.generateNextTile(scene);
		}
	},

	nextTileNeeded: function(ZpositionOfShip){
		if (ZpositionOfShip % this.sizeOfTerrain == 0){
			return true;
		}
	},

	generateNextTile: function(scene){

		var START = -200;
		var END = 200;

	    for (var i = START; i <= END; i+=100){

	    	var AT = this.getActiveTerrain();
	    	var zPos = this.zRenderingPosition;

	  		this.loader.load(
				// resource URL
				'textures/ruggedTerrain3.json',

				// Function when resource is loaded
				function (geometry) {

					var material = new THREE.MeshPhongMaterial({
						color:0xffffff, 
						map: THREE.ImageUtils.loadTexture( 'textures/sand.jpg'),
						bumpMap: THREE.ImageUtils.loadTexture('textures/sandBumpMap.jpg'),
						bumpScale: 0.5
					});

					var object1 = new THREE.Mesh(geometry, material);

					object1.position.y = -150;
					object1.position.z = -zPos-400;
					object1.position.x = i-400; // i - a random number between 0 and 200
					object1.position.x = i - (Math.random() * 400) + 100;

					object1.scale.set(100,100,100);

					object1.rotation.y = (Math.floor(Math.random() * 4) + 1) * 90; 

					AT.push(object1);
					AT.shift();
					
					scene.add(object1);
				}
			);
	    }
	    this.obstacleGenerator.generateObstacles(this.zRenderingPosition, scene);
		this.zRenderingPosition += 100;
	}
}

function Spaceship(){
	var model;
}

Spaceship.prototype = {
	constructor: Spaceship,

	getModel: function(){
		return this.model;
	},

	getZPosition: function(){
		return this.model.position.z;
	},

	getXPosition: function(){
		return this.model.position.x;
	},

	getYPosition: function(){
		return this.model.position.y;
	},

	setInitialPosition: function(){
		this.model.position.z = -10;
    	this.model.position.y = 25;
	},

	applyTexture: function(){
		var geometry = new THREE.CubeGeometry(5, 5, 10);
	  	var material = new THREE.MeshNormalMaterial()
	    this.model = new THREE.Mesh(geometry, material);
	},

	handleInput: function(){
		if (Key.isDown(Key.A)){
			this.model.position.x -= 1;
			this.model.rotation.z += .01;
			// make the camera move down too?
		}
		if (Key.isDown(Key.D)) {
			this.model.position.x += 1;
			this.model.rotation.z -= .01;
		} 
		if (Key.isDown(Key.S)) {
			this.model.position.y -= 1;
			this.model.rotation.x -= .01;
	   	} 
	   	if (Key.isDown(Key.W)) {
			this.model.position.y += 1;
			this.model.rotation.x += .01;
		}
	}
}

