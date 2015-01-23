
(function ($) {

    $.fn.ThreeDiPlot = function(options){

        //Graph canvas
        var gr = this;

        //Options
        var optDefault = {
            bgColor: 0xFAF8DF,
            xOrig: -2.5,
            zOrig: -2.5,
            size: 5
        };

        var opt = $.extend(optDefault, options);

        var x0 = opt.xOrig, z0 = opt.zOrig, size = opt.size;

        var graphGeometry;

        var labels = new Array();


        //Create a THREE Scene
        var scene = new THREE.Scene();
        scene.lookAt(0, 1, 0);

        //Camera Setup
        var SCREEN_WIDTH = gr.innerWidth(),
            SCREEN_HEIGHT = gr.innerHeight();
        var VIEW_ANGLE = 30,
            ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
            NEAR = 0.1, FAR = 20000;
        var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
        camera.position.set(1.9*size, size, 1.2*size);
        scene.add(camera);

        //THREE Renderer
        //if (Detector.webgl)
        var renderer = new THREE.WebGLRenderer({ antialias: true, alpha:true });
        //else
        //    renderer = new THREE.CanvasRenderer();
        renderer.setClearColor(opt.bgColor, 1); // Set the background color
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        gr.append(renderer.domElement);


        //Controls
        var controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.center.set(x0 + size / 2, z0 + size / 2, 0);

        //Set and create the grids

        //Add the axis
        scene.add(new THREE.AxisHelper(5));



        createGraph();



        createGrids();

        createText();

        render();



        function createText() {

            for (var pos = size/2; pos >= -size/2; pos-=size/10)
                addLabel(pos, new THREE.Vector3(1.01*size+x0, pos, z0));

        }
     
        function addLabel(string, position) {
           
            var textMesh;

            var textGeom = new THREE.TextGeometry(string,
            {
                size: 0.17, height: 0.008, curveSegments: 3,
                font: "droid sans", weight: "normal", style: "normal"
                //bevelThickness: 1, bevelSize: 2, bevelEnabled: true,
                //material: 0, extrudeMaterial: 1
            });
            // font: helvetiker, gentilis, droid sans, droid serif, optimer
            // weight: normal, bold

            var textMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
            textMesh = new THREE.Mesh(textGeom, textMaterial);


            textMesh.position.set(position.getComponent(0),position.getComponent(1),position.getComponent(2));
            labels.push(textMesh);
            scene.add(textMesh);
        }

        function textLookAt() {
            for (var i = 0; i < labels.length; i++) labels[i].lookAt(camera.position);
        }

        //Add all the label numbers on the grid
        function addNumbers() { };


        //Render function
        function render() {
            requestAnimationFrame(render);
           
            //moveCamera();
            //cube.rotation.x += 0.1;
            textLookAt();
            controls.update();
            renderer.render(scene, camera);
        };


        //function moveCamera() {
        //    var x = camera.position.getComponent(0);
        //    var y = camera.position.getComponent(1);
        //    var z = camera.position.getComponent(2);
        //    var l = Math.sqrt(x*x + z*z);
        //    var ang = Math.atan(z / x) + 0.002;
        //    console.log(ang);
        //    camera.position.set(l*Math.cos(ang),y,l*Math.sin(ang) );
        //}


        function createGraph() {


            var segments = 40;
            var meshFunction = function (x, y) {
                x = size * x + x0;
                y = size * y + z0;
                var z = 0.5 * Math.sin(Math.sqrt(20 * x * x + 20 * y * y));//= Math.cos(x) * Math.sqrt(y);
                if (isNaN(z))
                    return new THREE.Vector3(0, 0, 0); // TODO: better fix
                else
                    return new THREE.Vector3(x, z, y);
            };

            // true => sensible image tile repeat...
            graphGeometry = new THREE.ParametricGeometry(meshFunction, segments, segments, true);

            ///////////////////////////////////////////////
            // calculate vertex colors based on Z values //
            ///////////////////////////////////////////////

            graphGeometry.computeBoundingBox();
            var zMin = graphGeometry.boundingBox.min.y;
            var zMax = graphGeometry.boundingBox.max.y;
            zRange = zMax - zMin;
            var color, point, face, numberOfSides, vertexIndex;
            // faces are indexed using characters
            var faceIndices = ['a', 'b', 'c', 'd'];
            // first, assign colors to vertices as desired
            for (var i = 0; i < graphGeometry.vertices.length; i++) {
                point = graphGeometry.vertices[i];
                color = new THREE.Color(0x00ff00);
                color.setHSL(0.575, 0.62, 0.9 - 0.7 * (zMax - point.y) / zRange);
                graphGeometry.colors[i] = color; // use this array for convenience
            }
            // copy the colors as necessary to the face's vertexColors array.
            for (var i = 0; i < graphGeometry.faces.length; i++) {
                face = graphGeometry.faces[i];
                numberOfSides = (face instanceof THREE.Face3) ? 3 : 4;
                for (var j = 0; j < numberOfSides; j++) {
                    vertexIndex = face[faceIndices[j]];
                    face.vertexColors[j] = graphGeometry.colors[vertexIndex];
                }
            }
            ///////////////////////
            // end vertex colors //
            ///////////////////////

            // material choices: vertexColorMaterial, wireMaterial , normMaterial , shadeMaterial
            var wireMaterial = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, side: THREE.DoubleSide, wireframe: true, transparent: false });


            //if (graphMesh) {
            //    scene.remove(graphMesh);
            //     renderer.deallocateObject( graphMesh );
            //}


            var graphMesh = new THREE.Mesh(graphGeometry, wireMaterial);
            graphMesh.doubleSided = true;
            scene.add(graphMesh);
        }

        function createGrids() {

            var step = size / 10;

            var gridXY = new THREE.GridHelper(size/2, step);
            gridXY.position.set(z0, 0, 0);
            gridXY.rotation.z = Math.PI / 2;
            gridXY.setColors(new THREE.Color(0x000066), new THREE.Color(0xaaaaaa));
            scene.add(gridXY);

            var gridYZ = new THREE.GridHelper(size/2, step);
            gridYZ.position.set(0, 0, x0);
            gridYZ.rotation.x = Math.PI / 2;
            gridYZ.setColors(new THREE.Color(0x660000), new THREE.Color(0xaaaaaa));
            scene.add(gridYZ);


        }
    };

}(jQuery));